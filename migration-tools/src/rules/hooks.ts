import { TransformationRule, TransformContext } from '../types/index.js';
import * as t from '@babel/types';

export const useStateTransform: TransformationRule = {
  name: 'useState-to-ref',
  description: 'Transform React useState to Vue ref/reactive',
  detect: (node) => {
    return t.isCallExpression(node) &&
      t.isIdentifier(node.callee) &&
      node.callee.name === 'useState';
  },
  transform: (node, context) => {
    const parent = node.parent;
    if (!t.isVariableDeclarator(parent)) return '';
    
    const id = parent.id;
    if (!t.isArrayPattern(id) || id.elements.length !== 2) return '';
    
    const [stateVar, setterVar] = id.elements;
    if (!t.isIdentifier(stateVar) || !t.isIdentifier(setterVar)) return '';
    
    const stateName = stateVar.name;
    const initialValue = node.arguments[0] ? generateCode(node.arguments[0]) : 'null';
    const isObject = node.arguments[0] && t.isObjectExpression(node.arguments[0]);
    
    context.state.set(stateName, {
      name: stateName,
      type: 'any', // Would need type inference
      initialValue,
      isReactive: isObject
    });
    
    context.imports.add(isObject ? 'reactive' : 'ref');
    
    // Generate the state declaration
    return isObject 
      ? `const ${stateName} = reactive(${initialValue})`
      : `const ${stateName} = ref(${initialValue})`;
  }
};

export const useEffectTransform: TransformationRule = {
  name: 'useEffect-to-watch',
  description: 'Transform React useEffect to Vue watch/watchEffect/onMounted',
  detect: (node) => {
    return t.isCallExpression(node) &&
      t.isIdentifier(node.callee) &&
      node.callee.name === 'useEffect';
  },
  transform: (node, context) => {
    const [effectFn, deps] = node.arguments;
    
    if (!effectFn || !t.isArrowFunctionExpression(effectFn)) return '';
    
    const body = generateCode(effectFn.body);
    const hasCleanup = t.isReturnStatement(effectFn.body.body[effectFn.body.body.length - 1]);
    
    // No dependencies = onMounted
    if (!deps) {
      context.imports.add('onMounted');
      return `onMounted(() => {${body}})`;
    }
    
    // Empty dependencies = onMounted
    if (t.isArrayExpression(deps) && deps.elements.length === 0) {
      context.imports.add('onMounted');
      return `onMounted(() => {${body}})`;
    }
    
    // With dependencies = watch
    if (t.isArrayExpression(deps) && deps.elements.length > 0) {
      const dependencies = deps.elements
        .map(el => t.isIdentifier(el) ? el.name : '')
        .filter(Boolean);
      
      context.imports.add('watch');
      
      if (dependencies.length === 1) {
        return `watch(${dependencies[0]}, () => {${body}})`;
      } else {
        return `watch([${dependencies.join(', ')}], () => {${body}})`;
      }
    }
    
    // Default to watchEffect
    context.imports.add('watchEffect');
    return `watchEffect(() => {${body}})`;
  }
};

export const useCallbackTransform: TransformationRule = {
  name: 'useCallback-to-computed',
  description: 'Transform React useCallback to Vue computed or method',
  detect: (node) => {
    return t.isCallExpression(node) &&
      t.isIdentifier(node.callee) &&
      node.callee.name === 'useCallback';
  },
  transform: (node, context) => {
    const parent = node.parent;
    if (!t.isVariableDeclarator(parent) || !t.isIdentifier(parent.id)) return '';
    
    const callbackName = parent.id.name;
    const [callbackFn, deps] = node.arguments;
    
    if (!callbackFn || !t.isArrowFunctionExpression(callbackFn)) return '';
    
    const params = callbackFn.params.map(p => t.isIdentifier(p) ? p.name : '').join(', ');
    const body = generateCode(callbackFn.body);
    const isAsync = callbackFn.async;
    
    context.methods.set(callbackName, {
      name: callbackName,
      params: params.split(', ').filter(Boolean),
      body,
      isAsync
    });
    
    return `const ${callbackName} = ${isAsync ? 'async ' : ''}(${params}) => {${body}}`;
  }
};

export const useMemoTransform: TransformationRule = {
  name: 'useMemo-to-computed',
  description: 'Transform React useMemo to Vue computed',
  detect: (node) => {
    return t.isCallExpression(node) &&
      t.isIdentifier(node.callee) &&
      node.callee.name === 'useMemo';
  },
  transform: (node, context) => {
    const parent = node.parent;
    if (!t.isVariableDeclarator(parent) || !t.isIdentifier(parent.id)) return '';
    
    const memoName = parent.id.name;
    const [memoFn, deps] = node.arguments;
    
    if (!memoFn || !t.isArrowFunctionExpression(memoFn)) return '';
    
    const body = generateCode(memoFn.body);
    const dependencies = deps && t.isArrayExpression(deps) 
      ? deps.elements.map(el => t.isIdentifier(el) ? el.name : '').filter(Boolean)
      : [];
    
    context.computed.set(memoName, {
      name: memoName,
      dependencies,
      body
    });
    
    context.imports.add('computed');
    return `const ${memoName} = computed(() => {${body}})`;
  }
};

export const useRefTransform: TransformationRule = {
  name: 'useRef-to-ref',
  description: 'Transform React useRef to Vue ref',
  detect: (node) => {
    return t.isCallExpression(node) &&
      t.isIdentifier(node.callee) &&
      node.callee.name === 'useRef';
  },
  transform: (node, context) => {
    const parent = node.parent;
    if (!t.isVariableDeclarator(parent) || !t.isIdentifier(parent.id)) return '';
    
    const refName = parent.id.name;
    const initialValue = node.arguments[0] ? generateCode(node.arguments[0]) : 'null';
    
    context.refs.set(refName, {
      name: refName,
      type: 'any'
    });
    
    context.imports.add('ref');
    return `const ${refName} = ref(${initialValue})`;
  }
};

// Helper function to generate code from AST node
function generateCode(node: any): string {
  // This is a simplified version - in real implementation would use @babel/generator
  if (t.isStringLiteral(node)) return `'${node.value}'`;
  if (t.isNumericLiteral(node)) return String(node.value);
  if (t.isBooleanLiteral(node)) return String(node.value);
  if (t.isNullLiteral(node)) return 'null';
  if (t.isIdentifier(node)) return node.name;
  if (t.isObjectExpression(node)) return '{}'; // Simplified
  if (t.isArrayExpression(node)) return '[]'; // Simplified
  if (t.isBlockStatement(node)) return '{}'; // Simplified
  return '';
}

export const hookTransformRules: TransformationRule[] = [
  useStateTransform,
  useEffectTransform,
  useCallbackTransform,
  useMemoTransform,
  useRefTransform
];