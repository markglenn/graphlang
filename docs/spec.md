# GraphLang: An AI-Native Application Framework

## Prototype Implementation Specification v0.7

**Version:** 0.7
**Author:** Mark @ AHEAD
**Purpose:** Build a working prototype of an AI-native application framework. The core thesis: applications defined as typed graphs are more reliably authored and modified by AI than traditional codebases. The key differentiator is a comprehensive type system that catches errors at build time and produces error feedback specific enough for AI to self-correct. The framework handles extensibility — custom UI components, third-party integrations, complex rendering — through typed boundaries: the graph owns the wiring, opaque implementations live behind typed contracts, and the type checker validates every connection point.

---

## 1. Vision & Core Thesis

Today's AI writes code designed for humans to read and maintain (React, Python, etc.). This is wasteful — the AI is constrained by human-ergonomic syntax, and the output is fragile because imperative code has implicit relationships that AI can't reliably track.

GraphLang splits application development into two layers:

1. **The Graph Layer** — a declarative graph of typed nodes and edges that defines the application's structure: entities, relationships, UI projections, behaviors, policies, events. The graph handles *what connects to what* — the architectural wiring that AI struggles with in traditional codebases because it's implicit and scattered.

2. **The Compute Layer** — small, pure TypeScript functions that handle actual computation: math, string processing, data transformation, validation logic. These are bounded, testable, side-effect-free functions that AI writes reliably.

The graph is NOT Turing complete on its own, and that's by design. Forcing arbitrary computation into graph form (dataflow nodes for basic arithmetic) defeats the purpose. The graph excels at structure and flow. Pure functions excel at computation. Each does what it's best at.

### The Type System Is the Innovation

The graph isn't the real innovation — the **type system** is. The graph is the structure that makes comprehensive type checking possible.

In a traditional codebase, type safety is fragmented. TypeScript checks types within files but can't verify that a form submission sends the right shape to an API endpoint that validates it correctly against a database schema. Those connections cross file boundaries, cross language boundaries (frontend JS → HTTP → backend JS → SQL), and are invisible to any single tool.

In a GraphLang graph, **every connection is a typed edge**. Every edge has types on both ends. The entire application — from UI field to behavior input to constraint parameter to entity mutation to compute module call — is one unified type-checked structure. A renamed field, a mismatched parameter, a wrong type on a binding — all caught at build time, all reported with specific, actionable errors.

This is what makes the graph AI-friendly. Not the syntax. Not the declarative style. The fact that the AI gets immediate, precise feedback when something doesn't fit.

**The AI emits graph definitions + small pure functions. The type checker tells it exactly what's wrong. The compiler/runtime produces the application.**

### Typed Boundaries, Not Closed Vocabularies

The graph does not try to express everything. It expresses every *boundary* with types.

The built-in projection primitives (`section`, `card`, `grid`, `field`, `action`) cover common UI patterns. But real applications need charts, drag-and-drop, rich text editors, custom visualizations, and third-party integrations. Rather than expanding the primitive set forever, GraphLang handles extensibility through **typed boundaries**:

- **Components** let projections embed custom UI with typed prop and event contracts. The graph declares what data flows in and what events flow out. The implementation (JS with mount/update/unmount) is opaque. Used for everything from charts to drag-and-drop to rich text editors.
- **Render compute modules** return typed markup fragments (`render(svg)`, `render(html_safe)`), allowing computed visualizations to be injected into projections with format-typed sanitization.
- **Typed adapters** define action contracts for external services (Stripe, SendGrid, etc.) with typed inputs and outputs, so behaviors can call them with full type checking.

The unifying principle: **the graph excels at composing and wiring things, not at defining their internals.** Boundaries are typed and checkable. Implementations behind those boundaries are opaque. The type checker validates every connection point.

### Testability by Design

The type checker catches structural errors. Tests catch behavioral errors. Together they form the complete feedback loop that makes AI-assisted development reliable. Neither is optional.

GraphLang's design makes testability natural at every layer:

- **Compute modules are pure functions.** No side effects, no external state, no I/O. Call them with inputs, assert the outputs. Tests require zero setup and zero teardown. A project with 50 compute modules should have all compute tests complete in under 100ms.
- **Behaviors are declarative sequences of typed steps.** Each phase — preconditions, compute, adapter calls, mutations — operates against a known state. Behaviors can be tested against an in-memory graph without a running server, without network calls, and without filesystem access.
- **The graph is a query target.** SQLite in-memory is the test substrate. No disk, no network. The type checker's own tests use fixture graph definitions parsed into `:memory:` databases. Behavior tests use seeded entity data in the same substrate. Both are fast by construction.

The feedback loop target: **under 1 second after every save**, with a ceiling of **3 seconds on large projects**. This is a first-class design constraint, not a performance optimization to address later. Architecture decisions — synchronous SQLite access, pure compute functions, in-memory test isolation, incremental type checking — are all made with this target in mind.

### What This Prototype Should Prove

1. The type system catches cross-boundary errors that traditional tooling misses
2. Error feedback is specific enough that AI can self-correct in 1-2 iterations
3. AI-modified graphs are more reliably correct than AI-modified React code
4. An application's architecture can be fully defined as a typed graph
5. Compute modules run identically on server and client (same TypeScript, same runtime)
6. A compiler can generate client-side JavaScript from projection nodes
7. Changes to the graph are surgical — modify one node, rebuild, the app updates
8. The type check + test feedback loop completes in under 3 seconds on the prototype application

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Source Files                              │
│                                                              │
│  .graph files      .ts files       .css files    .js files   │
│  (structure &      (compute —      (styling &    (component  │
│   flow — DSL)      pure fns)       transitions)  impls)      │
└──────┬─────────────────┬───────────────┬──────────────┬──────┘
       │ parse           │               │              │
       ▼                 │               │              │
┌─────────────────┐      │               │              │
│  Graph Store    │      │               │              │
│  (SQLite WAL)   │      │               │              │
│                 │      │               │              │
│  nodes table    │      │               │              │
│  edges table    │      │               │              │
│  entity_data    │      │               │              │
└──────┬──────────┘      │               │              │
       │                 │               │              │
       ▼                 │               │              │
┌──────────────────────────────────┐     │              │
│       TYPE CHECKER               │     │              │
│                                  │     │              │
│  Queries graph via SQL to:       │     │              │
│  • Verify all edge type contracts│     │              │
│  • Validate entity → behavior    │     │              │
│  • Validate behavior → compute   │     │              │
│  • Validate projection → behavior│     │              │
│  • Validate constraint traversals│     │              │
│  • Validate policy → constraint  │     │              │
│  • Verify state/derived types    │     │              │
│  • Check compute module sigs     │     │              │
│  • Validate component contracts  │     │              │
│  • Validate adapter contracts    │     │              │
│                                  │     │              │
│  Output: errors[] OR valid graph │     │              │
└──────┬───────────────────────────┘     │              │
       │ if valid                        │              │
       ▼                                 ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Build / Bundle Step                        │
│                                                              │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Server Bundle    │  │ Client JS    │  │ CSS Bundle    │  │
│  │ (runtime +       │  │ (from projs  │  │ (PostCSS lint │  │
│  │  compute fns)    │  │  + compute)  │  │  + bundle)    │  │
│  └──────────────────┘  └──────────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Boundaries

| Concern | Handled By | Why |
|---------|-----------|-----|
| Entities, relationships | Graph nodes + edges | Structural — what connects to what |
| UI structure & layout | Projection nodes in graph | Declarative — what to show, not how |
| Client-side interactivity | Compiled from graph → JS | Reactive bindings, state, events derived from projections |
| Custom UI (charts, drag-drop, editors) | Components with typed props/events | Opaque JS behind typed boundary, mount/update/unmount contract |
| Dynamic markup | Render compute modules (TS → sanitized HTML) | Sparklines, markdown, SVG computed in TypeScript, format-typed |
| Business logic flow | Behavior nodes in graph | Event → precondition → compute → adapter → mutation → effect |
| Access control | Policy + constraint nodes | Declarative rules attached via edges |
| Computation | Pure TypeScript functions | Same code on server and client, AI writes it reliably |
| External services | Typed adapters with action contracts | Stripe, email, analytics — typed I/O, opaque implementation |
| Styling | CSS source files | Full CSS power, PostCSS lint validates graph references |

### Why SQLite

SQLite isn't chosen for persistence or performance — it's chosen because it's a **query engine for the graph**.

The type checker, policy evaluator, route resolver, dependency analyzer, and client JS compiler all need to ask questions about the graph's structure. These questions are graph traversal queries, and SQL is excellent at expressing them:

```sql
-- "Find every behavior that mutates User.email"
SELECT b.* FROM nodes b
JOIN edges e ON e.from_node = b.id
WHERE b.type = 'behavior' AND e.to_node = 'User'
AND e.type = 'mutates'
AND json_extract(e.properties, '$.field') = 'email';

-- "Find every compute module whose output is referenced but doesn't exist"
SELECT b.id as behavior, json_extract(cs.value, '$.alias') as alias,
       json_extract(cs.value, '$.module') as module
FROM nodes b, json_each(b.properties, '$.compute_steps') cs
WHERE b.type = 'behavior'
AND json_extract(cs.value, '$.module') NOT IN (
  SELECT id FROM nodes WHERE type = 'compute'
);

-- "Trace the full path from a projection action to entity mutations"
WITH RECURSIVE path(node_id, depth, trail) AS (
  SELECT e.to_node, 1, n.id || ' -> ' || e.to_node
  FROM nodes n JOIN edges e ON e.from_node = n.id
  WHERE n.id = 'profile_edit' AND n.type = 'projection'
  UNION ALL
  SELECT e2.to_node, p.depth + 1, p.trail || ' -> ' || e2.to_node
  FROM path p JOIN edges e2 ON e2.from_node = p.node_id
  WHERE p.depth < 10
)
SELECT * FROM path WHERE node_id IN (SELECT id FROM nodes WHERE type = 'entity');
```

With an in-memory graph (Map + Array), each of these queries is custom traversal code. With SQLite, every new query is just SQL. As the type checker grows more sophisticated, you add queries, not code.

Additional benefits:
- Entity data (runtime application data) uses the same engine — one transaction model, no impedance mismatch
- SQLite's `json_extract` functions let you query into node properties stored as JSON blobs
- WAL mode with `better-sqlite3` (synchronous, not async) gives in-memory speed with SQL queryability
- The graph is small enough to fit entirely in SQLite's cache — you get in-memory performance with SQL's expressiveness

---

## 3. The Type System

**This section is the most important in the spec. The type system is what makes GraphLang useful for AI. Build this first.**

### 3.1 Type System Philosophy

Every edge in the graph is a typed contract. When node A connects to node B via an edge, the type system verifies that what A produces is compatible with what B expects. Build fails if any contract is violated.

The type system is:
- **Structural.** Types are defined by their shape (fields and their types), not by name. Two entity types with the same field structure are not interchangeable — nominal typing at the entity level, structural typing at the field level.
- **Complete.** Every reference, every parameter pass, every field access, every binding — all type-checked. No unchecked edges.
- **Specific in errors.** Every error includes: what went wrong, where it went wrong (source file, line, node path), what was expected, what was received, and a suggestion for fixing it.
- **Exhaustive.** The type checker collects ALL errors before reporting, not just the first one. AI works better when it can see all problems at once.

### 3.2 The Type Map

At build time, the type checker constructs a complete type map of the application by querying the graph in SQLite. The type map records the resolved type of every referenceable thing:

```typescript
interface TypeMap {
  // Entity field types
  entities: Map<string, {
    fields: Map<string, FieldType>;
    edges: Map<string, { target: string; cardinality: string }>;
  }>;

  // Compute module signatures
  computes: Map<string, {
    inputs: Map<string, ResolvedType>;
    outputs: Map<string, ResolvedType>;
  }>;

  // Constraint parameter types
  constraints: Map<string, {
    params: Map<string, ResolvedType>;
    traversals: TraversalPath[];  // validated against entity edges
  }>;

  // Behavior context types (what's available at each point in execution)
  behaviors: Map<string, {
    inputs: Map<string, ResolvedType>;
    target_entity: string | null;
    compute_results: Map<string, ResolvedType>;  // accumulated as compute steps execute
    available_at_mutate: Map<string, ResolvedType>;  // everything available when mutations run
  }>;

  // Projection binding types
  projections: Map<string, {
    data_bindings: Map<string, ResolvedType>;
    state: Map<string, ResolvedType>;
    derived: Map<string, ResolvedType>;
    forms: Map<string, {
      fields: Map<string, ResolvedType>;
      target_entity: string | null;
    }>;
  }>;
}

interface ResolvedType {
  base: 'string' | 'integer' | 'decimal' | 'boolean' | 'uuid' | 'timestamp'
      | 'enum' | 'text' | 'json' | 'list' | 'record' | 'entity_ref' | 'render';
  format?: string;        // 'email', 'url', 'phone'
  enum_values?: string[];
  list_item_type?: ResolvedType;
  record_fields?: Map<string, ResolvedType>;  // for record({...}) types
  entity_ref_type?: string;  // which entity
  render_format?: 'svg' | 'html_safe' | 'raw';  // for render(...) output types
  nullable: boolean;
  constraints: string[];  // 'unique', 'required', 'generated', 'sensitive', 'immutable'
  min?: number;
  max?: number;
}
```

### 3.3 Record Subtyping

When a type with known fields (an entity or a record) is passed where a record type is expected, the type checker uses **structural subtyping**:

- Every field in the expected record must exist in the provided type with a compatible type.
- Extra fields in the provided type are allowed and ignored.
- Missing fields are errors.

This means you can pass a full `Order` entity (which has `id`, `status`, `total`, `created_at`, etc.) to a component that expects `record({ id: uuid, total: decimal })`. The entity has the required fields plus extras — that's fine.

```
# Component expects:
prop data : list(record({ id : uuid, total : decimal }))

# Binding provides Order entities, which have id, status, total, created_at, ...
bind data = all_orders

# Type checker: ✓ Order has 'id' (uuid) and 'total' (decimal). Extra fields ignored.
```

The type checker reports subtyping errors with full context:

```
ERROR [record-subtype-missing-field] projections.graph:45
  Projection 'admin_dashboard', component 'chart':
  Prop 'data' expects record({ label: string, value: decimal }).
  Binding resolves to list of entity 'Order'.
  
  Order has field 'value': ✗ NOT FOUND
  Order has field 'label': ✗ NOT FOUND
  
  Available fields on Order: id (uuid), status (enum), total (decimal),
    created_at (timestamp)
  
  You may need a derived value to reshape the data:
    derived chart_data = monthly_sales | map({ label: month, value: total })
```

Subtyping applies everywhere record types are used: component props, adapter action inputs, behavior inputs, constraint params, and compute module inputs.

### 3.3 Type Checking Passes

The type checker runs as a series of SQL-backed passes over the graph. Each pass queries specific node/edge patterns and validates type contracts.

#### Pass 1: Entity Integrity

Verify all entity definitions are self-consistent.

```sql
-- Find duplicate field names within an entity
SELECT n.id, json_extract(f1.value, '$.name') as field_name, COUNT(*) as count
FROM nodes n, json_each(n.properties, '$.fields') f1
WHERE n.type = 'entity'
GROUP BY n.id, field_name
HAVING count > 1;
```

Checks:
- No duplicate field names within an entity
- All field types are valid (string, integer, decimal, boolean, uuid, timestamp, enum, text, json)
- Annotation values are valid for their field type (@min/@max on numeric types, @format on string, etc.)
- Enum fields have at least one value
- @default values match the field type

Errors:
```
ERROR [entity-duplicate-field] entities.graph:5
  Entity 'User' has duplicate field 'email' (lines 5 and 8).
  Remove one of the duplicate field definitions.

ERROR [entity-invalid-annotation] entities.graph:7
  Entity 'User', field 'name': @min(1) is not valid on type 'boolean'.
  @min is only valid on types: string, integer, decimal.
```

#### Pass 2: Edge Integrity

Verify all relationship edges connect valid entities with valid cardinalities.

```sql
-- Find edges referencing non-existent entities
SELECT e.id, e.from_node, e.to_node
FROM edges e
WHERE e.type IN ('has_many', 'has_one', 'belongs_to', 'many_to_many')
AND (e.from_node NOT IN (SELECT id FROM nodes WHERE type = 'entity')
  OR e.to_node NOT IN (SELECT id FROM nodes WHERE type = 'entity'));
```

Checks:
- Both ends of every relationship edge point to existing entities
- Cardinality type is valid
- on_delete action is valid
- No duplicate edges between the same pair with the same type

Errors:
```
ERROR [edge-missing-entity] entities.graph:42
  Edge 'OrderItem -> Products : belongs_to': target entity 'Products' does not exist.
  Did you mean 'Product'?
  Available entities: User, Product, Order, OrderItem
```

#### Pass 3: Compute Module Signatures

Verify all compute module declarations have valid type signatures.

Checks:
- All input/output types are valid
- Source file paths exist (warning if not — they may not be written yet)
- No duplicate compute module names

Errors:
```
ERROR [compute-invalid-type] compute.graph:12
  Compute module 'calculate_discount', input 'subtotal': type 'float' is not valid.
  Valid types: string, integer, decimal, boolean, uuid, timestamp, list(T), json
  Did you mean 'decimal'?
```

#### Pass 4: Constraint Validation

Verify constraints reference valid entities, fields, and traversal paths.

```sql
-- For each constraint, extract traversal paths and validate against entity edges
SELECT c.id, json_extract(step.value, '$.path') as traversal_path
FROM nodes c, json_each(c.properties, '$.evaluate') step
WHERE c.type = 'constraint'
AND json_extract(step.value, '$.type') = 'traverse';
```

Checks:
- Parameter types are valid
- Traversal paths follow valid entity edges (e.g., `target_entity -> user -> id` requires target_entity to have a `user` edge, and User to have an `id` field)
- Assert expressions compare compatible types (no `string == integer`)
- Compute references in constraints point to valid compute modules with matching signatures
- `on_fail` expressions resolve to strings

Errors:
```
ERROR [constraint-invalid-traversal] constraints.graph:8
  Constraint 'is_owner', traversal 'target_entity -> user -> id':
  Cannot traverse 'user' from entity 'Product'.
  Product has no 'user' edge.
  Available edges from Product: (none — Product has no outgoing belongs_to edges)

  This constraint is used by:
    • policy 'owner_access' (policies.graph:3)
    • behavior 'update_email' precondition (behaviors.graph:7)

  If Product should have a user edge, add:
    edge Product -> User : belongs_to
```

#### Pass 5: Behavior Type Checking

This is the most complex pass. Behaviors wire together multiple node types, so every connection must be verified.

```sql
-- Find all behaviors and their preconditions, compute steps, mutations, and effects
SELECT
  b.id,
  b.properties,
  GROUP_CONCAT(DISTINCT e_pre.to_node) as precondition_refs,
  GROUP_CONCAT(DISTINCT e_comp.to_node) as compute_refs,
  GROUP_CONCAT(DISTINCT e_mut.to_node) as mutation_refs
FROM nodes b
LEFT JOIN edges e_pre ON e_pre.from_node = b.id AND e_pre.type = 'precondition'
LEFT JOIN edges e_comp ON e_comp.from_node = b.id AND e_comp.type = 'calls_compute'
LEFT JOIN edges e_mut ON e_mut.from_node = b.id AND e_mut.type = 'mutates'
WHERE b.type = 'behavior'
GROUP BY b.id;
```

Checks:

**Input validation:**
- All input types are valid
- Input names are unique within the behavior

**Precondition validation:**
- Referenced constraints exist
- Parameter names match the constraint's declared params
- Parameter types match (e.g., if constraint expects `email_value: string`, the behavior must pass a string)
- The `$target_*` variable type matches the constraint's `target_entity` param type

**Compute step validation:**
- Referenced compute modules exist
- Parameter names match the module's declared inputs
- Parameter types match
- The alias used to bind the result is unique within the behavior
- When result fields are accessed later (e.g., `hash_result.hashed`), the compute module's declared outputs include that field name and the type is tracked forward

**Require validation:**
- Expression references valid compute result fields
- Expression resolves to boolean

**Mutation validation:**
- Target entity exists
- Target field exists on that entity
- Field is not `@generated` (can't mutate generated fields)
- Field is not `@immutable` (can't mutate immutable fields after creation)
- Assigned value type matches the field type
- `create()` calls include all `@required` fields that aren't `@generated`
- `decrement()` targets numeric fields

**Effect validation:**
- `emit()` event names are valid identifiers
- `notify()` channel is valid
- Referenced templates exist (warning level, not error)

**on_success / on_failure validation:**
- `show_message()` and `navigate()` are valid response types
- `navigate()` path is a valid route or expression

Errors:
```
ERROR [behavior-compute-param-mismatch] behaviors.graph:18
  Behavior 'update_password', compute step 'verify_result':
  Calling compute module 'verify_password' with param 'plain_text',
  but module expects 'plaintext'.
  
  Module signature (compute.graph:8):
    input plaintext : string
    input hash : string
  
  Did you mean 'plaintext'?

ERROR [behavior-mutate-type-mismatch] behaviors.graph:24
  Behavior 'update_password', mutation '$target_user.password_hash = hash_result.hashed':
  Field 'User.password_hash' expects type 'string'.
  'hash_result.hashed' resolves to type 'string'.
  ✓ Types match.
  
  BUT: 'hash_result' comes from compute module 'hash_password',
  which declares output 'hash' not 'hashed'.
  
  Available outputs from hash_password: hash (string)
  Did you mean 'hash_result.hash'?

ERROR [behavior-mutate-generated] behaviors.graph:30
  Behavior 'place_order', mutation '$new_order.id = ...':
  Field 'Order.id' is @generated and cannot be explicitly set.
  Remove this mutation — the runtime generates the id automatically.

ERROR [behavior-missing-required] behaviors.graph:32
  Behavior 'place_order', create(Order):
  Missing required field 'total'.
  Order requires: status (has default), total (MISSING), user (provided)
```

#### Pass 6: Projection Type Checking

Verify projections have valid data bindings, state types, derived expressions, field types, and behavior wiring.

Checks:

**Data bindings:**
- `auth.user` resolves to the User entity type
- Field accessors on bindings reference valid entity fields
- Bound fields are not `@sensitive` unless explicitly declared in projection

**State:**
- All state types are valid
- Default values match the declared type

**Derived values:**
- Expressions reference valid state variables or data bindings
- Filter/sort operations target valid fields on the list item type
- Compute references match module signatures
- `query()` targets valid entities with valid filter fields
- `count()` and `sum()` target lists
- `when` conditions resolve to boolean

**Form fields:**
- `type()` is a valid field type
- `validate format()` matches the field type
- `validate compute()` references a valid module that returns a boolean
- `validate match()` references a valid field within the same form
- `placeholder()` references a valid binding that resolves to the same type as the field

**Actions:**
- `submit_to behavior()` references an existing behavior
- `send` names match the behavior's declared input names
- `send` value types match the behavior's declared input types
- `enabled_when` expressions reference valid state/form variables and resolve to boolean

**Visibility/interactivity:**
- `visible_when` expressions resolve to boolean
- `on_click set` targets valid state variables with type-compatible values
- `on_click append` targets list-type state variables with compatible item types
- `on_click remove` targets list-type state variables with valid filter conditions
- `bind_value` targets state variables with types compatible with the field type

Errors:
```
ERROR [projection-send-mismatch] projections.graph:28
  Projection 'profile_edit', action 'update_email_btn':
  Sends 'email' to behavior 'update_email',
  but behavior expects input named 'new_email'.
  
  Behavior 'update_email' inputs (behaviors.graph:5):
    new_email : string
  
  Did you mean: send new_email = field(new_email).value

ERROR [projection-binding-sensitive] projections.graph:12
  Projection 'profile_edit', data binding 'current_email = current_user.email':
  ✓ Valid — 'email' is not @sensitive.
  
  WARNING: Binding 'current_user.password_hash' would fail here because
  'password_hash' is @sensitive. This is informational only — no action needed.

ERROR [projection-derived-field] projections.graph:45
  Projection 'storefront', derived 'filtered_products':
  Expression 'products | where(name contains $state.search_term)':
  Entity 'Product' has no field 'name'.
  Available string fields on Product: title, description
  Did you mean 'title'?

ERROR [projection-state-type] projections.graph:38
  Projection 'storefront', on_click handler for 'add_to_cart':
  'append $state.cart_items = { ... }': Object includes field 'price'
  but earlier reference to cart_items uses field 'unit_price'.
  This may cause a runtime error in derived value 'cart_total'
  which accesses 'item.unit_price'.
```

#### Pass 7: Policy Completeness

Verify policies reference valid constraints and apply to valid targets.

Checks:
- `applies_to` lists valid entity names or projection references
- Rules reference valid constraints with correct parameter types
- `$target` type matches the entity the policy applies to
- Every entity has at least one policy (warning level — may be intentional for public data)
- Every projection with `auth required` has a policy

Errors:
```
ERROR [policy-constraint-param] policies.graph:5
  Policy 'owner_access', rule 'allow read when is_owner(target: $target)':
  Constraint 'is_owner' expects param 'target_entity', not 'target'.
  
  Constraint signature (constraints.graph:2):
    params target_entity : entity
  
  Fix: is_owner(target_entity: $target)

WARNING [policy-uncovered-entity] (global)
  Entity 'Product' has no policy attached.
  If this is intentional (public data), add a comment to document it.
  If not, consider adding a policy:
    policy product_access
      applies_to Product
      rule
        allow read when $target.active == true
        deny all
      end
    end
```

#### Pass 8: Cross-Cutting Validation

Full-graph queries that check consistency across all node types.

```sql
-- Find all entities that are mutated by behaviors but have no policy
SELECT DISTINCT e.to_node as entity_id
FROM edges e
JOIN nodes b ON b.id = e.from_node AND b.type = 'behavior'
WHERE e.type = 'mutates'
AND e.to_node NOT IN (
  SELECT json_extract(p.value, '$') FROM nodes pol,
  json_each(pol.properties, '$.applies_to') p
  WHERE pol.type = 'policy'
);

-- Find compute modules declared but never referenced
SELECT c.id FROM nodes c
WHERE c.type = 'compute'
AND c.id NOT IN (
  SELECT DISTINCT json_extract(step.value, '$.module')
  FROM nodes n, json_each(n.properties, '$.compute_steps') step
  UNION
  SELECT DISTINCT json_extract(step.value, '$.module')
  FROM nodes n, json_each(n.properties, '$.evaluate') step
  WHERE json_extract(step.value, '$.type') = 'compute'
);

-- Find behaviors triggered by projections that don't exist
SELECT b.id, json_extract(b.properties, '$.trigger') as trigger_ref
FROM nodes b
WHERE b.type = 'behavior'
AND json_extract(b.properties, '$.trigger_projection') NOT IN (
  SELECT id FROM nodes WHERE type = 'projection'
);
```

Checks:
- No orphan nodes (nodes with no edges — warning level)
- No unused compute modules (warning level)
- No circular preconditions (behavior A requires constraint that triggers behavior A)
- Every behavior trigger references a valid projection and action
- Event listeners reference valid event names that are actually emitted somewhere
- All `navigate()` targets match a projection's route

Warnings:
```
WARNING [unused-compute] compute.graph:18
  Compute module 'generate_confirmation_code' is declared but never referenced
  by any behavior or constraint.

WARNING [unreachable-listener] behaviors.graph:60
  Listener 'send_order_confirmation' listens for event 'order.confirmed',
  but no behavior emits 'order.confirmed'.
  Did you mean 'order.placed'?
  Events emitted in this application: order.placed, user.email_changed, user.password_changed
```

#### Pass 9: Component Validation

Verify all component declarations have valid contracts, and all usages in projections match those contracts.

```sql
-- Find all component usages in projections and validate against declarations
SELECT p.id as projection, json_extract(usage.value, '$.component_id') as comp_ref
FROM nodes p, json_each(p.properties, '$.component_usages') usage
WHERE p.type = 'projection'
AND json_extract(usage.value, '$.component_id') NOT IN (
  SELECT id FROM nodes WHERE type = 'component'
);
```

Checks:

**Component declarations:**
- Source file path exists (warning if missing)
- Prop types are valid (including record type field validation)
- Event types are valid
- No duplicate prop/event names
- Component name doesn't conflict with built-in layout primitives

**Component usages in projections:**
- Referenced component exists
- All `@required` props are provided
- Prop value types match declared types — **including full record shape validation**
- Event handlers reference valid state variables with compatible types
- `$event` type matches the declared event type (including record fields)
- Component is used in a valid layout position

**Render compute usages:**
- Referenced compute module exists
- Module declares `output markup : render(<format>)`
- Input params match module signature (including record types)
- `render` directive is in a valid layout position
- If `render(raw)` is used, emit a warning

Errors:
```
ERROR [component-missing-required] projections.graph:45
  Projection 'task_board', component 'drag_drop_list':
  Missing required prop 'items'.

  Component 'drag_drop_list' required props (components.graph:4):
    items : list(record({ id: uuid, title: string, position: integer })) @required

  Add: bind items = <list_binding>

ERROR [component-prop-type] projections.graph:72
  Projection 'admin_dashboard', component 'chart':
  Prop 'type' expects enum(bar, line, pie, area), received string "scatter".
  "scatter" is not a valid enum value.
  Valid values: bar, line, pie, area

ERROR [component-prop-record-mismatch] projections.graph:80
  Projection 'admin_dashboard', component 'data_table':
  Prop 'data' expects list(record({ id: uuid })).
  Binding 'all_orders' resolves to list of entity 'Order'.
  ✓ Order has field 'id' of type uuid — record shape is compatible.

ERROR [component-event-type] projections.graph:88
  Projection 'admin_dashboard', component 'data_table':
  Event 'on_row_click' has type record({ id: uuid }).
  Handler accesses '$event.order_id', but event record has no field 'order_id'.
  Available fields: id (uuid)
  Did you mean '$event.id'?

ERROR [component-unknown] projections.graph:95
  Projection 'admin_dashboard' uses component 'data_grid',
  which is not declared.
  Did you mean 'data_table'?
  Available components: chart, rich_text_editor, data_table, drag_drop_list

ERROR [render-not-render-type] projections.graph:55
  Projection 'storefront', render directive:
  Compute module 'calculate_discount' does not declare a render output.
  Only compute modules with 'output markup : render(...)' can be used
  in render directives.
  Compute modules with render output: sales_sparkline (svg), markdown_to_html (html_safe)

WARNING [render-raw-unsafe] projections.graph:62
  Projection 'content_page', render directive uses compute module
  'custom_template' with output type render(raw).
  Raw render output is not sanitized — ensure the compute module
  produces safe markup.
```

#### Pass 10: Adapter Validation

Verify adapter declarations and all adapter calls in behaviors.

```sql
-- Find all adapter calls in behaviors and validate against declarations
SELECT b.id as behavior, json_extract(ac.value, '$.adapter') as adapter_ref,
       json_extract(ac.value, '$.action') as action_ref
FROM nodes b, json_each(b.properties, '$.adapter_calls') ac
WHERE b.type = 'behavior';
```

Checks:

**Adapter declarations:**
- Config values referencing `env()` use valid environment variable names (warning level)
- Action input/output types are valid
- No duplicate action names within an adapter
- No duplicate input/output names within an action

**Adapter calls in behaviors:**
- Referenced adapter exists
- Referenced action exists on that adapter
- Parameter names match the action's declared inputs
- Parameter types match
- When result fields are accessed later, they match the action's declared outputs
- Adapter calls appear AFTER preconditions and compute steps, BEFORE mutations (structural validation of behavior phase ordering)

Errors:
```
ERROR [adapter-missing-action] behaviors.graph:42
  Behavior 'place_order', adapter call 'stripe_payments.charge':
  Adapter 'stripe_payments' has no action 'charge'.
  Available actions: create_charge, create_refund
  Did you mean 'create_charge'?

ERROR [adapter-param-type] behaviors.graph:44
  Behavior 'place_order', adapter call 'stripe_payments.create_charge':
  Param 'amount' expects type 'integer', but received 'decimal'
  from 'total_result.total'.
  
  Stripe expects amounts in cents (integer). You may need a compute
  module to convert: dollars_to_cents(amount: total_result.total)

ERROR [adapter-output-field] behaviors.graph:48
  Behavior 'place_order', adapter result 'charge_result.reason':
  Action 'create_charge' has no output 'reason'.
  Available outputs: charge_id (string), status (enum), failure_reason (string)
  Did you mean 'failure_reason'?
```

### 3.4 Error Output Format

Errors are structured for both human and AI consumption:

```typescript
interface TypeCheckError {
  // Severity
  level: 'error' | 'warning' | 'info';

  // Error code for categorization
  code: string;  // e.g., 'behavior-compute-param-mismatch'

  // Location
  source_file: string;
  source_line: number;
  node_id: string;
  node_type: string;

  // What went wrong
  message: string;

  // Full context
  expected: string;
  received: string;
  path: string;  // e.g., "projection:profile_edit → action:update_email_btn → send:email → behavior:update_email → input:new_email"

  // Fix suggestions
  suggestions: string[];

  // Related locations (for cross-reference)
  related: Array<{
    source_file: string;
    source_line: number;
    description: string;
  }>;
}
```

**Console output format:**
```
✗ Build failed: 3 errors, 2 warnings

ERROR [behavior-compute-param-mismatch] behaviors.graph:18
│ Behavior 'update_password', compute step 'verify_result':
│ Param name mismatch calling 'verify_password'.
│
│   Expected: plaintext (from compute.graph:8)
│   Received: plain_text
│
│ Path: behavior:update_password → compute:verify_password → input:plaintext
│
│ Suggestion: Change 'plain_text' to 'plaintext'
│
│ Related:
│   compute.graph:8  — verify_password input declaration
│   behaviors.graph:6 — behavior input that provides the value

ERROR [projection-send-name] projections.graph:28
│ ...

ERROR [constraint-invalid-traversal] constraints.graph:8
│ ...

WARNING [unused-compute] compute.graph:18
│ ...

WARNING [policy-uncovered-entity] (global)
│ ...
```

**JSON output** (for programmatic consumption by AI tools):

```bash
graphlang check ./app/ --format json
```

Returns the array of TypeCheckError objects — AI can parse this directly and make targeted fixes.

### 3.5 Type Checking as a Standalone Step

The type checker is a standalone command that doesn't require the runtime:

```bash
# Just type-check, nothing else
graphlang check ./app/

# Type-check with JSON output (for AI consumption)
graphlang check ./app/ --format json

# Type-check a single file (faster iteration)
graphlang check ./app/behaviors.graph
```

This means the AI development loop is:
1. AI generates/modifies `.graph` files
2. Run `graphlang check`
3. AI reads errors, makes fixes
4. Repeat until clean
5. Run `graphlang build` to compile and serve

Steps 1-4 are fast (no compilation, no runtime startup). The type checker is the inner loop — it must be fast and its errors must be good enough for the AI to converge.

---

## 4. The DSL (.graph files)

### 4.1 Design Principles

- **Flat structure.** Every node and edge is a top-level declaration. No nesting hierarchies.
- **One statement per line.** Trivial for AI to emit, trivial to diff in git.
- **Explicit edges.** Every relationship is declared, never implicit.
- **Typed everything.** Node types, field types, edge types — all explicit.
- **Order-independent.** Declarations can appear in any order. The parser resolves references.
- **No computation in the graph.** Computation lives in TypeScript modules, referenced by name.

### 4.2 Syntax Reference

#### Comments

```
# This is a comment
```

#### Entity Nodes

Define data shapes with typed fields and annotations.

```
entity User
  field id : uuid @generated
  field email : string @format(email) @unique @required
  field password_hash : string @sensitive @required
  field name : string @required @min(1) @max(100)
  field role : enum(admin, customer) @default(customer)
  field created_at : timestamp @generated
  field updated_at : timestamp @generated
end

entity Product
  field id : uuid @generated
  field title : string @required @min(1) @max(200)
  field description : text
  field price : decimal @required @min(0)
  field inventory : integer @required @min(0) @default(0)
  field active : boolean @default(true)
end

entity Order
  field id : uuid @generated
  field status : enum(pending, confirmed, shipped, delivered, cancelled) @default(pending)
  field total : decimal @required @min(0)
  field created_at : timestamp @generated
end

entity OrderItem
  field id : uuid @generated
  field quantity : integer @required @min(1)
  field unit_price : decimal @required @min(0)
end
```

**Supported field types:**
- `string` — short text, supports `@min(n)`, `@max(n)`, `@format(email|url|phone)`
- `text` — long text, no length limits
- `integer` — whole numbers, supports `@min(n)`, `@max(n)`
- `decimal` — floating point, supports `@min(n)`, `@max(n)`, `@precision(n)`
- `boolean` — true/false
- `uuid` — universally unique identifier
- `timestamp` — ISO 8601 datetime
- `enum(val1, val2, ...)` — restricted set of values
- `record({ field: type, ... })` — inline structured type with named, typed fields. Enables full type checking through component props, adapter actions, and behavior inputs without resorting to `json`.
- `list(T)` — ordered collection of any type T, including `list(record({...}))` for typed collections
- `json` — arbitrary JSON blob. **Escape hatch — use sparingly.** Every `json` usage is a hole in the type system where the checker can't validate field access. Prefer `record({...})` when the shape is known.

**Record type examples:**
```
# Typed cart items instead of list(json)
field items : list(record({
  product_id : uuid,
  title : string,
  unit_price : decimal,
  quantity : integer
}))

# Typed address
field address : record({
  street : string,
  city : string,
  state : string,
  zip : string @format(zip)
})

# Typed table column config
field columns : list(record({
  field : string,
  label : string,
  sortable : boolean @default(true)
}))
```

The type checker validates record field access throughout the graph. When a behavior accesses `$item.unit_price`, the checker verifies that the record includes `unit_price` of type `decimal`. When a component prop expects `list(record({ field: string, label: string }))`, the checker verifies the binding provides that exact shape. This eliminates the class of runtime errors where AI generates code that accesses fields that don't exist on the object.

**Supported field annotations:**
- `@required` — field cannot be null
- `@unique` — value must be unique across all instances
- `@generated` — runtime sets this, not user input (type checker prevents mutation)
- `@sensitive` — never exposed in projections unless explicitly bound (type checker warns)
- `@default(value)` — default value (type checker verifies value matches field type)
- `@format(type)` — format validation (type checker propagates format to bindings)
- `@min(n)` / `@max(n)` — range constraints (type checker verifies on numeric/string types only)
- `@immutable` — cannot be changed after creation (type checker prevents mutation in behaviors)

#### Relationship Edges

```
edge User -> Order : has_many
  on_delete cascade
end

edge Order -> OrderItem : has_many
  on_delete cascade
end

edge OrderItem -> Product : belongs_to
  required true
end

edge Order -> User : belongs_to
  required true
end
```

**Edge cardinalities:** `has_one`, `has_many`, `belongs_to`, `many_to_many`

**Edge properties:**
- `on_delete cascade|nullify|restrict|deny`
- `required true|false`
- `inverse <edge_name>`

#### Compute Modules

Declare compute modules with typed signatures. Implementation lives in `.ts` files (pure TypeScript functions). The type checker validates that every reference to a compute module matches its declared signature.

```
compute hash_password
  description "Hash a plaintext password"
  source "compute/hash_password.ts"
  input plaintext : string
  output hashed : string
end

compute verify_password
  description "Verify plaintext against hash"
  source "compute/verify_password.ts"
  input plaintext : string
  input hash : string
  output valid : boolean
end

compute calculate_order_total
  description "Sum line items"
  source "compute/calculate_order_total.ts"
  input items : list(record({
    unit_price : decimal,
    quantity : integer
  }))
  output total : decimal
end

compute calculate_discount
  description "Apply loyalty tier discount"
  source "compute/calculate_discount.ts"
  input subtotal : decimal
  input tier : string
  output final_total : decimal
  output discount_amount : decimal
end

compute validate_password_strength
  description "Check password strength requirements"
  source "compute/validate_password_strength.ts"
  input password : string
  output valid : boolean
  output reason : string
end

compute format_currency
  description "Format decimal as currency string"
  source "compute/format_currency.ts"
  input amount : decimal
  input currency : string
  output formatted : string
end
```

#### Constraint Nodes

Reusable conditions with typed parameters.

```
constraint is_owner
  description "Check if authenticated user owns the target entity"
  params target_entity : entity
  evaluate
    traverse auth.user -> id as auth_id
    traverse target_entity -> user -> id as owner_id
    assert auth_id == owner_id
  end
end

constraint is_role
  description "Check if authenticated user has a specific role"
  params required_role : string
  evaluate
    traverse auth.user -> role as user_role
    assert user_role == required_role
  end
end

constraint email_is_valid
  description "Validate email format and uniqueness"
  params email_value : string
  evaluate
    assert format(email_value, "email")
    assert unique(User.email, email_value)
  end
end

constraint passwords_match
  description "Check that two password fields match"
  params password_a : string, password_b : string
  evaluate
    assert password_a == password_b
  end
end

constraint password_is_strong
  description "Validate password strength via compute module"
  params password : string
  evaluate
    compute result = validate_password_strength(password: password)
    assert result.valid
    on_fail result.reason
  end
end
```

#### Policy Nodes

```
policy owner_access
  description "Users can only access their own data"
  applies_to User, Order, OrderItem
  rule
    allow read when is_owner(target_entity: $target)
    allow write when is_owner(target_entity: $target)
    allow read when is_role(required_role: "admin")
    allow write when is_role(required_role: "admin")
    deny all
  end
end

policy public_read_products
  description "Anyone can read active products"
  applies_to Product
  rule
    allow read when $target.active == true
    allow write when is_role(required_role: "admin")
    deny all
  end
end

policy admin_dashboard_access
  description "Only admins can access the admin dashboard"
  applies_to projection(admin_dashboard)
  rule
    allow access when is_role(required_role: "admin")
    deny all
  end
end
```

#### Behavior Nodes

```
behavior update_email
  description "Update a user's email address"
  trigger projection(profile_edit).action(update_email_btn)

  input
    new_email : string
  end

  precondition is_owner(target_entity: $target_user)
  precondition email_is_valid(email_value: $input.new_email)

  mutate $target_user.email = $input.new_email
  mutate $target_user.updated_at = now()

  effect emit(user.email_changed, user: $target_user)
  effect notify(
    channel: email,
    to: $target_user.email,
    template: "email_change_confirmation"
  )

  on_success show_message("Email updated", type: success)
  on_failure show_message($error, type: error)
end

behavior update_password
  description "Change a user's password"
  trigger projection(profile_edit).action(change_password_btn)

  input
    current_password : string
    new_password : string
    confirm_password : string
  end

  precondition is_owner(target_entity: $target_user)
  precondition passwords_match(
    password_a: $input.new_password,
    password_b: $input.confirm_password
  )
  precondition password_is_strong(password: $input.new_password)

  compute verify_result = verify_password(
    plaintext: $input.current_password,
    hash: $target_user.password_hash
  )
  require verify_result.valid else "Current password is incorrect"

  compute hash_result = hash_password(plaintext: $input.new_password)

  mutate $target_user.password_hash = hash_result.hashed
  mutate $target_user.updated_at = now()

  effect emit(user.password_changed, user: $target_user)
  effect invalidate_sessions(user: $target_user, except: $current_session)

  on_success show_message("Password changed", type: success)
  on_failure show_message($error, type: error)
end

behavior place_order
  description "Create a new order from cart items"
  trigger projection(storefront).action(checkout_btn)

  input
    items : list(record({
      product_id : uuid,
      title : string,
      unit_price : decimal,
      quantity : integer
    }))
  end

  precondition is_role(required_role: "customer")

  compute total_result = calculate_order_total(items: $input.items)

  mutate $new_order = create(Order,
    status: "pending",
    total: total_result.total,
    user: $auth.user
  )
  mutate each($input.items, item ->
    create(OrderItem,
      order: $new_order,
      product: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    )
  )
  mutate each($input.items, item ->
    decrement(item.product_id, inventory, by: item.quantity)
  )

  effect emit(order.placed, order: $new_order)

  on_success navigate("/orders/" + $new_order.id)
  on_failure show_message($error, type: error)
end
```

**Behavior execution phases (strict order):**

1. `input` — declare and validate input types
2. `precondition` — evaluate constraints (short-circuit on failure)
3. `compute` — call compute modules, bind results
4. `require` — assert on compute results
5. `adapter` — call external services via typed adapter actions, bind results
6. `require` — assert on adapter results
7. `mutate` — change entity data (atomic transaction — all or nothing)
8. `effect` — fire async side effects (non-transactional)
9. `on_success` / `on_failure` — respond to triggering projection

Adapter calls happen BEFORE mutations so that a failed external call (e.g., Stripe charge declined) doesn't leave orphaned entity data. Effects happen AFTER mutations because they're non-critical (notifications, analytics).

**Adapter call syntax in behaviors:**

```
behavior place_order_with_payment
  trigger projection(checkout).action(pay_btn)

  input
    items : list(record({
      product_id : uuid,
      title : string,
      unit_price : decimal,
      quantity : integer
    }))
    payment_token : string
  end

  precondition is_role(required_role: "customer")

  compute total_result = calculate_order_total(items: $input.items)

  # Adapter call — typed contract, external I/O
  adapter charge_result = stripe_payments.create_charge(
    amount: total_result.total_cents,
    currency: "usd",
    token: $input.payment_token,
    description: "Order"
  )
  require charge_result.status == "succeeded" else "Payment failed: " + charge_result.failure_reason

  mutate $new_order = create(Order,
    status: "confirmed",
    total: total_result.total,
    payment_id: charge_result.charge_id,
    user: $auth.user
  )

  effect emit(order.placed, order: $new_order)
  effect adapter analytics.track(
    event_name: "order_placed",
    properties: { order_id: $new_order.id, total: total_result.total }
  )

  on_success navigate("/orders/" + $new_order.id)
  on_failure show_message($error, type: error)
end
```

**Special variables:**
- `$input` — the input data from the trigger
- `$target` or `$target_<entity>` — the entity being operated on
- `$auth` — authentication context (`$auth.user`, `$auth.session`)
- `$current_session` — the current browser session
- `$error` — error message on failure
- `$new_<n>` — reference to a newly created entity
- `$event` — event data (in listeners)
- `now()` — built-in that returns current timestamp

#### Projection Nodes

Projections define UI structure, data bindings, client-side state, derived values, and interaction wiring. The compiler generates client-side JavaScript from these definitions.

```
projection profile_edit
  description "User profile editing page"
  route /account/profile
  auth required
  policy owner_access

  data
    bind current_user = auth.user
    bind current_email = current_user.email
    bind current_name = current_user.name
  end

  layout
    page max_width(narrow) padding(comfortable)
      heading level(1) "Edit Profile"

      section id(email_section)
        heading level(2) "Email Address"

        form id(email_form) target(current_user)
          field id(new_email) type(email) label("New Email")
            placeholder(current_email)
            validate format(email)
            required true
          end

          action id(update_email_btn) label("Update Email") style(primary)
            enabled_when form_valid and form_dirty
            submit_to behavior(update_email)
            send new_email = field(new_email).value
          end
        end
      end

      divider

      section id(password_section)
        heading level(2) "Change Password"

        form id(password_form) target(current_user)
          field id(current_password) type(password) label("Current Password")
            required true
          end

          field id(new_password) type(password) label("New Password")
            required true
            validate compute(validate_password_strength, password: $value)
          end

          field id(confirm_password) type(password) label("Confirm New Password")
            required true
            validate match(field(new_password).value)
            error_message "Passwords do not match"
          end

          action id(change_password_btn) label("Change Password") style(primary)
            enabled_when form_valid and form_dirty
            submit_to behavior(update_password)
            send current_password = field(current_password).value
            send new_password = field(new_password).value
            send confirm_password = field(confirm_password).value
          end
        end
      end
    end
  end
end

projection storefront
  description "Customer-facing product catalog"
  route /shop
  auth optional

  data
    bind products = query(Product, where: active == true, order: title asc)
  end

  state
    search_term : string = ""
    cart_items : list(record({
      product_id : uuid,
      title : string,
      unit_price : decimal,
      quantity : integer
    })) = []
    cart_visible : boolean = false
  end

  derived
    filtered_products = products | where(title contains $state.search_term)
    cart_count = count($state.cart_items)
    cart_total = compute(format_currency,
      amount: compute(calculate_order_total, items: $state.cart_items),
      currency: "USD"
    )
  end

  layout
    page max_width(wide) padding(comfortable)
      heading level(1) "Shop"

      section id(search_bar)
        field id(search) type(text) label("Search Products")
          bind_value $state.search_term
          debounce 200ms
        end
      end

      grid columns(3) gap(medium)
        each filtered_products as product
          card
            text product.title style(bold)
            text compute(format_currency, amount: product.price, currency: "USD")
            text product.inventory + " in stock"

            action id(add_to_cart) label("Add to Cart") style(secondary)
              enabled_when product.inventory > 0
              on_click
                append $state.cart_items = {
                  product_id: product.id,
                  title: product.title,
                  unit_price: product.price,
                  quantity: 1
                }
                set $state.cart_visible = true
              end
            end
          end
        end
      end

      section id(cart_section) visible_when $state.cart_visible
        heading level(2) "Cart (" + cart_count + " items)"

        each $state.cart_items as item
          row
            text item.title
            text "x" + item.quantity
            text compute(format_currency,
              amount: item.quantity * item.unit_price, currency: "USD")
            action label("Remove") style(link)
              on_click remove $state.cart_items where product_id == item.product_id
            end
          end
        end

        text "Total: " + cart_total style(bold)

        action id(checkout_btn) label("Checkout") style(primary)
          submit_to behavior(place_order)
          send items = $state.cart_items
        end
      end
    end
  end
end
```

##### Projection Layout Primitives

**Container types:**
- `page` — root. Props: `max_width(narrow|medium|wide|full)`, `padding(none|tight|comfortable|spacious)`
- `section` — grouping. Props: `id()`, `visible_when <condition>`
- `card` — elevated container
- `row` — horizontal layout
- `grid` — grid layout. Props: `columns(n)`, `gap(small|medium|large)`
- `form` — form container. Props: `id()`, `target(<entity_binding>)`

**Content types:**
- `heading` — Props: `level(1-6)`, text content
- `text` — inline text. Props: `style(bold|italic|muted|error|success)`
- `divider` — horizontal rule
- `image` — Props: `src(<binding>)`, `alt(text)`

**Input types:**
- `field` — form input. Props: `id()`, `type(text|email|password|number|textarea|select|checkbox|date)`, `label()`, `placeholder()`, `required`, `validate`, `error_message`, `options()`, `bind_value <state_var>`, `debounce <duration>`

**Interactive types:**
- `action` — button. Props: `id()`, `label()`, `style(primary|secondary|danger|link)`, `enabled_when`, `visible_when`, `submit_to behavior()`, `send <key> = <value>`
- `link` — navigation. Props: `to(<route>)`, `label()`
- `option` — selectable item within a list

**Iteration:** `each <binding> as <item>`

**Reactive modifiers:**
- `visible_when <condition>` — show/hide
- `enabled_when <condition>` — enable/disable
- `bind_value <state_var>` — two-way binding
- `debounce <duration>` — delay state updates
- `on_click` / `on_focus` / `on_blur` — handlers with state mutations
- `delay(<duration>)` — delay execution

**State mutations (inside handlers):**
- `set $state.x = <value>`
- `toggle $state.x`
- `append $state.list = <value>`
- `remove $state.list where <condition>`

**Derived values:**
- `<n> = <expression>` — re-evaluates when deps change
- `<n> = compute(<module>, params)` — computed via TypeScript function
- `<n> = query(Entity, ...) when <condition>` — reactive server query
- `<n> = <list> | where(<condition>)` — client-side filter
- `<n> = <list> | sort(<field>, asc|desc)` — client-side sort
- `count(<list>)`, `sum(<list>, <field>)` — aggregations

##### Match Expressions

`match` lets a projection produce entirely different layout subtrees based on state or data. Unlike `visible_when` (which toggles visibility on a single element), `match` swaps the entire layout structure — different elements, different bindings, different components.

**Syntax:**

```
match <expression>
  when <value>
    # layout subtree for this case
  end
  when <value>
    # different layout subtree
  end
  else
    # fallback
  end
end
```

**Match on entity data (enum fields):**

```
match order.status
  when "pending"
    section
      text "Your order is being processed."
      action label("Cancel Order") style(danger)
        submit_to behavior(cancel_order)
        send order_id = order.id
      end
    end

  when "shipped"
    section
      text "Your order is on its way!"
      card
        heading level(3) "Tracking"
        text "Carrier: " + order.carrier
        text "Tracking: " + order.tracking_number
        link to(order.tracking_url) label("Track Package")
      end
    end

  when "delivered"
    section
      text "Delivered on " + order.delivered_at
      action label("Write a Review") style(primary)
        on_click set $state.editing = true
      end
    end

  when "cancelled"
    section
      text "This order was cancelled." style(error)
    end
end
```

Each branch is a complete layout subtree with its own bindings, components, and behavior wiring. The type checker validates each branch independently.

**Match on client state:**

```
match $state.view_mode
  when "grid"
    grid columns(3) gap(medium)
      each products as product
        card
          text product.title
          text compute(format_currency, amount: product.price, currency: "USD")
        end
      end
    end

  when "list"
    each products as product
      row
        text product.title
        text compute(format_currency, amount: product.price, currency: "USD")
        text product.description style(muted)
      end
    end
end
```

**Nested match:**

Match expressions nest naturally. A match on server data can contain a match on client state:

```
match order.status
  when "delivered"
    match $state.editing
      when true
        form id(review_form)
          field id(rating) type(select) label("Rating")
            options(["1", "2", "3", "4", "5"])
          end
          field id(review_text) type(textarea) label("Review")
          end
          action label("Submit") style(primary)
            submit_to behavior(submit_review)
            send order_id = order.id
            send rating = field(rating).value
            send review_text = field(review_text).value
          end
        end
      when false
        action label("Write a Review") style(primary)
          on_click set $state.editing = true
        end
      end
    end
  end
end
```

**Match with transitions:**

```
# Transitions between match branches are handled by CSS targeting
# data-gl-match-enter and data-gl-match-exit attributes.
# The graph only declares the match — CSS decides how it animates.
```

The transition modifier tells the compiler to animate between branches. The outgoing branch transitions out, the incoming branch transitions in. Available transitions: `crossfade(<duration>)`, `slide_left(<duration>)`, `slide_up(<duration>)`, `none`. Custom transitions can be defined in the theme.

**Type checker behavior with match:**

- When matching on an enum field, the type checker verifies every enum value is covered, or that an `else` branch exists. Missing values produce a warning:
  ```
  WARNING [match-incomplete] projections.graph:25
    match on 'order.status': missing enum value "confirmed".
    Values for Order.status: pending, confirmed, shipped, delivered, cancelled
    Add a branch or add 'else ... end'
  ```
- Each branch is type-checked independently — bindings, component props, behavior wiring are all validated per branch.
- When matching on a boolean, the type checker expects `when true` and `when false` branches.
- When matching on client state, the compiler generates a switch that swaps DOM subtrees on state change.
- When matching on server data, the server renders the correct branch initially and the client handles transitions if the data changes.

**Compiler output for match:**

For client-state matches, the compiler generates:

```javascript
// Generated from: match $state.view_mode
function renderViewModeMatch(container) {
  unmountCurrentBranch(container);
  switch (state.view_mode) {
    case 'grid':
      container.innerHTML = renderBranch_grid();
      initBranch_grid(container);
      break;
    case 'list':
      container.innerHTML = renderBranch_list();
      initBranch_list(container);
      break;
  }
}

watch('view_mode', () => renderViewModeMatch(viewModeContainer));
```

Each branch has its own render function and init function (which attaches event listeners, mounts components, etc.). When the match expression changes, the current branch is unmounted and the new branch is mounted.

##### Presentation & Transitions

The graph declares *when* things change. CSS declares *how* they look and animate. The graph never references colors, fonts, transitions, or animations.

The compiler generates predictable `data-gl-*` attributes on every element based on its graph identity and current state. CSS targets these attributes for all visual styling, including transitions and animations. See the **Styling** section (section 4, "Styling (CSS Source Files)") for the full data attribute reference and example CSS.

**What the graph controls:**
- `visible_when` — compiler toggles `data-gl-visible` between `true` and `false`
- `enabled_when` — compiler toggles `data-gl-enabled`
- `match` — compiler sets `data-gl-match` to the current branch value, adds `data-gl-match-enter` and `data-gl-match-exit` during transitions
- `each` — compiler re-renders the list when the bound data changes
- `style(primary)`, `style(bold)`, etc. — compiler generates `data-gl-action-style="primary"`, `data-gl-text-style="bold"`

**What CSS controls:**
- Whether `data-gl-visible="false"` means `display: none`, an opacity fade, a slide animation, or a 3D transform
- Whether match branch swaps are instant or animated
- Whether list item additions fade in, slide in, or appear instantly
- All colors, typography, spacing, borders, shadows, hover effects, focus styles

This separation means GraphLang never needs to replicate CSS features. CSS evolves independently. A redesign is a CSS change, not a graph change.

**List keys:**

The `each` block can specify a key field for efficient re-rendering:

```
each filtered_products as product
  card
    # ...
  end
end

# If the item type has no 'id' field, specify a key:
each items as item key(item.product_id)
  # ...
end
```

The type checker validates that the key field exists on the item type. For the prototype, the compiler re-renders the entire list via innerHTML when the data changes. Keyed DOM diffing with enter/exit/move detection is a future optimization — when implemented, the compiler will add `data-gl-enter` and `data-gl-exit` attributes on affected items for CSS to animate.


##### UI Extensibility

The built-in layout primitives cover common patterns. For everything else, GraphLang provides two extensibility mechanisms — both with typed boundaries.

**1. Components — Typed UI Extension Points**

A component is a reusable UI element with typed props flowing in and typed events flowing out. The implementation is opaque JavaScript with a mount/update/unmount contract. The graph declares the typed interface; the JS file handles rendering and interaction. Whether you're embedding a one-off drag-and-drop list or a reusable chart used across ten projections, it's the same concept: a component declaration with typed props and events.

```
component drag_drop_list
  description "Reorderable list with drag and drop"
  source "components/drag_drop_list.js"

  prop items : list(record({
    id : uuid,
    title : string,
    position : integer
  })) @required
  prop item_template : string @default("default")

  event on_reorder : list(record({
    id : uuid,
    position : integer
  }))
  event on_remove : record({ id : uuid })
end

component chart
  description "Data visualization chart"
  source "components/chart.js"

  prop data : list(record({
    label : string,
    value : decimal
  })) @required
  prop type : enum(bar, line, pie, area) @required
  prop title : string
  prop height : integer @default(300)
  prop color_scheme : enum(default, warm, cool, mono) @default(default)
end

component rich_text_editor
  description "WYSIWYG rich text editor"
  source "components/rich_text_editor.js"

  prop content : text
  prop placeholder : string
  prop toolbar : enum(full, minimal, none) @default(full)
  prop readonly : boolean @default(false)

  event on_change : text
  event on_save : text
end

component data_table
  description "Sortable, filterable data table"
  source "components/data_table.js"

  prop data : list(record({
    id : uuid
  })) @required
  prop columns : list(record({
    field : string,
    label : string,
    sortable : boolean @default(true)
  })) @required
  prop page_size : integer @default(25)

  event on_row_click : record({ id : uuid })
  event on_sort : record({ field : string, direction : enum(asc, desc) })
end
```

Used in projections:

```
projection task_board
  route /tasks
  auth required

  state
    tasks : list(record({
      id : uuid,
      title : string,
      position : integer
    })) = []
  end

  layout
    page max_width(wide)
      heading level(1) "My Tasks"

      component(drag_drop_list)
        bind items = $state.tasks
        on_reorder set $state.tasks = $event
        on_remove remove $state.tasks where id == $event.id
      end
    end
  end
end

projection admin_dashboard
  route /admin
  auth required
  policy admin_dashboard_access

  data
    bind monthly_sales = query(Order,
      where: status != "cancelled",
      group_by: month(created_at),
      aggregate: sum(total)
    )
    bind all_orders = query(Order, order: created_at desc, limit: 100)
  end

  layout
    page max_width(wide)
      heading level(1) "Admin Dashboard"

      grid columns(2) gap(medium)
        card
          heading level(2) "Revenue"
          component(chart)
            bind data = monthly_sales
            type(line)
            title("Monthly Revenue")
          end
        end

        card
          heading level(2) "Recent Orders"
          component(data_table)
            bind data = all_orders
            columns([
              { field: "id", label: "Order ID" },
              { field: "total", label: "Total" },
              { field: "status", label: "Status" },
              { field: "created_at", label: "Date" }
            ])
            on_row_click navigate("/admin/orders/" + $event.id)
          end
        end
      end
    end
  end
end
```

The type checker validates:
- The component exists (is declared)
- All `@required` props are provided
- Prop value types match declared types — **including record field shapes**
- Event handlers use valid state mutations or navigation
- `$event` type matches the component's declared event type
- Component name doesn't conflict with built-in layout primitives

**Component JS implementation contract:**

```javascript
// components/chart.js
// All components follow the same lifecycle contract.

export function mount(element, props, emit) {
  // element: DOM node to render into
  // props: typed data matching declared prop types
  // emit: function to fire typed events — emit('on_row_click', { id: '...' })
  // Full DOM control within the element.
}

export function update(element, props) {
  // Called when bound prop values change (state updates, data refreshes).
  // Efficient diffing is the component's responsibility.
}

export function unmount(element) {
  // Cleanup: remove event listeners, cancel timers, etc.
  // Called when the projection navigates away or the component's
  // visible_when condition becomes false.
}
```

**2. Render Compute — TypeScript-Generated Typed Markup**

A compute module can declare a `render(<format>)` output type, meaning it returns a markup fragment. The format specifier tells the runtime what sanitization rules to apply and tells the compute module author what they're allowed to emit.

```
compute sales_sparkline
  description "Generate an inline SVG sparkline from sales data"
  source "compute/sales_sparkline.ts"
  input data : list(record({ month : string, total : decimal }))
  input width : integer
  input height : integer
  output markup : render(svg)
end

compute markdown_to_html
  description "Convert markdown text to safe HTML"
  source "compute/markdown_to_html.ts"
  input source : text
  output markup : render(html_safe)
end

compute syntax_highlight
  description "Syntax-highlight a code block"
  source "compute/syntax_highlight.ts"
  input code : text
  input language : string
  output markup : render(html_safe)
end
```

**Render format types:**
- `render(svg)` — sanitizer allows SVG elements and attributes only. No `<script>`, no event handlers, no foreign object.
- `render(html_safe)` — sanitizer allows a safe subset of HTML: text formatting, links, lists, tables, code blocks. No `<script>`, no `<iframe>`, no `on*` attributes.
- `render(raw)` — no sanitization. **Use only for trusted content.** Type checker emits a warning when `render(raw)` is used.

Used in projections:

```
section id(sparklines)
  each products as product
    row
      text product.title
      render compute(sales_sparkline,
        data: product.monthly_sales,
        width: 200,
        height: 40
      )
    end
  end
end

section id(product_description)
  render compute(markdown_to_html, source: product.description)
end
```

The type checker validates:
- The compute module exists and declares a `render(...)` output
- Input param names and types match
- The `render` directive is used in a valid layout position
- If `render(raw)` is used, emit a warning about unsanitized content

**Extensibility Summary**

| Mechanism | Use Case | Type Safety | Implementation |
|-----------|----------|-------------|----------------|
| Components | Any custom UI: charts, drag-drop, editors, maps | Typed props + events (including record shapes) | JS with mount/update/unmount |
| Render compute | Computed markup: sparklines, markdown, syntax highlighting | Typed inputs, format-specific sanitization | TypeScript returning HTML/SVG string |
| Typed adapters | External services: Stripe, email, analytics | Typed action inputs + outputs | Runtime handles HTTP/protocol |

The unifying principle across all three: **the graph never tries to express the internals.** It only expresses the typed contract at the boundary.

#### Event Listeners

```
listener send_order_confirmation
  on event(order.placed)
  trigger behavior(send_confirmation)
  pass order = $event.order
end
```

#### Adapter Nodes

Adapters bridge to external systems with **typed action contracts**. Each action declares typed inputs and outputs so behaviors can call them with full type checking — the same way they call compute modules. The adapter owns the implementation (HTTP calls, SDK usage); the graph owns the contract.

```
adapter email_sender
  description "Send transactional emails via SMTP"
  type smtp
  config
    host env(SMTP_HOST)
    port env(SMTP_PORT)
    user env(SMTP_USER)
    password env(SMTP_PASSWORD)
  end

  action send
    input to : string @format(email)
    input subject : string
    input template : string
    input data : json
    output message_id : string
    output status : enum(sent, queued, failed)
  end
end

adapter stripe_payments
  description "Process payments via Stripe"
  type http
  config
    base_url "https://api.stripe.com/v1"
    auth bearer(env(STRIPE_SECRET_KEY))
  end

  action create_charge
    input amount : integer
    input currency : string
    input token : string
    input description : string
    output charge_id : string
    output status : enum(succeeded, pending, failed)
    output failure_reason : string
  end

  action create_refund
    input charge_id : string
    input amount : integer
    output refund_id : string
    output status : enum(succeeded, pending, failed)
  end
end

adapter analytics
  description "Track events to analytics service"
  type http
  config
    base_url env(ANALYTICS_URL)
    auth header("X-API-Key", env(ANALYTICS_KEY))
  end

  action track
    input event_name : string
    input properties : json  # Intentionally json — event properties vary per event type and are freeform by nature
    output accepted : boolean
  end
end
```

Behaviors call adapter actions the same way they call compute modules:

```
behavior place_order
  # ... preconditions, compute steps ...

  # Call adapter with typed contract
  adapter charge_result = stripe_payments.create_charge(
    amount: total_result.total_cents,
    currency: "usd",
    token: $input.payment_token,
    description: "Order " + $new_order.id
  )
  require charge_result.status == "succeeded" else "Payment failed: " + charge_result.failure_reason

  # ... mutations, effects ...
end
```

The type checker validates:
- The adapter exists
- The action exists on that adapter
- Parameter names match the action's declared inputs
- Parameter types match
- When result fields are accessed, they match the action's declared outputs

**Key rules:**
- Adapters are the only nodes that perform external I/O
- Adapter calls in behaviors happen AFTER preconditions, BEFORE mutations (so a failed payment doesn't leave orphaned data)
- Adapter calls are NOT inside the mutation transaction — they're a separate phase
- If an adapter call fails and you need to roll back mutations from a previous behavior, you need saga/compensation patterns (documented as a future concern)

#### Styling (CSS Source Files)

GraphLang does not have a styling DSL. All visual presentation — colors, typography, spacing, transitions, animations — lives in standard CSS files. The graph declares structure and state. CSS declares how it looks.

**The compiler generates predictable data attributes on every element:**

```html
<!-- Generated from projection: storefront, section: cart_section -->
<section data-gl-projection="storefront"
         data-gl-node="cart_section"
         data-gl-visible="true"
         data-gl-type="section">

<!-- Generated from action with style(primary) -->
<button data-gl-type="action"
        data-gl-action-style="primary"
        data-gl-enabled="true">

<!-- Generated from text with style(bold) -->
<span data-gl-type="text"
      data-gl-text-style="bold">

<!-- Generated from match on order.status, current branch: shipped -->
<div data-gl-type="match"
     data-gl-match="shipped">

<!-- Generated from each block -->
<div data-gl-type="each-item">
```

**CSS targets these attributes:**

```css
/* Base styles for actions */
[data-gl-type="action"] {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

[data-gl-action-style="primary"] {
  background: var(--color-primary);
  color: white;
}

[data-gl-action-style="danger"] {
  background: var(--color-danger);
  color: white;
}

[data-gl-enabled="false"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Visibility transitions */
[data-gl-visible="false"] {
  opacity: 0;
  transition: opacity 200ms ease-out;
  pointer-events: none;
}
[data-gl-visible="true"] {
  opacity: 1;
  transition: opacity 200ms ease-in;
}

/* Match branch transitions */
[data-gl-match-exit] { animation: fadeOut 150ms ease-out forwards; }
[data-gl-match-enter] { animation: fadeIn 200ms ease-in; }

/* List item enter/exit */
/* Future: when keyed list diffing is implemented, these will fire on item enter/exit */
/* [data-gl-enter] { animation: slideIn 200ms ease-out; } */
/* [data-gl-exit] { animation: fadeOut 150ms ease-out forwards; } */

/* Design tokens */
:root {
  --color-primary: #6366F1;
  --color-secondary: #8B5CF6;
  --color-danger: #EF4444;
  --color-success: #22C55E;
  --color-background: #FFFFFF;
  --color-surface: #F8FAFC;
  --color-border: #E2E8F0;
  --color-text: #0F172A;
  --color-text-muted: #64748B;
  --spacing: 8px;
  --radius: 8px;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes slideIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
```

**PostCSS lint pass (optional):**

At build time, an optional PostCSS plugin scans CSS files for `data-gl-node` and `data-gl-projection` selectors, then validates them against the graph in SQLite. This catches typos in CSS selectors that reference graph nodes:

```
WARNING [css-unknown-node] styles/projections.css:14
  Selector references data-gl-node="cart_secton" which does not exist.
  Did you mean "cart_section"?
  Available nodes in projection 'storefront': search_bar, cart_section, product_grid
```

This is a warning, not an error. Broken CSS selectors don't break functionality — they only affect presentation. The build does not fail on CSS warnings.

---

## 5. Compute Layer (TypeScript)

### 5.1 Why TypeScript

Compute modules are pure TypeScript functions. The same code runs on the server (Node.js) and in the browser (bundled into client JS). No compilation step beyond standard `tsc`. No marshaling. No special runtime.

- **Direct function calls.** No serialization, no memory management, no loader. Import and call.
- **AI writes it reliably.** TypeScript is the language AI knows best. No dialects, no subsets.
- **Native record types.** Typed objects pass directly — no JSON serialization round-trips.
- **Two layers of type checking.** GraphLang's type checker validates the graph wiring. TypeScript's type checker validates the function implementation. Both must pass.
- **Same code, both runtimes.** The server imports the function directly. The client bundler includes it in the generated JS. No "compile once, deploy everywhere" complexity — it's just JavaScript.

### 5.2 Compute Module Rules

Compute modules must be **pure functions** — no side effects, no external state. The build step enforces this with a lint pass:

- Must export named functions only (no default exports, no classes, no mutable state)
- Cannot import `fs`, `path`, `net`, `http`, `https`, `child_process`, `crypto` (Node-only modules)
- Cannot reference `fetch`, `XMLHttpRequest`, `document`, `window`, `globalThis`
- Cannot use `Math.random()` or `Date.now()` (non-deterministic)
- Return type must be a plain object, primitive, or array — no Promises, no callbacks

Violations are build errors, not warnings.

### 5.3 Example Compute Modules

#### compute/hash_password.ts
```typescript
// Prototype-quality hash — replace with bcrypt adapter for production
export function hash_password(plaintext: string): { hashed: string } {
  let hash = 5381;
  for (let i = 0; i < plaintext.length; i++) {
    hash = ((hash << 5) + hash) + plaintext.charCodeAt(i);
  }
  return { hashed: "hashed_" + hash.toString() };
}
```

#### compute/verify_password.ts
```typescript
export function verify_password(plaintext: string, hash: string): { valid: boolean } {
  let computed = 5381;
  for (let i = 0; i < plaintext.length; i++) {
    computed = ((computed << 5) + computed) + plaintext.charCodeAt(i);
  }
  return { valid: hash === "hashed_" + computed.toString() };
}
```

#### compute/calculate_order_total.ts
```typescript
interface LineItem {
  unit_price: number;
  quantity: number;
}

export function calculate_order_total(items: LineItem[]): { total: number } {
  const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  return { total: Math.round(total * 100) / 100 };
}
```

#### compute/calculate_discount.ts
```typescript
export function calculate_discount(subtotal: number, tier: string): { final_total: number; discount_amount: number } {
  let rate = 0;
  if (tier === "gold") rate = 0.20;
  else if (tier === "silver") rate = 0.10;
  const discount_amount = Math.round(subtotal * rate * 100) / 100;
  return { final_total: subtotal - discount_amount, discount_amount };
}
```

#### compute/validate_password_strength.ts
```typescript
export function validate_password_strength(password: string): { valid: boolean; reason: string } {
  if (password.length < 8) return { valid: false, reason: "Must be at least 8 characters" };
  if (!/[A-Z]/.test(password)) return { valid: false, reason: "Must contain an uppercase letter" };
  if (!/[0-9]/.test(password)) return { valid: false, reason: "Must contain a digit" };
  return { valid: true, reason: "" };
}
```

#### compute/format_currency.ts
```typescript
export function format_currency(amount: number, currency: string): { formatted: string } {
  const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] || currency + " ";
  return { formatted: symbol + amount.toFixed(2) };
}
```

#### compute/markdown_to_html.ts
```typescript
// Render compute — returns markup string
export function markdown_to_html(source: string): { markup: string } {
  // Simple markdown conversion — replace with a proper library for production
  let html = source
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>').replace(/$/, '</p>');
  return { markup: html };
}
```

### 5.4 Compute Module Loading

```typescript
// Server: direct import
import { validate_password_strength } from './compute/validate_password_strength';
const result = validate_password_strength("MyPassword123");
// result: { valid: true, reason: "" }

// Client: bundled into generated JS by the compiler
// The projection compiler includes compute functions used in
// client-side validation and derived values.
```

No loader, no runtime, no marshaling. Functions are imported and called directly.

### 5.5 Graph ↔ TypeScript Type Contract

The graph declares compute module signatures. The TypeScript files implement them. Both are validated:

**Graph declaration (compute.graph):**
```
compute validate_password_strength
  description "Check password strength requirements"
  source "compute/validate_password_strength.ts"
  input password : string
  output valid : boolean
  output reason : string
end
```

**TypeScript implementation (compute/validate_password_strength.ts):**
```typescript
export function validate_password_strength(password: string): { valid: boolean; reason: string } {
  // ...
}
```

**GraphLang type checker validates:** Every behavior, constraint, and projection that references `validate_password_strength` passes the correct param names and types and accesses valid output fields.

**TypeScript compiler validates:** The function signature matches — input params are the right types, return type has the right fields. TypeScript catches implementation bugs (wrong variable types, missing returns, etc.).

**Build-time contract check:** The build step can optionally verify that the TypeScript function's actual signature matches the graph declaration. If the graph says `input password : string` but the TypeScript function takes `(pwd: string)`, the build reports a mismatch. This is a thin layer that parses the TypeScript AST and compares it against the graph's compute node properties.

---

## 6. Testing

Testing is a first-class concern in GraphLang, not an afterthought. The framework's design makes each layer independently testable, and the tooling enforces fast feedback by default.

### 6.1 Test Layers

| Layer | What's Tested | Substrate | Speed |
|-------|--------------|-----------|-------|
| Compute modules | Pure function correctness | None (direct import) | < 100ms for full suite |
| Type checker | Error detection and messages | In-memory SQLite | < 500ms for full suite |
| Constraints | Constraint evaluation logic | In-memory SQLite | Fast |
| Behaviors | Full precondition → compute → mutate pipeline | In-memory SQLite, stubbed adapters | Fast |
| Integration | Full graph → server → response | In-memory SQLite, test HTTP client | Seconds |

Each layer runs independently. Compute tests don't touch SQLite. Type checker tests don't start a server. Behavior tests don't make network calls.

### 6.2 Compute Module Tests

Compute modules are pure functions. Their tests require no setup:

```typescript
// tests/compute/calculate_order_total.test.ts
import { describe, it, expect } from 'vitest';
import { calculate_order_total } from '../../examples/ecommerce/compute/calculate_order_total';

describe('calculate_order_total', () => {
  it('sums line items', () => {
    const result = calculate_order_total({
      items: [
        { unit_price: 10.00, quantity: 2 },
        { unit_price: 5.50, quantity: 1 },
      ]
    });
    expect(result.total).toBe(25.50);
  });

  it('rounds to two decimal places', () => {
    const result = calculate_order_total({
      items: [{ unit_price: 0.1, quantity: 3 }]
    });
    expect(result.total).toBe(0.30);
  });
});
```

No mocks. No fixtures. No async. The purity constraint that makes compute modules safe for the runtime is exactly what makes them trivially testable.

### 6.3 Type Checker Tests

Type checker tests verify that specific graph definitions produce specific errors — or none. Each test parses a DSL snippet into an in-memory SQLite graph and runs the checker:

```typescript
// tests/typechecker/pass-behavior.test.ts
import { describe, it, expect } from 'vitest';
import { createTestGraph, runTypeChecker } from '../helpers';

describe('behavior type checking', () => {
  it('catches compute param name mismatch', () => {
    const graph = createTestGraph(`
      compute verify_password
        input plaintext : string
        input hash : string
        output valid : boolean
      end

      behavior update_password
        compute result = verify_password(
          plain_text: $input.current_password,
          hash: $target_user.password_hash
        )
      end
    `);

    const errors = runTypeChecker(graph);
    expect(errors).toContainError({
      code: 'behavior-compute-param-mismatch',
      expected: 'plaintext',
      received: 'plain_text',
    });
  });

  it('passes when param names match', () => {
    const graph = createTestGraph(`
      compute verify_password
        input plaintext : string
        input hash : string
        output valid : boolean
      end

      behavior update_password
        compute result = verify_password(
          plaintext: $input.current_password,
          hash: $target_user.password_hash
        )
      end
    `);

    const errors = runTypeChecker(graph);
    expect(errors).toHaveLength(0);
  });
});
```

`createTestGraph` parses the DSL snippet and writes it to a fresh `:memory:` SQLite database. Each test gets an isolated database — no shared state, no teardown needed. `runTypeChecker` executes all 10 passes synchronously against that database and returns the error list.

### 6.4 Behavior Tests

Behaviors are tested end-to-end using an in-memory graph and behavior executor. These tests verify the full precondition → compute → mutate pipeline against seeded entity state, with adapter calls stubbed:

```typescript
// tests/runtime/behavior.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestEnvironment } from '../helpers';

describe('update_email', () => {
  let env: TestEnvironment;

  beforeEach(() => {
    env = createTestEnvironment('examples/ecommerce');
  });

  it('updates the user email when valid', async () => {
    const user = env.seed('User', {
      email: 'old@example.com',
      name: 'Test User',
      role: 'customer',
    });

    const result = await env.executeBehavior('update_email',
      { new_email: 'new@example.com' },
      { auth: { user } }
    );

    expect(result.success).toBe(true);
    expect(env.find('User', user.id).email).toBe('new@example.com');
  });

  it('rejects an invalid email format', async () => {
    const user = env.seed('User', { email: 'old@example.com' });

    const result = await env.executeBehavior('update_email',
      { new_email: 'not-an-email' },
      { auth: { user } }
    );

    expect(result.success).toBe(false);
  });
});
```

`createTestEnvironment` loads the application graph into an in-memory SQLite database. Adapter calls are automatically stubbed with no-op responses unless explicitly overridden with `env.stubAdapter(...)`. No server starts. No network calls are made.

### 6.5 Watch Mode and Incremental Feedback

The `graphlang dev` watcher maintains a dependency map to minimize re-work on every save:

- **File → nodes**: which graph nodes are defined in this file
- **Node → passes**: which type checker passes care about this node type
- **Node → tests**: which test files exercise this node

On save:
1. Parse the changed file → identify which nodes changed
2. Run only the type checker passes affected by those node types
3. If type check passes → run only the tests associated with those nodes
4. Report results

A single behavior edit triggers Pass 5 (behavior type checking) plus the affected behavior's tests — typically under 200ms total. A compute module edit triggers Pass 3 plus that module's compute tests — typically under 50ms. A full re-check runs only when explicitly requested (`graphlang check`) or when a structural change affects many dependents (such as renaming an entity field).

The goal is **under 1 second** from save to feedback on any targeted change. The ceiling is **3 seconds** for a full re-check on a large project.

### 6.6 Test Helpers

Three helpers cover the full test surface:

**`createTestGraph(dsl: string): Database`**
Parses a DSL snippet and writes it to a fresh in-memory SQLite database. Returns the database handle. Used in type checker tests.

**`createTestEnvironment(appPath: string): TestEnvironment`**
Loads a full application graph into an in-memory SQLite database. Provides:
- `env.seed(entityType, data)` — insert entity data, returns the entity with generated fields
- `env.find(entityType, id)` — query a single entity
- `env.query(entityType, filters)` — query entities with filters
- `env.executeBehavior(behaviorId, input, auth)` — run a behavior, returns `{ success, error, data }`
- `env.stubAdapter(adapter, action, response)` — override an adapter action with a fixed response

**`runTypeChecker(db: Database): TypeCheckError[]`**
Runs all 10 type checker passes against the provided database and returns all errors and warnings. Used directly in type checker tests.

---

## 7. Graph Store (SQLite)

### 7.1 Schema

```sql
-- Graph structure (populated at build time from .graph files)
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  properties JSON NOT NULL,
  source_file TEXT,
  source_line INTEGER
);

CREATE TABLE edges (
  id TEXT PRIMARY KEY,
  from_node TEXT NOT NULL REFERENCES nodes(id),
  to_node TEXT NOT NULL REFERENCES nodes(id),
  type TEXT NOT NULL,
  properties JSON DEFAULT '{}',
  UNIQUE(from_node, to_node, type)
);

-- Application data (populated at runtime)
CREATE TABLE entity_data (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES entity_data(id),
  data JSON DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Indexes for type checker and runtime queries
CREATE INDEX idx_edges_from ON edges(from_node, type);
CREATE INDEX idx_edges_to ON edges(to_node, type);
CREATE INDEX idx_edges_type ON edges(type);
CREATE INDEX idx_nodes_type ON nodes(type);
CREATE INDEX idx_entity_data_type ON entity_data(entity_type);
```

### 7.2 Configuration

```typescript
import Database from 'better-sqlite3';

const db = new Database('dist/app.db');
db.pragma('journal_mode = WAL');     // Write-ahead log for concurrency
db.pragma('synchronous = NORMAL');   // Balance safety/speed
db.pragma('cache_size = -64000');    // 64MB cache — entire graph fits in memory
```

---

## 8. Client-Side Compilation

The compiler reads projection nodes and generates client-side JavaScript. No JS is hand-written by humans or AI.

### 8.1 Compilation Mapping

| Graph Construct | Generated JS |
|----------------|-------------|
| `state` block | `let` variables in module closure |
| `bind_value $state.x` | `addEventListener('input', ...)` + value setter |
| `derived x = ...` | Getter function, re-evaluates when deps change |
| `derived x = compute(module, ...)` | Direct function call wrapped in dependency tracking |
| `visible_when <cond>` | Toggle `data-gl-visible` attribute on state change |
| `enabled_when <cond>` | Toggle `data-gl-enabled` attribute on state change |
| `on_click set $state.x = y` | `addEventListener('click', ...)` with state mutation |
| `on_click append/remove` | Array manipulation + DOM re-render of `each` blocks |
| `submit_to behavior(x)` | `fetch('/api/behavior/x', ...)` with input collection |
| `debounce 200ms` | `setTimeout` wrapper around state update |
| `delay(150ms)` | `setTimeout` wrapper around handler |
| `each <list> as <item>` | Keyed DOM generation loop, re-runs when list changes |
| `match <expr>` | Switch that unmounts current branch, mounts new branch |
| `component(x)` | Mount component JS, pass typed props, wire event emitters |
| `derived q = query(...)` | `fetch` to query endpoint, cached, re-fetches when deps change |

### 8.2 Generated JS Is a Build Artifact

The generated JavaScript is never seen, edited, or maintained by anyone. It's a build artifact like a `.o` file from a C compiler. The source of truth is the projection node in the graph. The type checker validates the graph. The compiler emits correct JS from a valid graph.

### 8.3 Server-Side Initial Render + Client Hydration

The server renders initial HTML from the projection. Generated JS hydrates the page — attaching event listeners, initializing state, enabling reactivity. This gives fast initial page loads with rich interactivity.

---

## 9. Server Runtime

### 9.1 Architecture

```
HTTP Server (Hono)

  GET /<route>
    → Route Resolver (find matching projection)
    → Policy Evaluator (check auth + access)
    → Data Binder (query entity_data)
    → Projection Renderer (layout → HTML)
    → Attach generated JS refs
    → Response: HTML page

  POST /api/behavior/:id
    → Input validation (against behavior's declared input types)
    → Precondition evaluation (constraints → compute)
    → Compute steps
    → Require assertions
    → Mutations (SQLite atomic transaction)
    → Effects (async)
    → Response: JSON success/failure

  GET /api/query/:entity
    → Policy evaluation
    → Query entity_data with filters
    → Response: JSON

  GET /js/:projection.js → static file
  GET /css/:bundle.css → static file
```

### 9.2 Behavior Executor

```typescript
async function executeBehavior(
  graph: Graph, behaviorId: string, input: any, auth: AuthContext
): Promise<BehaviorResult> {
  const behavior = graph.getNode(behaviorId);

  // 1. Validate input types
  validateInput(behavior.properties.input, input);

  // 2. Build context
  const ctx = { input, auth, target: await resolveTarget(behavior, input, auth), computed: {} };

  // 3. Preconditions (short-circuit on failure)
  for (const pre of behavior.properties.preconditions || []) {
    const result = await evaluateConstraint(graph, pre, ctx);
    if (!result.passed) return { success: false, error: result.error };
  }

  // 4. Compute steps
  for (const step of behavior.properties.compute_steps || []) {
    const params = resolveParams(step.params, ctx);
    const computeModule = await import(`./compute/${step.module}`);
    ctx.computed[step.alias] = computeModule[step.function](...Object.values(params));
  }

  // 5. Require assertions
  for (const req of behavior.properties.requirements || []) {
    if (!resolveExpression(req.expression, ctx)) {
      return { success: false, error: req.error_message };
    }
  }

  // 6. Adapter calls (external I/O — BEFORE mutations, so failures don't leave orphaned data)
  for (const call of behavior.properties.adapter_calls || []) {
    const adapter = graph.getNode(call.adapter_id);
    const action = adapter.properties.actions.find((a: any) => a.name === call.action);
    const params = resolveParams(call.params, ctx);
    try {
      ctx.adapter_results[call.alias] = await executeAdapterAction(adapter, action, params);
    } catch (err) {
      return { success: false, error: `Adapter call failed: ${call.adapter_id}.${call.action}` };
    }
  }

  // 7. Require assertions on adapter results
  for (const req of behavior.properties.adapter_requirements || []) {
    if (!resolveExpression(req.expression, ctx)) {
      return { success: false, error: req.error_message };
    }
  }

  // 8. Mutations (atomic)
  db.transaction(() => {
    for (const m of behavior.properties.mutations || []) executeMutation(m, ctx, db);
  })();

  // 9. Effects (async, non-blocking)
  for (const e of behavior.properties.effects || []) {
    fireEffect(graph, e, ctx).catch(console.error);
  }

  // 10. Response
  return {
    success: true,
    message: behavior.properties.on_success?.message,
    navigate: behavior.properties.on_success?.navigate,
  };
}
```

---

## 10. Build Pipeline

### 10.1 CLI Commands

```bash
# Type-check only (fast inner loop for AI)
graphlang check ./app/
graphlang check ./app/ --format json

# Full build: parse → type-check → compile compute → generate JS → bundle CSS → write SQLite
graphlang build ./app/ --output ./dist/

# Dev server with file watching
graphlang dev ./app/ --port 3000

# Validate graph without building
graphlang validate ./app/

# Seed entity data
graphlang seed ./app/ --data ./seed.json
```

### 10.2 Build Steps

1. **Parse** all `.graph` files → in-memory AST
2. **Write to SQLite** → nodes and edges tables
3. **Type Check** → query SQLite, validate all contracts, report errors
4. **If errors → STOP.** Output all errors. Do not proceed.
5. **Run tests** → execute compute, type checker, and behavior test suites; report failures
6. **If test failures → STOP.** Output failures. Do not proceed.
7. **Compile compute modules** → TypeScript compiler on compute sources
8. **Compile Client JS** → projection compiler generates `.js` per projection (includes compute functions used client-side)
9. **Lint CSS** → PostCSS plugin validates `data-gl-*` selectors against graph (warnings only)
10. **Bundle CSS** → concatenate and minify CSS source files
11. **Copy runtime** → shared `graphlang-runtime.js`
12. **Report** → summary of nodes, edges, modules, generated files

### 10.3 Output Structure

```
dist/
├── app.db                          # SQLite: graph structure + entity data
├── js/                             # Generated client JS (includes compute fns)
│   ├── graphlang-runtime.js
│   ├── profile_edit.js
│   ├── storefront.js
│   └── order_detail.js
└── css/
    └── bundle.css                  # Bundled + minified CSS from source files
```

---

## 11. Prototype Implementation Plan

### Scope

The prototype tests the core thesis:

> Can AI modify a typed graph, get specific error feedback, self-correct, and produce a working application update — including across typed boundaries to components and external services?

**Minimum viable prototype:**
- Entities: User, Order, OrderItem, Product
- Projections: profile_edit (forms + validation), storefront (state + reactivity), order_detail (match expressions)
- Behaviors: update_email, update_password, place_order (with adapter call)
- Constraints: is_owner, email_is_valid, password_is_strong
- Policies: owner_access, public_read_products
- One component: chart (with typed record props — validates the component boundary)
- One adapter call: stripe_payments.create_charge (validates the adapter boundary)
- One render compute: markdown_to_html (validates the render boundary)

**The core success metric:** AI edit reliability. Measure how often AI-generated graph modifications pass the type checker on the first try, and how many iterations it takes to converge when they don't.

### Phase 1: Parser + SQLite + Type Checker (Weeks 1-2)

**Goal:** Parse `.graph` files into SQLite. Type-check everything. Produce excellent errors.

This is the most important phase. The type checker is the product.

1. TypeScript project setup
2. Lexer (tokenizer)
3. Recursive descent parser for all node types (including `match` in projections)
4. Write parsed graph to SQLite (nodes + edges tables)
5. **Type checker passes 1-10** (the bulk of the work):
   - Pass 1: Entity integrity
   - Pass 2: Edge integrity
   - Pass 3: Compute module signatures (including `render(...)` output types)
   - Pass 4: Constraint validation
   - Pass 5: Behavior type checking (including adapter calls)
   - Pass 6: Projection type checking (including match exhaustiveness, transition validation, class bindings, track_* helpers)
   - Pass 7: Policy completeness
   - Pass 8: Cross-cutting validation
   - Pass 9: Component validation (prop record types, event types)
   - Pass 10: Adapter validation (action contracts, param types)
6. Record subtyping implementation
7. Error output formatting (console + JSON)
8. CLI: `graphlang check`

**Test:** Write intentionally broken `.graph` files. Verify the type checker catches every error with specific, actionable messages. Feed the errors to Claude and verify it can fix them.

### Phase 2: Compute Modules + CSS Pipeline (Week 3)

**Goal:** Compute modules run on server and client. CSS pipeline with PostCSS lint.

1. Write example compute modules in TypeScript
2. Purity lint pass (no fs, no fetch, no DOM, no randomness)
3. Contract checker (verify TypeScript function signatures match graph declarations)
4. Client bundler includes compute functions used in projections
5. PostCSS lint plugin (validate `data-gl-*` selectors against graph)
6. CSS bundling (concatenate + minify source CSS files)
7. Base CSS theme with design tokens and data-attribute styles

**Test:** `validate_password_strength("Weak")` returns `{ valid: false, reason: "Must be at least 8 characters" }`. PostCSS lint catches a typo in a CSS selector referencing a graph node.

### Phase 3: Server Runtime + HTML Rendering (Week 4)

**Goal:** Serve working pages from projection nodes.

1. Hono server setup
2. Route resolver
3. Projection renderer (layout tree → HTML, including `match` branch selection)
4. Data binding resolver (query entity_data)
5. CSS bundling from source files
6. Page shell (HTML + CSS + data + JS refs)
7. Entity data seeder
8. Session/auth

**Test:** Navigate to `/orders/:id`, see the correct match branch rendered based on order status.

### Phase 4: Client-Side Compilation + Behaviors (Weeks 5-6)

**Goal:** Forms work. Client-side validation via compute functions. Behaviors execute. Match expressions swap branches.

1. Projection → JS compiler (including match → switch, transition CSS classes, class bindings, track_* helpers)
2. `graphlang-runtime.js` (reactivity, fetch, component lifecycle manager)
3. Client-side compute function loading (bundled into projection JS)
4. Behavior executor on server (including adapter call phase)
5. Constraint evaluator with compute modules
6. Mutation executor (SQLite)
7. `/api/behavior/:id` endpoint
8. Client → behavior → response flow
9. Policy enforcement
10. Component mounting (chart component with typed record props)
11. Adapter executor (HTTP adapter for Stripe — stub in dev, real in test)

**Test:** Type weak password → compute function validates in browser. Submit form → behavior fires → adapter called → entity updates. Match expression toggles between branches on state change with transitions. Chart component renders with typed data.

### Phase 5: AI Integration Test (Week 7)

**Goal:** Prove the thesis.

1. Create Claude prompt for generating `.graph` + TypeScript compute modules
2. Measure: "Add a name change feature to profile_edit"
   - AI generates graph modifications
   - Run `graphlang check`
   - Count errors, feed back to AI
   - Measure iterations to valid graph
   - Compare against same task in React
3. Measure: "Add a product review entity and page"
   - New entity, new projection with match expression, new behavior, new component
   - Same measurement methodology
4. Measure: "Add a refund flow that calls the Stripe adapter"
   - Tests adapter boundary type checking
   - AI must wire adapter call into behavior with correct param types
5. Document results

**Success criteria:** AI converges to a valid graph in ≤2 iterations with GraphLang, compared to baseline error rate with React.

---

## 12. Project Structure

```
graphlang/
├── package.json
├── tsconfig.json
├── src/
│   ├── cli/
│   │   └── index.ts                # CLI: check, build, dev, seed
│   ├── parser/
│   │   ├── lexer.ts                # Tokenizer
│   │   ├── parser.ts               # Recursive descent parser
│   │   ├── resolver.ts             # Reference resolution
│   │   └── ast.ts                  # AST node types
│   ├── graph/
│   │   ├── types.ts                # GraphNode, GraphEdge, Graph interfaces
│   │   ├── store.ts                # SQLite read/write
│   │   └── query.ts                # SQL query helpers for traversal
│   ├── typechecker/
│   │   ├── index.ts                # Orchestrate all passes
│   │   ├── type-map.ts             # Build the TypeMap from SQLite
│   │   ├── pass-entity.ts          # Pass 1: Entity integrity
│   │   ├── pass-edge.ts            # Pass 2: Edge integrity
│   │   ├── pass-compute.ts         # Pass 3: Compute signatures
│   │   ├── pass-constraint.ts      # Pass 4: Constraint validation
│   │   ├── pass-behavior.ts        # Pass 5: Behavior type checking
│   │   ├── pass-projection.ts      # Pass 6: Projection type checking
│   │   ├── pass-policy.ts          # Pass 7: Policy completeness
│   │   ├── pass-crosscut.ts        # Pass 8: Cross-cutting validation
│   │   ├── pass-component.ts      # Pass 9: Component validation
│   │   ├── pass-adapter.ts         # Pass 10: Adapter validation
│   │   ├── errors.ts               # TypeCheckError type + formatting
│   │   └── suggestions.ts          # "Did you mean?" fuzzy matching
│   ├── compute/
│   │   ├── loader.ts               # Import and call compute functions
│   │   ├── lint.ts                 # Validate purity rules (no fs, no fetch, etc.)
│   │   └── contract-check.ts       # Verify TS signatures match graph declarations
│   ├── runtime/
│   │   ├── server.ts               # Hono HTTP server
│   │   ├── router.ts               # Route resolver
│   │   ├── renderer.ts             # Projection → HTML
│   │   ├── component-loader.ts     # Mount/update/unmount component lifecycle
│   │   ├── adapter-executor.ts     # Execute typed adapter actions (HTTP, SMTP, etc.)
│   │   ├── behavior.ts             # Behavior executor
│   │   ├── constraint.ts           # Constraint evaluator
│   │   ├── policy.ts               # Policy enforcer
│   │   ├── events.ts               # Event dispatch
│   │   ├── auth.ts                 # Session/auth
│   │   └── query-api.ts            # /api/query endpoint
│   ├── compiler/
│   │   ├── client-js.ts            # Projection → client JS
│   │   ├── dependency-graph.ts     # State dependency analysis
│   │   └── codegen.ts              # JS code generation
│   └── css/
│       ├── postcss-lint.ts         # PostCSS plugin: validate data-gl-* selectors
│       └── bundler.ts              # Concatenate + minify CSS source files
├── examples/
│   └── ecommerce/
│       ├── entities.graph
│       ├── behaviors.graph
│       ├── projections.graph
│       ├── policies.graph
│       ├── constraints.graph
│       ├── compute.graph
│       ├── adapters.graph          # Typed adapter declarations
│       ├── components.graph        # Component declarations
│       ├── styles/                 # CSS source files
│       │   ├── theme.css            # Design tokens, base styles
│       │   ├── layout.css           # Page, grid, card styles
│       │   ├── forms.css            # Field, action, form styles
│       │   └── transitions.css      # Enter/exit/match animations
│       ├── compute/                # TypeScript compute modules
│       │   ├── hash_password.ts
│       │   ├── verify_password.ts
│       │   ├── calculate_order_total.ts
│       │   ├── calculate_discount.ts
│       │   ├── validate_password_strength.ts
│       │   ├── format_currency.ts
│       │   ├── sales_sparkline.ts    # Render compute (returns SVG markup)
│       │   └── markdown_to_html.ts   # Render compute (returns HTML)
│       ├── components/             # Component JS implementations
│       │   ├── chart.js
│       │   ├── drag_drop_list.js
│       │   ├── rich_text_editor.js
│       │   └── data_table.js
└── tests/
    ├── typechecker/
    │   ├── pass-entity.test.ts
    │   ├── pass-behavior.test.ts
    │   ├── pass-projection.test.ts
    │   ├── pass-component.test.ts
    │   ├── pass-adapter.test.ts
    │   ├── error-messages.test.ts   # Verify error quality
    │   └── fixtures/
    │       ├── valid/               # Should pass
    │       └── invalid/             # Should fail with specific errors
    ├── parser/
    │   ├── lexer.test.ts
    │   ├── parser.test.ts
    │   └── fixtures/
    ├── compute/
    │   └── modules.test.ts
    ├── runtime/
    │   ├── renderer.test.ts
    │   ├── behavior.test.ts
    │   ├── adapter.test.ts
    │   └── constraint.test.ts
    └── integration/
        └── ecommerce.test.ts
```

---

## 13. Dependencies

```json
{
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "hono": "^4.0.0",
    "@hono/node-server": "^1.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "tsx": "^4.0.0",
    "vitest": "^1.0.0",
    "postcss": "^8.4.0",
    "@types/better-sqlite3": "^7.6.0"
  }
}
```

---

## 14. Success Criteria

### Type System (Primary)
1. Type checker catches renamed fields, mismatched params, wrong types, missing required fields, invalid traversals — all with specific error messages
2. Error messages include: what's wrong, where, what was expected, what was received, and a fix suggestion
3. AI (Claude) can read error output and fix the graph in ≤2 iterations
4. JSON error output is parseable by AI tooling

### Testing (Primary)
5. Every compute module has tests; full compute test suite completes in under 100ms
6. Type checker tests cover all 10 passes with both valid and invalid fixture graphs
7. Behavior tests cover the happy path and key failure cases without network or disk I/O
8. `graphlang check` (type check + test run) completes in under 3 seconds on the prototype application
9. Watch mode delivers feedback in under 1 second for targeted single-file changes

### Runtime (Secondary)
10. Server renders working HTML from projection nodes
11. Client JS is generated from projections — no hand-written JS
12. Compute modules run identically on server and client (same TypeScript, same runtime)
13. Behaviors execute: preconditions → compute → adapters → mutations → effects
14. Policies enforce access control
15. Components render within projections with typed prop/event bindings validated by the type checker
16. Adapter calls in behaviors execute with typed contracts and proper error handling
17. Render compute modules inject format-typed, sanitized markup into projections

### Thesis Validation (Ultimate)
18. AI-modified graphs with type checking have a measurably lower error rate than AI-modified React code for equivalent changes

---

## 15. Open Questions

1. **Each block re-rendering.** Prototype uses innerHTML replacement when list data changes. Keyed DOM diffing with enter/exit/move detection is a future optimization.
2. **Client-side query caching.** When derived values use `query()`, need loading states and cache invalidation. Prototype: fetch on mount, refetch when deps change, no cache.
3. **Hot reloading.** `graphlang dev` should watch files. Incremental type checking (only re-check changed files + dependents) for speed. Prototype: manual rebuild.
4. **Migration.** When entity fields change, how to migrate entity_data rows. Prototype: wipe and re-seed.
5. **Adapter error recovery.** If an adapter call succeeds (e.g., Stripe charges the card) but a subsequent mutation fails, how to compensate. Saga/compensation patterns needed for production. Prototype: log and accept inconsistency.
6. **Adapter timeout/retry.** External services fail. Prototype: single attempt, 10-second timeout, fail on error. Production needs retry policies and circuit breakers.
7. **Component lifecycle integration.** Define exactly when mount/update/unmount fire and how they interact with the generated JS reactivity system. Mount: when element inserted into DOM. Update: when any bound prop changes. Unmount: when element removed (navigation, match branch swap, `visible_when` becomes false).
8. **Component sandboxing.** Components have full DOM access within their element. Consider Shadow DOM isolation for production. Prototype: trust the component.
9. **Render sanitization rules.** `render(svg)` and `render(html_safe)` need allowlists. Prototype: DOMPurify with preset configs per format type.
10. **Component prop reactivity.** When a bound prop changes, the component needs an update call. Prototype: dirty check (compare current props to last props, call update if different).
11. **Typed adapter implementation.** Runtime needs protocol-specific executors. Prototype: only `type http` (generic fetch wrapper). SMTP, WebSocket, etc. are future.
12. **Record type versioning.** When a record type in a component prop changes shape, should the type checker suggest fixes across the graph? Nice to have, not essential — the errors alone are sufficient.
13. **Match branch DOM cleanup.** Outgoing match branches may contain components that need unmounting and event listeners that need removal. Answered by #7 — unmount fires on branch exit. The compiler generates cleanup code per branch.
14. **Server-side match rendering.** When match depends on server data and a behavior changes that data, how does the client update? Prototype: behavior response includes a redirect, page reloads with the correct branch rendered server-side.
15. **Compute contract verification.** Build step verifies TypeScript function signatures match graph declarations by parsing the TS AST. How strict? Prototype: exact param name and type match.

---

## 16. Future Directions

- **Test DSL** — declare behavior tests directly in `.graph` files with typed fixtures; the type checker validates fixture shapes, the test runner executes them; AI generates tests in the same language as the application
- **Visual graph editor** — drag-and-drop with live type checking
- **AI copilot** — natural language → graph modifications with type checker in the loop
- **Graph diffing** — semantic diffs: "added entity Review with 4 fields"
- **Compute module sandboxing** — V8 isolates for stronger purity guarantees beyond lint rules
- **Ahead-of-time compilation** — projections → optimized React/Svelte
- **Multi-tenant** — graph-level isolation
- **Compute in other languages** — optional Wasm target for performance-critical compute modules (Rust, Go)
- **Import from existing codebases** — analyze and generate equivalent `.graph`
- **Component registry** — community-published components with typed contracts (npm-like ecosystem for GraphLang UI primitives)
- **Adapter library** — pre-built typed adapter definitions for common services (Stripe, Twilio, SendGrid, AWS S3, Google Maps, etc.)
- **Adapter codegen** — generate typed adapter declarations from OpenAPI/Swagger specs automatically
- **Render compute library** — pre-built TypeScript modules for common rendering (markdown, syntax highlighting, SVG charts, QR codes)
- **Cross-graph composition** — import entities, components, and adapters from other GraphLang projects as typed dependencies
- **Record type inference** — when a behavior creates an object literal, infer the record type and validate downstream usage without requiring explicit type annotation
- **Generic record types** — parameterized record types for components that work with any data shape: `component data_table<T extends record({ id: uuid })>` where T is the row type
- **Entity-to-record coercion** — automatic structural compatibility checking when passing entity data where a record type is expected, eliminating manual mapping
