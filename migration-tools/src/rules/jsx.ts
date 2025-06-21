import { TransformationRule, TransformContext } from '../types/index.js';
import * as t from '@babel/types';

export const conditionalRenderTransform: TransformationRule = {
  name: 'conditional-render-to-v-if',
  description: 'Transform JSX conditional rendering to v-if/v-show',
  detect: (node) => {
    return t.isJSXExpressionContainer(node) &&
      t.isConditionalExpression(node.expression);
  },
  transform: (node, context) => {
    const expr = node.expression as any;
    const test = generateExpression(expr.test);
    const consequent = expr.consequent;
    const alternate = expr.alternate;
    
    // Simple ternary to v-if
    if (t.isJSXElement(consequent) || t.isJSXFragment(consequent)) {
      const element = transformJSXElement(consequent);
      return `<template v-if="${test}">${element}</template>`;
    }
    
    return '';
  }
};

export const mapRenderTransform: TransformationRule = {
  name: 'map-to-v-for',
  description: 'Transform array.map() rendering to v-for',
  detect: (node) => {
    return t.isJSXExpressionContainer(node) &&
      t.isCallExpression(node.expression) &&
      t.isMemberExpression(node.expression.callee) &&
      t.isIdentifier(node.expression.callee.property) &&
      node.expression.callee.property.name === 'map';
  },
  transform: (node, context) => {
    const callExpr = node.expression as any;
    const arrayName = generateExpression(callExpr.callee.object);
    const mapFn = callExpr.arguments[0];
    
    if (!t.isArrowFunctionExpression(mapFn)) return '';
    
    const param = mapFn.params[0];
    const itemName = t.isIdentifier(param) ? param.name : 'item';
    const body = mapFn.body;
    
    if (t.isJSXElement(body)) {
      const element = transformJSXElement(body);
      // Add key prop if present
      const keyProp = body.openingElement.attributes.find(
        (attr: any) => t.isJSXAttribute(attr) && attr.name.name === 'key'
      );
      const key = keyProp ? generateExpression(keyProp.value.expression) : 'index';
      
      return `<template v-for="(${itemName}, index) in ${arrayName}" :key="${key}">${element}</template>`;
    }
    
    return '';
  }
};

export const eventHandlerTransform: TransformationRule = {
  name: 'event-handler-to-vue',
  description: 'Transform React event handlers to Vue event syntax',
  detect: (node) => {
    return t.isJSXAttribute(node) &&
      t.isJSXIdentifier(node.name) &&
      node.name.name.startsWith('on');
  },
  transform: (node, context) => {
    const eventName = node.name.name;
    const vueEvent = eventName.replace(/^on/, '').toLowerCase();
    const value = node.value;
    
    if (t.isJSXExpressionContainer(value)) {
      const expr = generateExpression(value.expression);
      return `@${vueEvent}="${expr}"`;
    }
    
    return '';
  }
};

export const classNameTransform: TransformationRule = {
  name: 'className-to-class',
  description: 'Transform className to class',
  detect: (node) => {
    return t.isJSXAttribute(node) &&
      t.isJSXIdentifier(node.name) &&
      node.name.name === 'className';
  },
  transform: (node, context) => {
    const value = node.value;
    
    if (t.isStringLiteral(value)) {
      return `:class="'${value.value}'"`;
    }
    
    if (t.isJSXExpressionContainer(value)) {
      const expr = generateExpression(value.expression);
      return `:class="${expr}"`;
    }
    
    return '';
  }
};

export const propsSpreadTransform: TransformationRule = {
  name: 'props-spread-to-v-bind',
  description: 'Transform {...props} to v-bind',
  detect: (node) => {
    return t.isJSXSpreadAttribute(node);
  },
  transform: (node, context) => {
    const expr = generateExpression(node.argument);
    return `v-bind="${expr}"`;
  }
};

export const childrenTransform: TransformationRule = {
  name: 'children-to-slot',
  description: 'Transform children prop to slot',
  detect: (node) => {
    return t.isJSXAttribute(node) &&
      t.isJSXIdentifier(node.name) &&
      node.name.name === 'children' &&
      t.isJSXExpressionContainer(node.value);
  },
  transform: (node, context) => {
    // Children are handled differently in Vue
    return '<slot></slot>';
  }
};

// Helper functions
function generateExpression(node: any): string {
  if (t.isIdentifier(node)) return node.name;
  if (t.isStringLiteral(node)) return `'${node.value}'`;
  if (t.isNumericLiteral(node)) return String(node.value);
  if (t.isBooleanLiteral(node)) return String(node.value);
  if (t.isMemberExpression(node)) {
    const object = generateExpression(node.object);
    const property = t.isIdentifier(node.property) ? node.property.name : '';
    return `${object}.${property}`;
  }
  if (t.isCallExpression(node)) {
    const callee = generateExpression(node.callee);
    const args = node.arguments.map(arg => generateExpression(arg)).join(', ');
    return `${callee}(${args})`;
  }
  if (t.isBinaryExpression(node)) {
    const left = generateExpression(node.left);
    const right = generateExpression(node.right);
    return `${left} ${node.operator} ${right}`;
  }
  if (t.isConditionalExpression(node)) {
    const test = generateExpression(node.test);
    const consequent = generateExpression(node.consequent);
    const alternate = generateExpression(node.alternate);
    return `${test} ? ${consequent} : ${alternate}`;
  }
  if (t.isTemplateLiteral(node)) {
    // Simplified template literal handling
    return '`${}`';
  }
  if (t.isArrayExpression(node)) {
    const elements = node.elements.map(el => el ? generateExpression(el) : '').join(', ');
    return `[${elements}]`;
  }
  if (t.isObjectExpression(node)) {
    const props = node.properties.map(prop => {
      if (t.isObjectProperty(prop)) {
        const key = t.isIdentifier(prop.key) ? prop.key.name : '';
        const value = generateExpression(prop.value);
        return `${key}: ${value}`;
      }
      return '';
    }).join(', ');
    return `{${props}}`;
  }
  return '';
}

function transformJSXElement(node: any): string {
  if (!t.isJSXElement(node)) return '';
  
  const tagName = t.isJSXIdentifier(node.openingElement.name) 
    ? node.openingElement.name.name 
    : 'div';
  
  // Handle self-closing elements
  if (node.openingElement.selfClosing) {
    return `<${tagName} />`;
  }
  
  // Transform children
  const children = node.children.map((child: any) => {
    if (t.isJSXText(child)) return child.value.trim();
    if (t.isJSXElement(child)) return transformJSXElement(child);
    if (t.isJSXExpressionContainer(child)) {
      return `{{ ${generateExpression(child.expression)} }}`;
    }
    return '';
  }).filter(Boolean).join('');
  
  return `<${tagName}>${children}</${tagName}>`;
}

export const jsxTransformRules: TransformationRule[] = [
  conditionalRenderTransform,
  mapRenderTransform,
  eventHandlerTransform,
  classNameTransform,
  propsSpreadTransform,
  childrenTransform
];