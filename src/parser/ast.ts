// AST node types for the GraphLang DSL parser

export type TokenType =
  | 'keyword'
  | 'identifier'
  | 'string'
  | 'number'
  | 'punctuation'
  | 'operator'
  | 'comment'
  | 'newline'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
  file: string;
}

// --- Field & Annotation ---

export interface FieldAnnotation {
  name: string;
  args?: string[];
  line: number;
}

export interface FieldNode {
  name: string;
  type: string;
  optional: boolean;
  annotations: FieldAnnotation[];
  line: number;
}

// --- Entity ---

export interface EntityNode {
  kind: 'entity';
  name: string;
  fields: FieldNode[];
  annotations: FieldAnnotation[];
  source_file: string;
  source_line: number;
}

// --- Edge ---

export type CardinalityType = 'has_many' | 'has_one' | 'belongs_to' | 'many_to_many';

export interface EdgeNode {
  kind: 'edge';
  from: string;
  to: string;
  cardinality: CardinalityType;
  name?: string;
  through?: string;
  annotations: FieldAnnotation[];
  source_file: string;
  source_line: number;
}

// --- Compute ---

export interface ComputeParamNode {
  name: string;
  type: string;
  optional: boolean;
}

export interface ComputeNode {
  kind: 'compute';
  name: string;
  source: string;
  inputs: ComputeParamNode[];
  outputs: ComputeParamNode[];
  annotations: FieldAnnotation[];
  source_file: string;
  source_line: number;
}

// --- Constraint ---

export interface ConstraintNode {
  kind: 'constraint';
  name: string;
  target: string;
  assert: string;
  message?: string;
  annotations: FieldAnnotation[];
  source_file: string;
  source_line: number;
}

// --- Policy ---

export interface PolicyRule {
  action: string;
  constraint: string;
  effect: 'allow' | 'deny';
}

export interface PolicyNode {
  kind: 'policy';
  name: string;
  target: string;
  rules: PolicyRule[];
  annotations: FieldAnnotation[];
  source_file: string;
  source_line: number;
}

// --- Behavior ---

export interface BehaviorTrigger {
  projection: string;
  action: string;
}

export interface BehaviorStep {
  kind: 'compute' | 'mutate' | 'effect' | 'precondition';
  value: string;
  args?: Record<string, string>;
}

export interface BehaviorNode {
  kind: 'behavior';
  name: string;
  trigger: BehaviorTrigger;
  input?: string;
  steps: BehaviorStep[];
  annotations: FieldAnnotation[];
  source_file: string;
  source_line: number;
}

// --- Projection ---

export interface ProjectionBinding {
  field: string;
  expression: string;
}

export interface ProjectionStateField {
  name: string;
  type: string;
  initial?: string;
}

export interface ProjectionAction {
  name: string;
  payload?: string;
}

export interface ProjectionMatchCase {
  condition: string;
  content: string;
}

export interface ProjectionNode {
  kind: 'projection';
  name: string;
  route?: string;
  layout?: string;
  entity?: string;
  bindings: ProjectionBinding[];
  state: ProjectionStateField[];
  actions: ProjectionAction[];
  match_cases: ProjectionMatchCase[];
  annotations: FieldAnnotation[];
  source_file: string;
  source_line: number;
}

// --- Component ---

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
}

export interface ComponentEvent {
  name: string;
  payload?: string;
}

export interface ComponentNode {
  kind: 'component';
  name: string;
  source: string;
  props: ComponentProp[];
  events: ComponentEvent[];
  annotations: FieldAnnotation[];
  source_file: string;
  source_line: number;
}

// --- Adapter ---

export interface AdapterAction {
  name: string;
  inputs: ComputeParamNode[];
  outputs: ComputeParamNode[];
}

export interface AdapterNode {
  kind: 'adapter';
  name: string;
  actions: AdapterAction[];
  annotations: FieldAnnotation[];
  source_file: string;
  source_line: number;
}

// --- Listener ---

export interface ListenerNode {
  kind: 'listener';
  name: string;
  on: string;
  behavior: string;
  annotations: FieldAnnotation[];
  source_file: string;
  source_line: number;
}

// --- Parse Result ---

export type ASTNode =
  | EntityNode
  | EdgeNode
  | ComputeNode
  | ConstraintNode
  | PolicyNode
  | BehaviorNode
  | ProjectionNode
  | ComponentNode
  | AdapterNode
  | ListenerNode;

export interface ParseError {
  message: string;
  line: number;
  col: number;
  file: string;
}

export interface ParseResult {
  nodes: ASTNode[];
  errors: ParseError[];
  source_file: string;
}
