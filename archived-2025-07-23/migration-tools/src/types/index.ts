export interface TransformationRule {
  name: string;
  description: string;
  detect: (node: any) => boolean;
  transform: (node: any, context: TransformContext) => string;
  priority?: number;
}

export interface TransformContext {
  imports: Set<string>;
  props: Map<string, string>;
  state: Map<string, StateInfo>;
  effects: Array<EffectInfo>;
  refs: Map<string, RefInfo>;
  methods: Map<string, MethodInfo>;
  computed: Map<string, ComputedInfo>;
  componentName: string;
  typescript: boolean;
}

export interface StateInfo {
  name: string;
  type: string;
  initialValue: string;
  isReactive: boolean;
}

export interface EffectInfo {
  dependencies: string[];
  body: string;
  cleanup?: string;
  immediate?: boolean;
}

export interface RefInfo {
  name: string;
  type: string;
}

export interface MethodInfo {
  name: string;
  params: string[];
  body: string;
  isAsync: boolean;
}

export interface ComputedInfo {
  name: string;
  dependencies: string[];
  body: string;
}

export interface TransformResult {
  success: boolean;
  output?: string;
  errors?: string[];
  warnings?: string[];
  stats?: {
    linesOfCode: number;
    componentsTransformed: number;
    hooksTransformed: number;
    propsTransformed: number;
  };
}

export interface MigrationStatus {
  id?: number;
  componentPath: string;
  reactLoc: number;
  vueLoc: number;
  status: 'pending' | 'in_progress' | 'migrated' | 'verified';
  migratedAt?: Date;
  migratedBy?: string;
  testCoverage?: number;
  notes?: string;
}

export interface ComponentAnalysis {
  path: string;
  name: string;
  complexity: 'low' | 'medium' | 'high';
  hooks: string[];
  dependencies: string[];
  hasContextAPI: boolean;
  hasHOCs: boolean;
  hasRenderProps: boolean;
  estimatedEffort: number; // in hours
}