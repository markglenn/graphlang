// Type resolution map — built during type checking passes

export type BaseType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'uuid'
  | 'email'
  | 'url'
  | 'json'
  | 'any';

export type RenderFormat = 'text' | 'html' | 'markdown' | 'currency' | 'date' | 'datetime';

export interface ResolvedType {
  base: BaseType | 'enum' | 'list' | 'record' | 'entity_ref';
  format?: RenderFormat;
  enum_values?: string[];
  list_item_type?: ResolvedType;
  record_fields?: Record<string, ResolvedType>;
  entity_ref_type?: string;
  optional?: boolean;
}

export interface TraversalPath {
  segments: string[];
  resolved_type: ResolvedType;
  entity_chain: string[];
}

export interface TypeMap {
  // Maps entity name -> field name -> resolved type
  entities: Record<string, Record<string, ResolvedType>>;
  // Maps compute node name -> { inputs, outputs }
  computes: Record<string, { inputs: Record<string, ResolvedType>; outputs: Record<string, ResolvedType> }>;
  // Maps component name -> { props, events }
  components: Record<string, { props: Record<string, ResolvedType>; events: Record<string, ResolvedType | null> }>;
  // Maps adapter name -> action name -> { inputs, outputs }
  adapters: Record<string, Record<string, { inputs: Record<string, ResolvedType>; outputs: Record<string, ResolvedType> }>>;
}
