import { readFile } from 'fs/promises';
import { parse } from '@vue/compiler-sfc';

export class VueTestGenerator {
  async generateTest(vueFilePath: string): Promise<string> {
    const vueContent = await readFile(vueFilePath, 'utf-8');
    const { descriptor } = parse(vueContent);
    
    const componentName = vueFilePath
      .split('/')
      .pop()
      ?.replace('.vue', '') || 'Component';
    
    // Extract props from script setup
    const props = this.extractProps(descriptor.scriptSetup?.content || '');
    
    // Extract emits
    const emits = this.extractEmits(descriptor.scriptSetup?.content || '');
    
    // Generate test template
    return `import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ${componentName} from './${componentName}.vue';

describe('${componentName}', () => {
  const defaultProps = {
${props.map(prop => `    ${prop}: ${this.getDefaultValue(prop)}`).join(',\n')}
  };

  it('renders properly', () => {
    const wrapper = mount(${componentName}, {
      props: defaultProps
    });
    
    expect(wrapper.exists()).toBe(true);
  });

${props.map(prop => `
  it('accepts ${prop} prop', () => {
    const wrapper = mount(${componentName}, {
      props: {
        ...defaultProps,
        ${prop}: ${this.getTestValue(prop)}
      }
    });
    
    // Add specific assertions based on prop usage
    expect(wrapper.props('${prop}')).toBeDefined();
  });
`).join('')}

${emits.map(emit => `
  it('emits ${emit} event', async () => {
    const wrapper = mount(${componentName}, {
      props: defaultProps
    });
    
    // Trigger the event (adjust based on component logic)
    // await wrapper.find('button').trigger('click');
    
    expect(wrapper.emitted()).toHaveProperty('${emit}');
  });
`).join('')}

  it('matches snapshot', () => {
    const wrapper = mount(${componentName}, {
      props: defaultProps
    });
    
    expect(wrapper.html()).toMatchSnapshot();
  });
});`;
  }
  
  private extractProps(scriptContent: string): string[] {
    const propsMatch = scriptContent.match(/defineProps<\{([^}]+)\}>/);
    if (!propsMatch) return [];
    
    const propsContent = propsMatch[1];
    const props = propsContent
      .split(/[,;]/)
      .map(prop => prop.trim())
      .filter(Boolean)
      .map(prop => prop.split(':')[0].trim())
      .filter(prop => !prop.includes('{') && !prop.includes('}'));
    
    return props;
  }
  
  private extractEmits(scriptContent: string): string[] {
    const emitsMatch = scriptContent.match(/defineEmits<\{([^}]+)\}>/);
    if (!emitsMatch) return [];
    
    const emitsContent = emitsMatch[1];
    const emits = emitsContent
      .split(/[,;]/)
      .map(emit => emit.trim())
      .filter(Boolean)
      .map(emit => {
        const match = emit.match(/['"]([^'"]+)['"]/);
        return match ? match[1] : emit.split(':')[0].trim();
      });
    
    return emits;
  }
  
  private getDefaultValue(propName: string): string {
    // Intelligent defaults based on prop name
    if (propName.includes('id') || propName.includes('Id')) return "'test-id'";
    if (propName.includes('name') || propName.includes('Name')) return "'Test Name'";
    if (propName.includes('title') || propName.includes('Title')) return "'Test Title'";
    if (propName.includes('is') || propName.includes('has') || propName.includes('show')) return 'false';
    if (propName.includes('count') || propName.includes('number')) return '0';
    if (propName.includes('items') || propName.includes('list')) return '[]';
    if (propName.includes('data') || propName.includes('config')) return '{}';
    
    return 'undefined';
  }
  
  private getTestValue(propName: string): string {
    // Test values different from defaults
    if (propName.includes('id') || propName.includes('Id')) return "'test-id-2'";
    if (propName.includes('name') || propName.includes('Name')) return "'Another Name'";
    if (propName.includes('title') || propName.includes('Title')) return "'Another Title'";
    if (propName.includes('is') || propName.includes('has') || propName.includes('show')) return 'true';
    if (propName.includes('count') || propName.includes('number')) return '42';
    if (propName.includes('items') || propName.includes('list')) return "[{ id: 1, name: 'Item 1' }]";
    if (propName.includes('data') || propName.includes('config')) return "{ key: 'value' }";
    
    return "'test-value'";
  }
}