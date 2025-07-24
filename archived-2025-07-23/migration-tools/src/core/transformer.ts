import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { format } from 'prettier';
import { 
  TransformContext, 
  TransformResult, 
  TransformationRule 
} from '../types/index.js';
import { hookTransformRules } from '../rules/hooks.js';
import { jsxTransformRules } from '../rules/jsx.js';

export class ReactToVueTransformer {
  private rules: TransformationRule[];
  
  constructor() {
    this.rules = [...hookTransformRules, ...jsxTransformRules];
  }
  
  async transform(reactCode: string, options: {
    typescript?: boolean;
    componentName?: string;
  } = {}): Promise<TransformResult> {
    try {
      // Parse React component
      const ast = parse(reactCode, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'optionalChaining',
          'nullishCoalescingOperator'
        ]
      });
      
      // Initialize context
      const context: TransformContext = {
        imports: new Set<string>(),
        props: new Map(),
        state: new Map(),
        effects: [],
        refs: new Map(),
        methods: new Map(),
        computed: new Map(),
        componentName: options.componentName || 'Component',
        typescript: options.typescript || false
      };
      
      // Extract component info
      let componentBody = '';
      let propsInterface = '';
      
      traverse(ast, {
        // Extract props interface
        TSInterfaceDeclaration(path) {
          if (path.node.id.name === 'Props' || path.node.id.name.endsWith('Props')) {
            propsInterface = this.extractPropsInterface(path.node, context);
          }
        },
        
        // Extract component function
        FunctionDeclaration(path) {
          const name = path.node.id?.name;
          if (name && (name === context.componentName || name.startsWith('use'))) {
            componentBody = this.extractComponentBody(path.node, context);
          }
        },
        
        // Extract arrow function components
        VariableDeclarator(path) {
          if (t.isIdentifier(path.node.id) && 
              path.node.id.name === context.componentName &&
              t.isArrowFunctionExpression(path.node.init)) {
            componentBody = this.extractComponentBody(path.node.init, context);
          }
        }
      });
      
      // Apply transformation rules
      for (const rule of this.rules) {
        traverse(ast, {
          enter(path) {
            if (rule.detect(path.node)) {
              const result = rule.transform(path.node, context);
              // Store transformation result
            }
          }
        });
      }
      
      // Generate Vue SFC
      const vueSFC = await this.generateVueSFC(context, componentBody, propsInterface);
      
      return {
        success: true,
        output: vueSFC,
        stats: {
          linesOfCode: vueSFC.split('\n').length,
          componentsTransformed: 1,
          hooksTransformed: context.state.size + context.effects.length,
          propsTransformed: context.props.size
        }
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  private extractPropsInterface(node: any, context: TransformContext): string {
    // Extract props from TypeScript interface
    node.body.body.forEach((prop: any) => {
      if (t.isTSPropertySignature(prop) && t.isIdentifier(prop.key)) {
        const propName = prop.key.name;
        const propType = this.getTSType(prop.typeAnnotation);
        const required = !prop.optional;
        
        context.props.set(propName, propType);
      }
    });
    
    return '';
  }
  
  private extractComponentBody(node: any, context: TransformContext): string {
    // Extract return statement JSX
    let returnJSX = '';
    
    traverse(node, {
      ReturnStatement(path) {
        if (t.isJSXElement(path.node.argument) || t.isJSXFragment(path.node.argument)) {
          returnJSX = this.transformJSX(path.node.argument, context);
          path.stop();
        }
      }
    }, node);
    
    return returnJSX;
  }
  
  private transformJSX(node: any, context: TransformContext): string {
    // Simplified JSX transformation
    return '<div><!-- Transformed JSX --></div>';
  }
  
  private getTSType(typeAnnotation: any): string {
    if (!typeAnnotation || !typeAnnotation.typeAnnotation) return 'any';
    
    const type = typeAnnotation.typeAnnotation;
    if (t.isTSStringKeyword(type)) return 'string';
    if (t.isTSNumberKeyword(type)) return 'number';
    if (t.isTSBooleanKeyword(type)) return 'boolean';
    if (t.isTSArrayType(type)) return 'Array<any>';
    if (t.isTSTypeReference(type) && t.isIdentifier(type.typeName)) {
      return type.typeName.name;
    }
    
    return 'any';
  }
  
  private async generateVueSFC(
    context: TransformContext, 
    template: string,
    propsInterface: string
  ): Promise<string> {
    // Generate imports
    const vueImports = Array.from(context.imports).join(', ');
    const importStatement = vueImports ? `import { ${vueImports} } from 'vue';` : '';
    
    // Generate props definition
    const propsDefinition = this.generatePropsDefinition(context);
    
    // Generate state declarations
    const stateDeclarations = Array.from(context.state.values())
      .map(state => {
        const fn = state.isReactive ? 'reactive' : 'ref';
        return `const ${state.name} = ${fn}(${state.initialValue});`;
      })
      .join('\n');
    
    // Generate computed properties
    const computedDeclarations = Array.from(context.computed.values())
      .map(comp => `const ${comp.name} = computed(() => ${comp.body});`)
      .join('\n');
    
    // Generate methods
    const methodDeclarations = Array.from(context.methods.values())
      .map(method => {
        const async = method.isAsync ? 'async ' : '';
        const params = method.params.join(', ');
        return `const ${method.name} = ${async}(${params}) => ${method.body};`;
      })
      .join('\n');
    
    // Generate effects
    const effectDeclarations = context.effects
      .map(effect => {
        if (effect.dependencies.length === 0) {
          return `onMounted(() => ${effect.body});`;
        } else if (effect.dependencies.length === 1) {
          return `watch(${effect.dependencies[0]}, () => ${effect.body});`;
        } else {
          return `watch([${effect.dependencies.join(', ')}], () => ${effect.body});`;
        }
      })
      .join('\n');
    
    const sfc = `<template>
  ${template}
</template>

<script setup${context.typescript ? ' lang="ts"' : ''}>
${importStatement}

${propsInterface ? `// Props interface\n${propsInterface}\n` : ''}
${propsDefinition}

${stateDeclarations}

${computedDeclarations}

${methodDeclarations}

${effectDeclarations}
</script>

<style scoped>
/* Add component styles here */
</style>`;
    
    // Format with Prettier
    try {
      return await format(sfc, {
        parser: 'vue',
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        printWidth: 100
      });
    } catch {
      return sfc;
    }
  }
  
  private generatePropsDefinition(context: TransformContext): string {
    if (context.props.size === 0) return '';
    
    const props = Array.from(context.props.entries())
      .map(([name, type]) => `  ${name}: ${type}`)
      .join(',\n');
    
    return context.typescript 
      ? `const props = defineProps<{\n${props}\n}>();`
      : `const props = defineProps({\n${props}\n});`;
  }
}