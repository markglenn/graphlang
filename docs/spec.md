# GraphLang: An AI-Native Application Framework

## Prototype Implementation Specification v0.7

**Version:** 0.7

**Author:** Mark Glenn

**Purpose:** Build a working prototype of an AI-native application framework. The core thesis: applications defined as typed graphs are more reliably authored and modified by AI than traditional codebases. The key differentiator is a graph that externalizes application architecture — every relationship, dependency, and data flow — into an explicit, queryable structure. A comprehensive type system enforces correctness across the graph's edges, catching errors at build time with feedback specific enough for AI to self-correct. The framework handles extensibility — custom UI components, third-party integrations, complex rendering — through typed boundaries: the graph owns the wiring, opaque implementations live behind typed contracts, and the type checker validates every connection point.

---

## 1. Vision & Core Thesis

Today's AI writes code designed for humans to read and maintain (React, Python, etc.). This is wasteful — the AI is constrained by human-ergonomic syntax, and the output is fragile because imperative code has implicit relationships that AI can't reliably track.

GraphLang splits application development into two layers:

1. **The Graph Layer** — a declarative graph of typed nodes and edges that defines the application's structure: entities, relationships, UI projections, behaviors, policies, events. The graph handles _what connects to what_ — the architectural wiring that AI struggles with in traditional codebases because it's implicit and scattered.

2. **The Compute Layer** — small, pure TypeScript functions that handle actual computation: math, string processing, data transformation, validation logic. These are bounded, testable, side-effect-free functions that AI writes reliably.

The graph is NOT Turing complete on its own, and that's by design. Forcing arbitrary computation into graph form (dataflow nodes for basic arithmetic) defeats the purpose. The graph excels at structure and flow. Pure functions excel at computation. Each does what it's best at.

### The Graph Is the Innovation

The graph is the real innovation. By externalizing application architecture into explicit, typed edges, the graph makes every relationship visible, queryable, and checkable. The type system is the powerful consequence — it's what the graph's explicitness _enables_.

In a traditional codebase, architecture is implicit. A form submission connects to an API endpoint that validates against a database schema, but those connections cross file boundaries, cross language boundaries (frontend JS → HTTP → backend JS → SQL), and are invisible to any single tool. No type checker can verify them because no tool can even _see_ them.

In a GraphLang graph, **every connection is a typed edge**. Every edge has types on both ends. The entire application — from UI field to behavior input to constraint parameter to entity mutation to compute module call — is one unified type-checked structure. A renamed field, a mismatched parameter, a wrong type on a binding — all caught at build time, all reported with specific, actionable errors.

This is what makes the graph AI-friendly. Not the syntax. Not the declarative style. The fact that architecture is explicit and enumerable — the AI can query what depends on what — and the type system gives immediate, precise feedback when something doesn't fit.

**The AI emits graph definitions + small pure functions. It queries the graph to understand context. The type checker tells it exactly what's wrong. The compiler/runtime produces the application.**

### The Graph as Architecture

Traditional codebases have implicit architecture scattered across files, languages, and conventions. A React app's architecture lives in import graphs, route definitions, state management wiring, API call sites, database queries, and component hierarchies — none of which are queryable as a unified structure. Understanding "what happens when a user clicks Submit on the order form" requires reading across dozens of files in multiple languages.

GraphLang centralizes this. Every node type captures one architectural concept:

- **entity** — data schemas
- **edge** — relationships between entities
- **behavior** — business logic sequences (event → preconditions → compute → adapters → mutate → effects)
- **projection** — UI structure, data bindings, state, layout
- **compute** — typed signatures for pure functions
- **constraint** — reusable conditions
- **policy** — access control rules
- **component** — custom UI with typed contracts
- **adapter** — external service contracts
- **listener** — event-triggered behaviors

The graph is stored in SQLite, which means every architectural question is a SQL query. "Which behaviors mutate User?" is a join on the edges table. "What's the full path from the checkout UI to the Stripe adapter?" is a recursive CTE. "What breaks if I rename Order.status?" is a dependency traversal.

This is what makes AI modification reliable. In a traditional codebase, the AI has to _infer_ architecture by reading source files — a lossy, error-prone process. In GraphLang, dependencies are enumerable, blast radius is knowable, and the AI can query the graph before making changes to understand exactly what it's affecting.

### The AI Interaction Model

AI interacts with a GraphLang project through a three-part cycle: **Write**, **Query**, and **Validate**.

**Write.** The AI generates `.gln` files (graph declarations) and TypeScript implementations in `impl/`. The graph defines structure and flow; the TypeScript defines computation. `graphlang sync` keeps the boundary between them aligned — generating type contracts, creating stubs, and rewriting signatures when the graph changes.

**Query.** The AI uses CLI commands to understand the graph before modifying it:
- `graphlang show <node>` — full node with edges and resolved types
- `graphlang deps <node>` — what this node depends on
- `graphlang impact <node>` — what depends on this node (blast radius)
- `graphlang trace <projection> <entity>` — full path from UI to data

These commands read from SQLite and return structured output. The AI doesn't need to parse source files to understand architecture — it queries the graph directly.

**Validate.** Two checkers run in tandem:
1. `graphlang check` — validates the graph: type contracts across edges, entity integrity, behavior sequencing, projection bindings, policy coverage. Graph errors mean fixing `.gln` files.
2. `tsc --noEmit` — validates implementations: function bodies match generated type contracts in `.graphlang/gen/contracts.gen.ts`. TypeScript errors mean fixing `.ts` files.

The division is clean: the graph checker owns structural correctness; `tsc` owns implementation correctness. No custom contract checking is needed — the generated types in `contracts.gen.ts` are the contract, and TypeScript's own compiler enforces them.

### Typed Boundaries, Not Closed Vocabularies

The graph does not try to express everything. It expresses every _boundary_ with types.

The built-in projection primitives (`section`, `card`, `grid`, `field`, `action`) cover common UI patterns. But real applications need charts, drag-and-drop, rich text editors, custom visualizations, and third-party integrations. Rather than expanding the primitive set forever, GraphLang handles extensibility through **typed boundaries**:

- **Components** let projections embed custom UI with typed prop and event contracts. The graph declares what data flows in and what events flow out. The implementation (JS with mount/update/unmount) is opaque. Used for everything from charts to drag-and-drop to rich text editors.
- **Render compute modules** return typed markup fragments (`render(svg)`, `render(html_safe)`), allowing computed visualizations to be injected into projections with format-typed sanitization.
- **Typed adapters** define action contracts for external services (Stripe, SendGrid, etc.) with typed inputs and outputs, so behaviors can call them with full type checking.

The unifying principle: **the graph excels at composing and wiring things, not at defining their internals.** Boundaries are typed and checkable. Implementations behind those boundaries are opaque. The type checker validates every connection point.

### Tracked Impurity, Not Hidden Impurity

The graph's type system provides strong guarantees — but four constructs weaken those guarantees by introducing opaque or unverified behavior. Like Rust's `unsafe` or Haskell's `IO`, GraphLang doesn't pretend these don't exist. Instead, it **tracks them explicitly** so developers and AI can see exactly where the guarantees thin out.

The four impurity sources:

1. **Adapter calls.** External I/O (Stripe, SendGrid, databases). The type system checks that you pass the right inputs and declare the right outputs, but it can't verify that the external service actually returns what the adapter declares. The response shape is a _promise_, not a _proof_.
2. **Components.** Opaque DOM manipulation behind a typed prop/event boundary. The type system checks the wiring (props in, events out), but the component's internal behavior — what it renders, what side effects it triggers — is invisible to the graph.
3. **`render(raw)`.** Unsanitized markup injection. The type system tracks that a compute module returns `render(raw)` instead of `render(html_safe)` or `render(svg)`, but it can't verify the markup is safe. This is the XSS escape hatch.
4. **`json` type.** A type-system hole. Any field, parameter, or output typed as `json` bypasses structural checking. The type checker can't verify field access, shape compatibility, or subtyping on `json` values.

**Impurity is inferred, not annotated.** The type checker detects impurity automatically by analyzing the graph — behaviors that call adapters are impure, projections that use components or `render(raw)` are impure. There's no `@impure` annotation in the DSL that could drift out of sync. The graph _is_ the source of truth.

**Impurity propagates.** A behavior that calls an adapter is impure. A listener that triggers an impure behavior is transitively impure. A projection whose action submits to an impure behavior is impure. The type checker traces these chains and marks every node that inherits impurity from its dependencies.

**The impurity audit.** After all 10 type checking passes, the type checker produces an **impurity audit summary** — a structured report showing exactly how many behaviors, projections, and listeners are pure vs. impure, where each impurity originates, how it propagates, and how many `json` type holes exist. The audit prints on every build (passing or failing) so impurity is always visible, never hidden.

The goal isn't to eliminate impurity — adapters and components are essential. The goal is to **minimize it, contain it, and make it visible**. A well-structured GraphLang application should have a high pure coverage percentage, with impurity concentrated in a small number of adapter-calling behaviors and component-using projections.

### Testability by Design

The type checker catches structural errors. Tests catch behavioral errors. Together they form the complete feedback loop that makes AI-assisted development reliable. Neither is optional.

GraphLang's design makes testability natural at every layer:

- **Compute modules are pure functions.** No side effects, no external state, no I/O. Call them with inputs, assert the outputs. Tests require zero setup and zero teardown. A project with 50 compute modules should have all compute tests complete in under 100ms.
- **Behaviors are declarative sequences of typed steps.** Each phase — preconditions, compute, adapter calls, mutations — operates against a known state. Behaviors can be tested against an in-memory graph without a running server, without network calls, and without filesystem access.
- **The graph is a query target.** SQLite in-memory is the test substrate. No disk, no network. The type checker's own tests use fixture graph definitions parsed into `:memory:` databases. Behavior tests use seeded entity data in the same substrate. Both are fast by construction.

The feedback loop target: **under 1 second after every save**, with a ceiling of **3 seconds on large projects**. This is a first-class design constraint, not a performance optimization to address later. Architecture decisions — synchronous SQLite access, pure compute functions, in-memory test isolation, incremental type checking — are all made with this target in mind.

### What This Prototype Should Prove

1. The graph externalizes application architecture in a form AI can query — every dependency, every data flow, every connection is a SQL query away
2. CLI query commands (`show`, `deps`, `impact`, `trace`) give AI a structured read interface to the full architecture without parsing source files
3. The type system catches cross-boundary errors that traditional tooling misses
4. Error feedback is specific enough that AI can self-correct in 1-2 iterations
5. AI-modified graphs are more reliably correct than AI-modified React code
6. An application's architecture can be fully defined as a typed graph, and the full architecture is navigable through graph queries
7. Compute modules run identically on server and client (same TypeScript, same runtime)
8. A compiler can generate client-side JavaScript from projection nodes
9. Changes to the graph are surgical — modify one node, rebuild, the app updates
10. The type check + test feedback loop completes in under 3 seconds on the prototype application

---

## 2. Architecture Overview

The graph is the hub. Every tool in the pipeline — the parser, type checker, code generator, compiler, runtime, and CLI query commands — reads from the same SQLite graph store. Source `.gln` files are parsed into the graph; the graph is what gets checked, queried, and compiled. The type checker doesn't operate on source files — it operates on the graph. The CLI query commands don't parse code — they query the graph. This is the architectural payoff of externalizing structure: one representation, many readers.

```
┌──────────────────────────────────────────────────────────────┐
│                     Source Files                             │
│                                                              │
│  .gln files      .ts files       .css files    .ts files     │
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
┌─────────────────────────────────────────────────────────────┐
│                    Build / Bundle Step                      │
│                                                             │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Server Bundle    │  │ Client JS    │  │ CSS Bundle    │  │
│  │ (runtime +       │  │ (from projs  │  │ (PostCSS lint │  │
│  │  compute fns)    │  │  + compute)  │  │  + bundle)    │  │
│  └──────────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Boundaries

| Concern                                | Handled By                                   | Why                                                            |
| -------------------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| Entities, relationships                | Graph nodes + edges                          | Structural — what connects to what                             |
| UI structure & layout                  | Projection nodes in graph                    | Declarative — what to show, not how                            |
| Client-side interactivity              | Compiled from graph → JS                     | Reactive bindings, state, events derived from projections      |
| Custom UI (charts, drag-drop, editors) | Components with typed props/events           | Opaque JS behind typed boundary, mount/update/unmount contract |
| Dynamic markup                         | Render compute modules (TS → sanitized HTML) | Sparklines, markdown, SVG computed in TypeScript, format-typed |
| Business logic flow                    | Behavior nodes in graph                      | Event → precondition → compute → adapter → mutation → effect   |
| Access control                         | Policy + constraint nodes                    | Declarative rules attached via edges                           |
| Computation                            | Pure TypeScript functions                    | Same code on server and client, AI writes it reliably          |
| External services                      | Typed adapters with action contracts         | Stripe, email, analytics — typed I/O, opaque implementation    |
| Styling                                | CSS source files                             | Full CSS power, PostCSS lint validates graph references        |

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

**The type checker operates on the graph, not on source files.** Build the graph store first (Section 7), then the type checker. The graph must be populated in SQLite before any type checking pass can run — every pass is a SQL query over nodes and edges. The type system is what makes the graph useful for AI: it turns the graph's explicit structure into enforceable contracts with precise error feedback.

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
  entities: Map<
    string,
    {
      fields: Map<string, FieldType>;
      edges: Map<string, { target: string; cardinality: string }>;
    }
  >;

  // Compute module signatures
  computes: Map<
    string,
    {
      inputs: Map<string, ResolvedType>;
      outputs: Map<string, ResolvedType>;
    }
  >;

  // Constraint parameter types
  constraints: Map<
    string,
    {
      params: Map<string, ResolvedType>;
      traversals: TraversalPath[]; // validated against entity edges
    }
  >;

  // Behavior context types (what's available at each point in execution)
  behaviors: Map<
    string,
    {
      inputs: Map<string, ResolvedType>;
      target_entity: string | null;
      compute_results: Map<string, ResolvedType>; // accumulated as compute steps execute
      available_at_mutate: Map<string, ResolvedType>; // everything available when mutations run
      impurity: ImpurityInfo; // inferred by Pass 5 + Pass 8
    }
  >;

  // Projection binding types
  projections: Map<
    string,
    {
      data_bindings: Map<string, ResolvedType>;
      state: Map<string, ResolvedType>;
      derived: Map<string, ResolvedType>;
      forms: Map<
        string,
        {
          fields: Map<string, ResolvedType>;
          target_entity: string | null;
        }
      >;
      impurity: ImpurityInfo; // inferred by Pass 8
    }
  >;

  // Enum (tagged union) definitions
  enums: Map<
    string,
    {
      variants: Map<
        string,
        {
          fields: Map<string, ResolvedType>; // empty for fieldless variants
        }
      >;
    }
  >;

  // Listener impurity tracking (inferred by Pass 8)
  listeners: Map<
    string,
    {
      event: string;
      triggers_behavior: string;
      impurity: ImpurityInfo;
    }
  >;

  // json type usage tracking (collected by Pass 8)
  json_usages: JsonUsage[];
}

interface ResolvedType {
  base:
    | "string"
    | "integer"
    | "decimal"
    | "boolean"
    | "uuid"
    | "timestamp"
    | "enum"
    | "tagged_enum"
    | "text"
    | "json"
    | "list"
    | "record"
    | "entity_ref"
    | "render";
  format?: string; // 'email', 'url', 'phone'
  enum_values?: string[];
  list_item_type?: ResolvedType;
  record_fields?: Map<string, ResolvedType>; // for record({...}) types
  entity_ref_type?: string; // which entity
  tagged_enum_name?: string; // e.g., 'Shape' — which declared enum
  tagged_enum_variant?: string; // when narrowed by match or require...is...as
  render_format?: "svg" | "html_safe" | "raw"; // for render(...) output types
  nullable: boolean;
  constraints: string[]; // 'unique', 'required', 'generated', 'sensitive', 'immutable'
  min?: number;
  max?: number;
}

// Impurity source — why a node is impure
type ImpuritySource =
  | {
      kind: "adapter_call";
      adapter_id: string;
      action: string;
      behavior_id: string;
    }
  | { kind: "component"; component_id: string; projection_id: string }
  | { kind: "render_raw"; compute_module: string; projection_id: string }
  | { kind: "json_type"; node_id: string; field_or_param: string }
  | { kind: "propagated"; from_node: string; chain: string[] };

// Impurity metadata attached to behaviors, projections, and listeners
interface ImpurityInfo {
  is_pure: boolean;
  sources: ImpuritySource[]; // empty when is_pure === true
}

// Tracks every usage of the `json` type across the graph
interface JsonUsage {
  node_id: string;
  node_type: "entity" | "compute" | "behavior" | "adapter" | "component";
  field_or_param: string;
  justification: string; // from @justification annotation — required, enforced by Pass 1
  source_file: string;
  source_line: number;
  suggestion: string; // e.g., "Consider record({ status: string, data: string }) if shape is known"
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
ERROR [record-subtype-missing-field] projections.gln:45
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

Each pass is fundamentally a graph traversal. The type checker follows edges from source nodes to target nodes and checks that the types at both endpoints are compatible. Pass 2 follows entity→entity edges and checks cardinality. Pass 5 follows behavior→compute and behavior→entity edges and checks that inputs, outputs, and mutations align. Pass 6 follows projection→behavior edges and checks that form submissions match behavior inputs. The SQL queries _are_ the traversals — joins on the edges table with type checks on the endpoint nodes' properties.

#### Pass 1: Entity & Enum Integrity

Verify all entity and enum definitions are self-consistent.

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
- Every `json`-typed field, parameter, or output must have a `@justification("reason")` annotation explaining why a typed alternative isn't used. Missing justification is error code `json-missing-justification`.

Errors:

```
ERROR [entity-duplicate-field] entities.gln:5
  Entity 'User' has duplicate field 'email' (lines 5 and 8).
  Remove one of the duplicate field definitions.

ERROR [entity-invalid-annotation] entities.gln:7
  Entity 'User', field 'name': @min(1) is not valid on type 'boolean'.
  @min is only valid on types: string, integer, decimal.

ERROR [json-missing-justification] entities.gln:12
  Entity 'Event', field 'metadata': type 'json' requires @justification annotation.
  Add @justification("reason") explaining why a typed alternative (record, enum) isn't used.
  Example: field metadata : json @justification("Event properties vary per event type — no fixed schema")
```

**Enum integrity checks:**

Enums (tagged unions) share the same top-level namespace as entities. They are stored as `type = 'enum'` in the `nodes` table.

```sql
-- Find duplicate enum names or conflicts with entity names
SELECT n1.id, n1.type, n2.id, n2.type
FROM nodes n1
JOIN nodes n2 ON n1.id = n2.id AND n1.rowid < n2.rowid
WHERE n1.type IN ('entity', 'enum') AND n2.type IN ('entity', 'enum');

-- Find duplicate variant names within an enum
SELECT n.id, json_extract(v.value, '$.name') as variant_name, COUNT(*) as count
FROM nodes n, json_each(n.properties, '$.variants') v
WHERE n.type = 'enum'
GROUP BY n.id, variant_name
HAVING count > 1;
```

Checks:

- No duplicate enum names
- No conflicts between enum and entity names (shared namespace)
- At least two variants per enum
- No duplicate variant names within an enum
- No duplicate field names within a variant
- Variant field types are valid (same rules as entity fields)
- Variant fields can reference other enums and entities

Errors:

```
ERROR [enum-name-conflict] entities.gln:40
  Enum 'Order' conflicts with entity 'Order' (entities.gln:12).
  Enums and entities share the same namespace. Choose a different name.

ERROR [enum-no-variants] entities.gln:45
  Enum 'Status' has only one variant 'Active'.
  Enums require at least two variants.

ERROR [enum-duplicate-variant] entities.gln:50
  Enum 'Shape' has duplicate variant 'Circle' (lines 51 and 58).
  Remove one of the duplicate variant definitions.

ERROR [enum-variant-duplicate-field] entities.gln:52
  Enum 'Shape', variant 'Circle' has duplicate field 'radius' (lines 52 and 53).
  Remove one of the duplicate field definitions.

ERROR [enum-variant-invalid-type] entities.gln:55
  Enum 'Shape', variant 'Rectangle', field 'width': type 'float' is not valid.
  Valid types: string, integer, decimal, boolean, uuid, timestamp, list(T), json,
  record({...}), <EntityName>, <EnumName>
  Did you mean 'decimal'?
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
ERROR [edge-missing-entity] entities.gln:42
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
- When an input or output type name matches a declared enum, it resolves as `tagged_enum` with `tagged_enum_name` set to the enum name

Errors:

```
ERROR [compute-invalid-type] compute.gln:12
  Compute module 'calculate_discount', input 'subtotal': type 'float' is not valid.
  Valid types: string, integer, decimal, boolean, uuid, timestamp, list(T), json,
  <EnumName>
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
ERROR [constraint-invalid-traversal] constraints.gln:8
  Constraint 'is_owner', traversal 'target_entity -> user -> id':
  Cannot traverse 'user' from entity 'Product'.
  Product has no 'user' edge.
  Available edges from Product: (none — Product has no outgoing belongs_to edges)

  This constraint is used by:
    • policy 'owner_access' (policies.gln:3)
    • behavior 'update_email' precondition (behaviors.gln:7)

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
- `require <expr> is <EnumName>.<Variant> as <binding>` validates that the expression is a tagged enum type, the variant exists on that enum, and the binding receives the variant's fields with correct types

**Mutation validation:**

- Target entity exists
- Target field exists on that entity
- Field is not `@generated` (can't mutate generated fields)
- Field is not `@immutable` (can't mutate immutable fields after creation)
- Assigned value type matches the field type
- `create()` calls include all `@required` fields that aren't `@generated`
- `decrement()` targets numeric fields
- When assigning a tagged enum value via `EnumName.Variant(field: value, ...)`:
  - The enum and variant exist
  - All variant fields are provided (no missing fields)
  - No extra fields beyond what the variant declares
  - Field value types match the variant's declared field types
  - Fieldless variants use `EnumName.Variant` without parentheses

**Effect validation:**

- `emit()` event names are valid identifiers
- `notify()` channel is valid
- Referenced templates exist (warning level, not error)

**on_success / on_failure validation:**

- `show_message()` and `navigate()` are valid response types
- `navigate()` path is a valid route or expression

Errors:

```
ERROR [behavior-compute-param-mismatch] behaviors.gln:18
  Behavior 'update_password', compute step 'verify_result':
  Calling compute module 'verify_password' with param 'plain_text',
  but module expects 'plaintext'.

  Module signature (compute.gln:8):
    input plaintext : string
    input hash : string

  Did you mean 'plaintext'?

ERROR [behavior-mutate-type-mismatch] behaviors.gln:24
  Behavior 'update_password', mutation '$target_user.password_hash = hash_result.hashed':
  Field 'User.password_hash' expects type 'string'.
  'hash_result.hashed' resolves to type 'string'.
  ✓ Types match.

  BUT: 'hash_result' comes from compute module 'hash_password',
  which declares output 'hash' not 'hashed'.

  Available outputs from hash_password: hash (string)
  Did you mean 'hash_result.hash'?

ERROR [behavior-mutate-generated] behaviors.gln:30
  Behavior 'place_order', mutation '$new_order.id = ...':
  Field 'Order.id' is @generated and cannot be explicitly set.
  Remove this mutation — the runtime generates the id automatically.

ERROR [behavior-missing-required] behaviors.gln:32
  Behavior 'place_order', create(Order):
  Missing required field 'total'.
  Order requires: status (has default), total (MISSING), user (provided)

ERROR [behavior-mutate-invalid-variant] behaviors.gln:36
  Behavior 'ship_order', mutation '$target_order.status = OrderStatus.InTransit(...)':
  Enum 'OrderStatus' has no variant 'InTransit'.
  Available variants: Pending, Confirmed, Shipped, Delivered, Cancelled
  Did you mean 'Shipped'?

ERROR [behavior-mutate-variant-missing-field] behaviors.gln:38
  Behavior 'ship_order', mutation '$target_order.status = OrderStatus.Shipped(...)':
  Variant 'Shipped' requires field 'tracking_number' (string).
  Provided fields: carrier
  Missing fields: tracking_number

ERROR [behavior-mutate-variant-field-mismatch] behaviors.gln:40
  Behavior 'ship_order', mutation '$target_order.status = OrderStatus.Shipped(...)':
  Variant 'Shipped', field 'tracking_number' expects type 'string',
  received type 'integer'.

ERROR [behavior-require-variant-mismatch] behaviors.gln:44
  Behavior 'process_payment', require 'payment_step.result is PaymentResult.Approved':
  Enum 'PaymentResult' has no variant 'Approved'.
  Available variants: Succeeded, Declined, RequiresAction
  Did you mean 'Succeeded'?
```

**Impurity inference:**

After all structural checks pass, Pass 5 infers impurity metadata for each behavior. This is not an error — it produces `ImpurityInfo` for Pass 8 and the post-pass audit.

```sql
-- Find behaviors that call adapters (directly impure)
SELECT b.id, json_extract(ac.value, '$.adapter') as adapter_id,
       json_extract(ac.value, '$.action') as action_name
FROM nodes b, json_each(b.properties, '$.adapter_calls') ac
WHERE b.type = 'behavior';

-- Find behaviors that use render(raw) compute modules
SELECT b.id, json_extract(cs.value, '$.module') as module_id
FROM nodes b, json_each(b.properties, '$.compute_steps') cs
JOIN nodes c ON c.id = json_extract(cs.value, '$.module')
WHERE b.type = 'behavior'
AND c.type = 'compute'
AND json_extract(c.properties, '$.output_type') = 'render'
AND json_extract(c.properties, '$.render_format') = 'raw';

-- Find json-typed params flowing through behavior compute steps
SELECT b.id as behavior_id,
       json_extract(inp.value, '$.name') as param_name,
       json_extract(inp.value, '$.type') as param_type
FROM nodes b, json_each(b.properties, '$.input') inp
WHERE b.type = 'behavior'
AND json_extract(inp.value, '$.type') = 'json';
```

Inference rules:

- Behavior has adapter calls → `ImpurityInfo.is_pure = false`, source: `{ kind: 'adapter_call', ... }`
- Behavior uses a compute module with `render(raw)` output → `ImpurityInfo.is_pure = false`, source: `{ kind: 'render_raw', ... }`
- Behavior accepts `json`-typed inputs → source: `{ kind: 'json_type', ... }` (tracked but does not alone make a behavior impure — `json` is a type-system hole, not a side-effect source)
- Behavior with no adapter calls and no `render(raw)` usage → `ImpurityInfo.is_pure = true`, sources: `[]`

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
ERROR [projection-send-mismatch] projections.gln:28
  Projection 'profile_edit', action 'update_email_btn':
  Sends 'email' to behavior 'update_email',
  but behavior expects input named 'new_email'.

  Behavior 'update_email' inputs (behaviors.gln:5):
    new_email : string

  Did you mean: send new_email = field(new_email).value

ERROR [projection-binding-sensitive] projections.gln:12
  Projection 'profile_edit', data binding 'current_email = current_user.email':
  ✓ Valid — 'email' is not @sensitive.

  WARNING: Binding 'current_user.password_hash' would fail here because
  'password_hash' is @sensitive. This is informational only — no action needed.

ERROR [projection-derived-field] projections.gln:45
  Projection 'storefront', derived 'filtered_products':
  Expression 'products | where(name contains $state.search_term)':
  Entity 'Product' has no field 'name'.
  Available string fields on Product: title, description
  Did you mean 'title'?

ERROR [projection-state-type] projections.gln:38
  Projection 'storefront', on_click handler for 'add_to_cart':
  'append $state.cart_items = { ... }': Object includes field 'price'
  but earlier reference to cart_items uses field 'unit_price'.
  This may cause a runtime error in derived value 'cart_total'
  which accesses 'item.unit_price'.

ERROR [match-invalid-variant] projections.gln:60
  Projection 'order_detail', match on 'order.status':
  Branch 'when Triangle(base, height)': 'Triangle' is not a variant of
  enum 'Shape'.
  Available variants: Circle, Rectangle, Square

ERROR [match-incomplete-tagged] projections.gln:65
  Projection 'drawing_view', match on 'drawing.shape' (enum Shape):
  Missing variant 'Square'.
  Covered variants: Circle, Rectangle
  All variants: Circle, Rectangle, Square
  Add a 'when Square ... end' branch or add 'else ... end'.

ERROR [match-destructure-invalid-field] projections.gln:70
  Projection 'drawing_view', match on 'drawing.shape',
  branch 'when Circle(r)':
  Destructured name 'r' does not match any field on variant 'Circle'.
  Available fields: radius (decimal)
  Did you mean 'radius'?
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
ERROR [policy-constraint-param] policies.gln:5
  Policy 'owner_access', rule 'allow read when is_owner(target: $target)':
  Constraint 'is_owner' expects param 'target_entity', not 'target'.

  Constraint signature (constraints.gln:2):
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

-- Find enums declared but never referenced by any entity field, compute I/O,
-- behavior input, component prop, or adapter action
SELECT n.id FROM nodes n
WHERE n.type = 'enum'
AND n.id NOT IN (
  SELECT DISTINCT json_extract(f.value, '$.type')
  FROM nodes e, json_each(e.properties, '$.fields') f
  WHERE e.type = 'entity'
  UNION
  SELECT DISTINCT json_extract(p.value, '$.type')
  FROM nodes c, json_each(c.properties, '$.inputs') p
  WHERE c.type = 'compute'
  UNION
  SELECT DISTINCT json_extract(o.value, '$.type')
  FROM nodes c, json_each(c.properties, '$.outputs') o
  WHERE c.type = 'compute'
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
- No unused enums (warning level)
- No circular preconditions (behavior A requires constraint that triggers behavior A)
- Every behavior trigger references a valid projection and action
- Event listeners reference valid event names that are actually emitted somewhere
- All `navigate()` targets match a projection's route

Warnings:

```
WARNING [unused-compute] compute.gln:18
  Compute module 'generate_confirmation_code' is declared but never referenced
  by any behavior or constraint.

WARNING [unused-enum] entities.gln:80
  Enum 'Priority' is declared but never referenced by any entity field,
  compute module, behavior, component, or adapter.

WARNING [unreachable-listener] behaviors.gln:60
  Listener 'send_order_confirmation' listens for event 'order.confirmed',
  but no behavior emits 'order.confirmed'.
  Did you mean 'order.placed'?
  Events emitted in this application: order.placed, user.email_changed, user.password_changed
```

**Impurity propagation:**

After structural cross-cutting checks, Pass 8 propagates impurity from behaviors (computed in Pass 5) to listeners and projections.

```sql
-- Find listeners that trigger impure behaviors (transitive impurity)
SELECT l.id as listener_id,
       json_extract(l.properties, '$.event') as event,
       json_extract(l.properties, '$.triggers_behavior') as behavior_id
FROM nodes l
WHERE l.type = 'listener'
AND json_extract(l.properties, '$.triggers_behavior') IN (
  SELECT id FROM nodes WHERE type = 'behavior'
  -- behaviors marked impure by Pass 5
);

-- Find projections with actions that submit to impure behaviors
SELECT p.id as projection_id,
       json_extract(action.value, '$.submit_to') as behavior_id
FROM nodes p, json_each(p.properties, '$.actions') action
WHERE p.type = 'projection'
AND json_extract(action.value, '$.submit_to') IN (
  SELECT id FROM nodes WHERE type = 'behavior'
  -- behaviors marked impure by Pass 5
);

-- Find projections that use components (always impure — opaque DOM)
SELECT p.id as projection_id,
       json_extract(usage.value, '$.component_id') as component_id
FROM nodes p, json_each(p.properties, '$.component_usages') usage
WHERE p.type = 'projection';

-- Find projections with render(raw) directives
SELECT p.id as projection_id,
       json_extract(rd.value, '$.compute_module') as module_id
FROM nodes p, json_each(p.properties, '$.render_directives') rd
WHERE p.type = 'projection'
AND json_extract(rd.value, '$.format') = 'raw';
```

Propagation rules:

- Listener triggers an impure behavior → listener is impure, source: `{ kind: 'propagated', from_node: behavior_id, chain: [...] }`
- Projection action submits to an impure behavior → projection is impure, source: `{ kind: 'propagated', from_node: behavior_id, chain: [...] }`
- Projection uses a component → projection is impure, source: `{ kind: 'component', ... }`
- Projection uses `render(raw)` → projection is impure, source: `{ kind: 'render_raw', ... }`
- A projection or listener may have multiple impurity sources (e.g., uses a component AND submits to an impure behavior)

**json usage collection:**

Pass 8 scans the entire graph for `json`-typed fields, parameters, and outputs. Each usage is recorded in `TypeMap.json_usages` and generates a warning.

```sql
-- Entity fields typed as json
SELECT n.id as node_id, 'entity' as node_type,
       json_extract(f.value, '$.name') as field_name
FROM nodes n, json_each(n.properties, '$.fields') f
WHERE n.type = 'entity'
AND json_extract(f.value, '$.type') = 'json';

-- Compute module inputs/outputs typed as json
SELECT n.id as node_id, 'compute' as node_type,
       json_extract(p.value, '$.name') as param_name
FROM nodes n, json_each(n.properties, '$.inputs') p
WHERE n.type = 'compute'
AND json_extract(p.value, '$.type') = 'json'
UNION ALL
SELECT n.id, 'compute', json_extract(o.value, '$.name')
FROM nodes n, json_each(n.properties, '$.outputs') o
WHERE n.type = 'compute'
AND json_extract(o.value, '$.type') = 'json';

-- Adapter action inputs/outputs typed as json
SELECT n.id as node_id, 'adapter' as node_type,
       json_extract(a.value, '$.name') || '.' || json_extract(p.value, '$.name') as param_name
FROM nodes n, json_each(n.properties, '$.actions') a,
     json_each(json_extract(a.value, '$.inputs'), '$') p
WHERE n.type = 'adapter'
AND json_extract(p.value, '$.type') = 'json';

-- Behavior inputs typed as json
SELECT n.id as node_id, 'behavior' as node_type,
       json_extract(inp.value, '$.name') as param_name
FROM nodes n, json_each(n.properties, '$.input') inp
WHERE n.type = 'behavior'
AND json_extract(inp.value, '$.type') = 'json';

-- Component props typed as json
SELECT n.id as node_id, 'component' as node_type,
       json_extract(p.value, '$.name') as prop_name
FROM nodes n, json_each(n.properties, '$.props') p
WHERE n.type = 'component'
AND json_extract(p.value, '$.type') = 'json';
```

Warnings:

```
WARNING [json-type-hole] entities.gln:12
  Entity 'Order', field 'metadata': type is 'json'.
  Justification: "Order metadata varies by integration source — no fixed schema"
  The type checker cannot verify field access or shape compatibility
  on json values.

  If the shape is known, consider:
    field metadata : record({ source : string, campaign_id : string })

  This enables full type checking on metadata field access
  throughout behaviors, projections, and compute modules.

WARNING [json-type-hole] adapters.gln:8
  Adapter 'analytics', action 'track', input 'properties': type is 'json'.
  Justification: "Event properties vary per event type — no fixed schema"
  Consider record({ event_name: string, user_id: uuid, timestamp: timestamp })
  if the event shape is predictable.
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
- Prop types are valid (including record type field validation and tagged enum references)
- Event types are valid (including tagged enum references)
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
ERROR [component-missing-required] projections.gln:45
  Projection 'task_board', component 'drag_drop_list':
  Missing required prop 'items'.

  Component 'drag_drop_list' required props (components.gln:4):
    items : list(record({ id: uuid, title: string, position: integer })) @required

  Add: bind items = <list_binding>

ERROR [component-prop-type] projections.gln:72
  Projection 'admin_dashboard', component 'chart':
  Prop 'type' expects enum(bar, line, pie, area), received string "scatter".
  "scatter" is not a valid enum value.
  Valid values: bar, line, pie, area

ERROR [component-prop-record-mismatch] projections.gln:80
  Projection 'admin_dashboard', component 'data_table':
  Prop 'data' expects list(record({ id: uuid })).
  Binding 'all_orders' resolves to list of entity 'Order'.
  ✓ Order has field 'id' of type uuid — record shape is compatible.

ERROR [component-event-type] projections.gln:88
  Projection 'admin_dashboard', component 'data_table':
  Event 'on_row_click' has type record({ id: uuid }).
  Handler accesses '$event.order_id', but event record has no field 'order_id'.
  Available fields: id (uuid)
  Did you mean '$event.id'?

ERROR [component-unknown] projections.gln:95
  Projection 'admin_dashboard' uses component 'data_grid',
  which is not declared.
  Did you mean 'data_table'?
  Available components: chart, rich_text_editor, data_table, drag_drop_list

ERROR [render-not-render-type] projections.gln:55
  Projection 'storefront', render directive:
  Compute module 'calculate_discount' does not declare a render output.
  Only compute modules with 'output markup : render(...)' can be used
  in render directives.
  Compute modules with render output: sales_sparkline (svg), markdown_to_html (html_safe)

WARNING [render-raw-unsafe] projections.gln:62
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
- Action input/output types are valid (including tagged enum references)
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
ERROR [adapter-missing-action] behaviors.gln:42
  Behavior 'place_order', adapter call 'stripe_payments.charge':
  Adapter 'stripe_payments' has no action 'charge'.
  Available actions: create_charge, create_refund
  Did you mean 'create_charge'?

ERROR [adapter-param-type] behaviors.gln:44
  Behavior 'place_order', adapter call 'stripe_payments.create_charge':
  Param 'amount' expects type 'integer', but received 'decimal'
  from 'total_result.total'.

  Stripe expects amounts in cents (integer). You may need a compute
  module to convert: dollars_to_cents(amount: total_result.total)

ERROR [adapter-output-field] behaviors.gln:48
  Behavior 'place_order', adapter result 'charge_result.reason':
  Action 'create_charge' has no output 'reason'.
  Available outputs: charge_id (string), status (enum), failure_reason (string)
  Did you mean 'failure_reason'?
```

#### Impurity Audit (Post-Pass Summary)

After all 10 passes complete, the type checker produces an impurity audit. The audit generates no errors or warnings — it's a structured summary of where the type system's guarantees weaken. It prints on every build, passing or failing.

**Console output format:**

```
─── Impurity Audit ───────────────────────────────────────

Behaviors:     5 total │ 3 pure │ 2 impure
  ✗ place_order_with_payment  adapter_call (stripe_payments.create_charge)
  ✗ send_confirmation         adapter_call (email_sender.send)

Projections:   4 total │ 2 pure │ 2 impure
  ✗ admin_dashboard      component (chart, data_table)
  ✗ storefront           propagated (place_order_with_payment → stripe_payments.create_charge)

Listeners:     1 total │ 0 pure │ 1 impure
  ✗ send_order_confirmation  propagated → send_confirmation → email_sender.send

Components:    4 total (all opaque by definition)
  chart, data_table, drag_drop_list, rich_text_editor

json holes:    1
  analytics.track.properties  "Event properties vary per event type — no fixed schema"
    → consider record({ event_name: string, user_id: uuid })

Render safety: 3 directives │ 2 sanitized │ 1 raw
  ✗ custom_template (raw) in content_page

Pure coverage: 50% (3/5 behaviors, 2/4 projections, 0/1 listeners)

──────────────────────────────────────────────────────────
```

**JSON interface** (for programmatic consumption):

```typescript
interface ImpurityAudit {
  behaviors: {
    total: number;
    pure: number;
    impure: number;
    details: Array<{
      id: string;
      is_pure: boolean;
      sources: ImpuritySource[];
    }>;
  };
  projections: {
    total: number;
    pure: number;
    impure: number;
    details: Array<{
      id: string;
      is_pure: boolean;
      sources: ImpuritySource[];
    }>;
  };
  listeners: {
    total: number;
    pure: number;
    impure: number;
    details: Array<{
      id: string;
      is_pure: boolean;
      sources: ImpuritySource[];
    }>;
  };
  components: {
    total: number;
    ids: string[];
  };
  json_usages: JsonUsage[];
  render_safety: {
    total: number;
    sanitized: number;
    raw: number;
    raw_details: Array<{ compute_module: string; projection: string }>;
  };
  pure_coverage: {
    percentage: number; // (pure behaviors + projections + listeners) / total
    pure: number;
    total: number;
  };
}
```

The audit is included in the JSON output of `graphlang check --format json` alongside errors and warnings (see `TypeCheckResult` below).

### 3.4 Error Output Format

Errors are structured for both human and AI consumption:

```typescript
interface TypeCheckError {
  // Severity
  level: "error" | "warning" | "info";

  // Error code for categorization
  code: string; // e.g., 'behavior-compute-param-mismatch'

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
  path: string; // e.g., "projection:profile_edit → action:update_email_btn → send:email → behavior:update_email → input:new_email"

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

ERROR [behavior-compute-param-mismatch] behaviors.gln:18
│ Behavior 'update_password', compute step 'verify_result':
│ Param name mismatch calling 'verify_password'.
│
│   Expected: plaintext (from compute.gln:8)
│   Received: plain_text
│
│ Path: behavior:update_password → compute:verify_password → input:plaintext
│
│ Suggestion: Change 'plain_text' to 'plaintext'
│
│ Related:
│   compute.gln:8  — verify_password input declaration
│   behaviors.gln:6 — behavior input that provides the value

ERROR [projection-send-name] projections.gln:28
│ ...

ERROR [constraint-invalid-traversal] constraints.gln:8
│ ...

WARNING [unused-compute] compute.gln:18
│ ...

WARNING [policy-uncovered-entity] (global)
│ ...
```

The impurity audit prints after errors and warnings on every build — both passing and failing. On a clean build:

```
✓ Build passed: 0 errors, 1 warning

WARNING [json-type-hole] adapters.gln:8
│ ...

─── Impurity Audit ───────────────────────────────────────
...
```

**Additional warning codes** for impurity tracking:

- `json-type-hole` (warning) — a field, parameter, or output uses the `json` type, bypassing structural type checking
- `adapter-output-unverified` (info) — an adapter action's declared output types cannot be verified at build time; runtime validation will check them

Note: `render-raw-unsafe` already exists (see Pass 9).

**JSON output** (for programmatic consumption by AI tools):

```bash
graphlang check ./app/ --format json
```

Returns a `TypeCheckResult` object wrapping both errors and the impurity audit:

```typescript
interface TypeCheckResult {
  errors: TypeCheckError[]; // all errors, warnings, and info messages
  audit: ImpurityAudit; // impurity summary (see above)
}
```

AI can parse this directly — errors for targeted fixes, the audit for understanding purity coverage.

### 3.5 Type Checking as a Standalone Step

The type checker is a standalone command that doesn't require the runtime:

```bash
# Just type-check, nothing else
graphlang check ./app/

# Type-check with JSON output (for AI consumption)
graphlang check ./app/ --format json

# Type-check a single file (faster iteration)
graphlang check ./app/behaviors.gln
```

This means the AI development loop follows the **Write / Query / Validate** model:

**Write.** AI generates or modifies `.gln` files and TypeScript implementations in `impl/`. After graph changes, run `graphlang sync` to generate type contracts, create implementation stubs, and rewrite drifted signatures.

**Query.** AI uses graph query commands to understand context before making changes:
- `graphlang show <node>` — inspect a node's full definition, edges, and resolved types
- `graphlang deps <node>` — see what a node depends on
- `graphlang impact <node>` — see what depends on a node (blast radius)
- `graphlang trace <projection> <entity>` — trace the full path from UI to data

**Validate.** Two checkers run in tandem, each catching different error classes:
1. `graphlang check` — graph errors (type contracts, entity integrity, behavior sequencing, projection bindings). Fix these by editing `.gln` files.
2. `tsc --noEmit --incremental` — implementation errors (function bodies don't match generated contracts in `contracts.gen.ts`). Fix these by editing `.ts` files.

The correction path is always clear: graph errors → fix `.gln`, TypeScript errors → fix `.ts`. The AI never has to choose. `sync` ensures signatures stay aligned automatically, so the AI only ever fixes function bodies, never signatures.

The full cycle is fast — no compilation, no runtime startup. `graphlang check` is the inner loop for graph correctness; `tsc` is the inner loop for implementation correctness. Both must be fast and their errors must be specific enough for AI to converge.

---

## 4. The DSL (.gln files)

### 4.1 Design Principles

- **Flat structure.** Every node and edge is a top-level declaration. No nesting hierarchies.
- **One declaration per file.** Each `.gln` file contains exactly one top-level declaration (one entity, one behavior, one projection, etc.). Filename is the snake_case form of the node name (e.g., `order.gln`, `place_order.gln`, `order_status.gln`). This keeps git diffs surgical — a single-field rename touches one file — and maximizes watch mode efficiency, since the dependency map is file → nodes → passes. No imports, no module system, no file-linking mechanism. The tooling recursively scans all `.gln` files in the project tree.
- **Directory-structure-agnostic.** `graphlang check` processes every `.gln` file it finds regardless of directory layout. The node type is declared in the file content (`entity Order`, `behavior place_order`) — directory names add no information the tooling needs. Teams can organize by node type, by feature, or not at all. The spec does not prescribe a convention because the primary author is AI, which loads entire project context and doesn't navigate directories.
- **Graph-as-source-of-truth.** The `.gln` graph is the authoritative program. TypeScript implementations behind compute modules, adapters, and components are managed artifacts — the toolchain generates their type contracts, creates stubs, and rewrites signatures when the graph changes. This eliminates split-brain drift between graph declarations and TS implementations.
- **Deterministic correction paths.** Every error has a clear fix target. Graph errors from `graphlang check` → fix `.gln` files. TypeScript errors from `tsc` → fix `.ts` files. The AI never has to choose between "fix the graph" or "fix the TS" — the graph wins, and the toolchain adjusts the TS to match.
- **One statement per line.** Trivial for AI to emit, trivial to diff in git.
- **Explicit edges.** Every relationship is declared, never implicit.
- **Typed everything.** Node types, field types, edge types — all explicit.
- **Order-independent.** Declarations can appear in any order across any files. The parser resolves references after all files are loaded.
- **No computation in the graph.** Computation lives in TypeScript modules, referenced by name.
- **Queryable by design.** The graph is stored in SQLite, so every architectural question is a SQL query. "Which behaviors mutate User?" is a join. "What breaks if I rename Order.status?" is a dependency traversal. The CLI exposes this queryability to AI through structured commands (`show`, `deps`, `impact`, `trace`) — the AI's read interface to the application's architecture.

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

#### Enum Nodes (Tagged Unions)

Define algebraic data types (tagged unions) where each variant can carry its own typed fields. Enums share the same top-level namespace as entities and are stored as `type = 'enum'` in the `nodes` table.

```
enum Shape
  Circle
    field radius : decimal
  end
  Rectangle
    field width : decimal
    field height : decimal
  end
  Square
    field side : decimal
  end
end
```

Variants can be fieldless (carrying no data) or have one or more typed fields. An enum can mix both:

```
enum OrderStatus
  Pending
  end
  Confirmed
  end
  Shipped
    field carrier : string
    field tracking_number : string
  end
  Delivered
    field delivered_at : timestamp
  end
  Cancelled
    field reason : string
    field cancelled_at : timestamp
  end
end

enum PaymentResult
  Succeeded
    field charge_id : string
    field amount : integer
  end
  Declined
    field reason : string
  end
  RequiresAction
    field action_url : string
  end
end
```

**Rules:**

- Variant names use PascalCase (convention, not enforced)
- Each enum must have at least two variants
- Variant field types follow the same rules as entity fields — including references to other enums and entities
- Enum names and entity names share the same namespace — no conflicts allowed
- Enum names can be used as field types on entities, compute I/O, behavior inputs, component props, and adapter actions
- Fieldless variants omit the `field` declarations but still require `end`

**Using enums as field types:**

```
entity Drawing
  field id : uuid @generated
  field name : string @required
  field shape : Shape @required
end

entity Order
  field id : uuid @generated
  field status : OrderStatus @default(OrderStatus.Pending)
  field total : decimal @required
end
```

The inline `enum(val1, val2, ...)` syntax remains unchanged for simple restricted-value fields. Use top-level `enum Name ... end` when variants need to carry data.

**Supported field types:**

- `string` — short text, supports `@min(n)`, `@max(n)`, `@format(email|url|phone)`
- `text` — long text, no length limits
- `integer` — whole numbers, supports `@min(n)`, `@max(n)`
- `decimal` — floating point, supports `@min(n)`, `@max(n)`, `@precision(n)`
- `boolean` — true/false
- `uuid` — universally unique identifier
- `timestamp` — ISO 8601 datetime
- `enum(val1, val2, ...)` — restricted set of string values (flat enum, no associated data)
- `<EnumName>` — reference to a declared enum (tagged union). Values carry a `variant` discriminant and variant-specific fields.
- `record({ field: type, ... })` — inline structured type with named, typed fields. Enables full type checking through component props, adapter actions, and behavior inputs without resorting to `json`.
- `list(T)` — ordered collection of any type T, including `list(record({...}))` for typed collections
- `json` — arbitrary JSON blob. **Escape hatch — use sparingly.** Every `json` usage is a hole in the type system where the checker can't validate field access. Prefer `record({...})` when the shape is known. **Requires `@justification("reason")` annotation** — the type checker errors if a `json`-typed field, parameter, or output lacks a justification. The justification text appears in the impurity audit.

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
- `@justification("reason")` — required on any field, parameter, or output typed as `json`. Explains why a typed alternative isn't used. Text appears in the impurity audit. Example: `field metadata : json @justification("Event properties vary per event type — no fixed schema")`

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

#### Edge Vocabulary and Graph Topology

The graph is a directed multigraph — nodes can have multiple edges of different types between them. The full edge vocabulary determines the graph's topology and is what makes it navigable. Every edge type listed below is stored in the `edges` table and is queryable via SQL (see Section 7 for the schema).

| Edge Type | From Node | To Node | Created By | What It Means |
| --- | --- | --- | --- | --- |
| `has_one` | entity | entity | `edge` declaration | One-to-one relationship |
| `has_many` | entity | entity | `edge` declaration | One-to-many relationship |
| `belongs_to` | entity | entity | `edge` declaration | Inverse of has_one/has_many |
| `many_to_many` | entity | entity | `edge` declaration | Many-to-many relationship |
| `uses_compute` | behavior | compute | `compute_step` in behavior | Behavior calls a compute module |
| `mutates` | behavior | entity | `mutate` block in behavior | Behavior writes to an entity |
| `reads` | behavior | entity | `input` in behavior | Behavior reads from an entity |
| `calls_adapter` | behavior | adapter | `adapter_step` in behavior | Behavior calls an external service |
| `precondition` | behavior | constraint | `precondition` in behavior | Behavior requires a condition |
| `triggers` | projection | behavior | `action submit` in projection | UI action submits to a behavior |
| `binds` | projection | entity | `data` block in projection | Projection displays entity data |
| `uses_component` | projection | component | `component` in layout | Projection embeds a custom component |
| `listens` | listener | behavior | `trigger` in listener | Listener triggers a behavior on event |
| `enforces` | policy | constraint | `require` in policy | Policy enforces a constraint |
| `targets` | policy | entity/behavior | `on` in policy | Policy applies to a node |

This vocabulary is what makes the graph navigable. "Which behaviors mutate User?" follows `mutates` edges backward. "What triggers when an order is placed?" follows `listens` edges from behaviors. "What's the blast radius of renaming Product.price?" traces `reads`, `mutates`, `binds`, and `uses_compute` edges transitively. Every architectural question maps to an edge traversal.

#### Compute Modules

Declare compute modules with typed signatures. Implementation lives in `.ts` files (pure TypeScript functions). The type checker validates that every reference to a compute module matches its declared signature.

The `source` field is **optional**. By default, the toolchain looks for the implementation at `impl/compute/<id>.ts` (derived from the compute module's ID). If a `source` field is present, it overrides the path but must stay within `impl/`. The toolchain resolves and tracks the mapping in `.graphlang/manifest.json`.

```
compute hash_password
  description "Hash a plaintext password"
  input plaintext : string
  output hashed : string
end

compute verify_password
  description "Verify plaintext against hash"
  input plaintext : string
  input hash : string
  output valid : boolean
end

compute calculate_order_total
  description "Sum line items"
  input items : list(record({
    unit_price : decimal,
    quantity : integer
  }))
  output total : decimal
end

compute calculate_discount
  description "Apply loyalty tier discount"
  input subtotal : decimal
  input tier : string
  output final_total : decimal
  output discount_amount : decimal
end

compute validate_password_strength
  description "Check password strength requirements"
  input password : string
  output valid : boolean
  output reason : string
end

compute format_currency
  description "Format decimal as currency string"
  input amount : decimal
  input currency : string
  output formatted : string
end
```

Explicit `source` override example (non-canonical path):

```
compute legacy_hash
  description "Legacy hash for migration compatibility"
  source "impl/compute/compat/legacy_hash.ts"
  input plaintext : string
  output hashed : string
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

**Tagged enum construction and narrowing in behaviors:**

When a mutation targets a field typed as a tagged enum, use `EnumName.Variant(field: value, ...)` syntax. For fieldless variants, omit the parentheses:

```
behavior ship_order
  trigger projection(order_detail).action(ship_btn)

  input
    carrier : string
    tracking_number : string
  end

  # Construct a tagged enum variant with fields
  mutate $target_order.status = OrderStatus.Shipped(
    carrier: $input.carrier,
    tracking_number: $input.tracking_number
  )

  on_success show_message("Order shipped", type: success)
end

behavior cancel_order
  trigger projection(order_detail).action(cancel_btn)

  input
    reason : string
  end

  # Fieldless variant — no parentheses
  # (or with fields if Cancelled has them)
  mutate $target_order.status = OrderStatus.Cancelled(
    reason: $input.reason,
    cancelled_at: now()
  )

  on_success show_message("Order cancelled", type: success)
end
```

Use `require ... is ... as` to narrow a tagged enum to a specific variant and bind its fields:

```
behavior process_payment
  trigger projection(checkout).action(pay_btn)

  input
    payment_token : string
  end

  compute payment_step = process_charge(token: $input.payment_token)

  # Narrow to a specific variant — 'success' gets Succeeded's fields
  require payment_step.result is PaymentResult.Succeeded as success
    else "Payment failed"

  # 'success' now has fields: charge_id (string), amount (integer)
  mutate $new_order = create(Order,
    status: OrderStatus.Confirmed,
    total: success.amount,
    payment_id: success.charge_id,
    user: $auth.user
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

**Match on tagged enums (destructuring):**

When matching on a field typed as a tagged enum, branches use variant names and destructure the variant's fields into local bindings:

```
match drawing.shape
  when Circle(radius)
    section
      text "Circle with radius " + radius
      text "Area: " + compute(format_currency, amount: 3.14159 * radius * radius, currency: "sq units")
    end

  when Rectangle(width, height)
    section
      text "Rectangle: " + width + " x " + height
      text "Area: " + compute(format_currency, amount: width * height, currency: "sq units")
    end

  when Square(side)
    section
      text "Square with side " + side
      text "Area: " + compute(format_currency, amount: side * side, currency: "sq units")
    end
end
```

Fieldless variants use just the name, no parentheses:

```
match order.status
  when Pending
    text "Your order is being processed."

  when Confirmed
    text "Order confirmed."

  when Shipped(carrier, tracking_number)
    section
      text "Shipped via " + carrier
      text "Tracking: " + tracking_number
    end

  when Delivered(delivered_at)
    text "Delivered on " + delivered_at

  when Cancelled(reason, cancelled_at)
    section
      text "Cancelled: " + reason style(error)
      text "on " + cancelled_at style(muted)
    end
end
```

The type checker validates:

- Every variant name in a `when` branch exists on the matched enum
- Destructured names match the variant's declared field names exactly
- Destructured bindings are scoped to the branch and typed according to the variant's field types
- Exhaustiveness: every variant is covered, or an `else` branch exists
- Fieldless variants must not have parentheses; variants with fields must destructure all fields

**Match with transitions:**

```
# Transitions between match branches are handled by CSS targeting
# data-gl-match-enter and data-gl-match-exit attributes.
# The graph only declares the match — CSS decides how it animates.
```

The transition modifier tells the compiler to animate between branches. The outgoing branch transitions out, the incoming branch transitions in. Available transitions: `crossfade(<duration>)`, `slide_left(<duration>)`, `slide_up(<duration>)`, `none`. Custom transitions can be defined in the theme.

**Type checker behavior with match:**

- When matching on a flat `enum(...)` field, the type checker verifies every enum value is covered, or that an `else` branch exists. Missing values produce a warning:
  ```
  WARNING [match-incomplete] projections.gln:25
    match on 'order.status': missing enum value "confirmed".
    Values for Order.status: pending, confirmed, shipped, delivered, cancelled
    Add a branch or add 'else ... end'
  ```
- When matching on a tagged enum field, the type checker verifies every variant is covered, or that an `else` branch exists. Each branch must destructure the correct field names. Missing variants produce a warning:
  ```
  WARNING [match-incomplete-tagged] projections.gln:30
    match on 'drawing.shape' (enum Shape): missing variant 'Square'.
    Covered variants: Circle, Rectangle
    All variants: Circle, Rectangle, Square
    Add a 'when Square ... end' branch or add 'else ... end'.
  ```
- Each branch is type-checked independently — bindings, component props, behavior wiring are all validated per branch. For tagged enum branches, destructured field bindings are available as typed locals within the branch.
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
    case "grid":
      container.innerHTML = renderBranch_grid();
      initBranch_grid(container);
      break;
    case "list":
      container.innerHTML = renderBranch_list();
      initBranch_list(container);
      break;
  }
}

watch("view_mode", () => renderViewModeMatch(viewModeContainer));
```

Each branch has its own render function and init function (which attaches event listeners, mounts components, etc.). When the match expression changes, the current branch is unmounted and the new branch is mounted.

##### Presentation & Transitions

The graph declares _when_ things change. CSS declares _how_ they look and animate. The graph never references colors, fonts, transitions, or animations.

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

A component is a reusable UI element with typed props flowing in and typed events flowing out. The implementation is opaque TypeScript with a mount/update/unmount contract. The graph declares the typed interface; the TS file handles rendering and interaction. Whether you're embedding a one-off drag-and-drop list or a reusable chart used across ten projections, it's the same concept: a component declaration with typed props and events.

The `source` field is **optional**. By default, the toolchain looks for the implementation at `impl/components/<id>.ts` (derived from the component's ID). If a `source` field is present, it overrides the path but must stay within `impl/`. The toolchain resolves and tracks the mapping in `.graphlang/manifest.json`.

```
component drag_drop_list
  description "Reorderable list with drag and drop"

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

  prop content : text
  prop placeholder : string
  prop toolbar : enum(full, minimal, none) @default(full)
  prop readonly : boolean @default(false)

  event on_change : text
  event on_save : text
end

component data_table
  description "Sortable, filterable data table"

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

Explicit `source` override example:

```
component legacy_chart
  description "Legacy charting component"
  source "impl/components/vendor/legacy_chart.ts"
  prop data : list(record({ label : string, value : decimal })) @required
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

**Component TS implementation contract:**

Component implementations use canonical naming: `mount_<id>`, `update_<id>`, `unmount_<id>`. Props are typed via generated contracts.

```typescript
// impl/components/chart.ts
import type { Component_chart_Props } from "../../.graphlang/gen/contracts.gen";

export function mount_chart(
  element: HTMLElement,
  props: Component_chart_Props,
  emit: EmitFn,
) {
  // element: DOM node to render into
  // props: typed data matching declared prop types
  // emit: function to fire typed events — emit('on_row_click', { id: '...' })
  // Full DOM control within the element.
}

export function update_chart(
  element: HTMLElement,
  props: Component_chart_Props,
) {
  // Called when bound prop values change (state updates, data refreshes).
  // Efficient diffing is the component's responsibility.
}

export function unmount_chart(element: HTMLElement) {
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
  input data : list(record({ month : string, total : decimal }))
  input width : integer
  input height : integer
  output markup : render(svg)
end

compute markdown_to_html
  description "Convert markdown text to safe HTML"
  input source : text
  output markup : render(html_safe)
end

compute syntax_highlight
  description "Syntax-highlight a code block"
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

| Mechanism      | Use Case                                                   | Type Safety                                    | Implementation                       |
| -------------- | ---------------------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| Components     | Any custom UI: charts, drag-drop, editors, maps            | Typed props + events (including record shapes) | JS with mount/update/unmount         |
| Render compute | Computed markup: sparklines, markdown, syntax highlighting | Typed inputs, format-specific sanitization     | TypeScript returning HTML/SVG string |
| Typed adapters | External services: Stripe, email, analytics                | Typed action inputs + outputs                  | Runtime handles HTTP/protocol        |

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

Adapters gain implementation files at `impl/adapters/<id>.ts`. The toolchain generates stubs with the canonical adapter executor pattern based on the adapter's `type` (http, smtp, etc.). No `source` field is needed — the adapter's `type` determines the executor pattern.

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
    input data : json @justification("Email template data varies per template — no fixed schema")
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
    input properties : json @justification("Event properties vary per event type — no fixed schema")
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
<section
  data-gl-projection="storefront"
  data-gl-node="cart_section"
  data-gl-visible="true"
  data-gl-type="section"
>
  <!-- Generated from action with style(primary) -->
  <button
    data-gl-type="action"
    data-gl-action-style="primary"
    data-gl-enabled="true"
  >
    <!-- Generated from text with style(bold) -->
    <span data-gl-type="text" data-gl-text-style="bold">
      <!-- Generated from match on order.status, current branch: shipped -->
      <div data-gl-type="match" data-gl-match="shipped">
        <!-- Generated from each block -->
        <div data-gl-type="each-item"></div></div
    ></span>
  </button>
</section>
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
[data-gl-match-exit] {
  animation: fadeOut 150ms ease-out forwards;
}
[data-gl-match-enter] {
  animation: fadeIn 200ms ease-in;
}

/* List item enter/exit */
/* Future: when keyed list diffing is implemented, these will fire on item enter/exit */
/* [data-gl-enter] { animation: slideIn 200ms ease-out; } */
/* [data-gl-exit] { animation: fadeOut 150ms ease-out forwards; } */

/* Design tokens */
:root {
  --color-primary: #6366f1;
  --color-secondary: #8b5cf6;
  --color-danger: #ef4444;
  --color-success: #22c55e;
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-border: #e2e8f0;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --spacing: 8px;
  --radius: 8px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes slideIn {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
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

Implementations are **toolchain-managed, AI-authored artifacts**. The graph is the source of truth. The toolchain generates type contracts (`.graphlang/gen/contracts.gen.ts`), creates implementation stubs, and maintains function signatures. AI fills in function bodies; signatures are owned by the toolchain.

- **Direct function calls.** No serialization, no memory management, no loader. Import and call.
- **AI writes it reliably.** TypeScript is the language AI knows best. No dialects, no subsets.
- **Native record types.** Typed objects pass directly — no JSON serialization round-trips.
- **Two layers of type checking.** GraphLang's type checker validates the graph wiring. TypeScript's type checker validates the function implementation. Both must pass.
- **Same code, both runtimes.** The server imports the function directly. The client bundler includes it in the generated JS. No "compile once, deploy everywhere" complexity — it's just JavaScript.
- **Generated contracts.** Implementations import their input/output types from `.graphlang/gen/contracts.gen.ts`. The toolchain creates stubs and maintains signatures — AI only needs to write function bodies.

### 5.2 Two Type Systems in Tandem

GraphLang uses two type systems working together, each with a clean division of responsibility:

**Layer 1: The Graph Checker (`graphlang check`).** Operates on the graph in SQLite. Validates structural correctness — every edge has compatible types on both ends, every reference resolves, every behavior's compute steps produce what its mutations consume, every projection's bindings match entity fields. This is the 10-pass type checker described in Section 3.3. It catches errors that no single-file type checker can see because they span the full application graph.

**Layer 2: TypeScript (`tsc --noEmit --incremental`).** Operates on implementation files in `impl/`. Validates that function bodies are correct TypeScript — they handle all cases, use the right types, and conform to the generated contracts in `.graphlang/gen/contracts.gen.ts`. This is standard TypeScript compilation with no custom plugins or transformations.

**Why no custom contract checker is needed.** The toolchain generates `contracts.gen.ts` with exact type interfaces for every compute module, adapter action, and component. Implementation files import these types. When the graph changes, `graphlang sync` rewrites the imports and signatures. If an implementation doesn't match the contract, `tsc` catches it — wrong argument types, missing fields, incompatible return types are all standard TypeScript errors. The generated types _are_ the contract; `tsc` _is_ the contract checker.

**Error routing.** When validation fails, the error source tells the AI what to fix:
- Graph errors from `graphlang check` → fix `.gln` files (the graph is wrong)
- TypeScript errors from `tsc` → fix `.ts` files (the implementation is wrong)
- Missing implementation files → run `graphlang sync` to generate stubs

The AI never has to choose between fixing the graph or fixing the implementation. The graph always wins, and the toolchain adjusts the TypeScript boundary to match.

### 5.3 Compute Module Rules

Compute modules must be **pure functions** — no side effects, no external state. The build step enforces this with a lint pass:

- Must export named functions only (no default exports, no classes, no mutable state)
- Cannot import `fs`, `path`, `net`, `http`, `https`, `child_process`, `crypto` (Node-only modules)
- Cannot reference `fetch`, `XMLHttpRequest`, `document`, `window`, `globalThis`
- Cannot use `Math.random()` or `Date.now()` (non-deterministic)
- Return type must be a plain object, primitive, or array — no Promises, no callbacks

Violations are build errors, not warnings.

**Single-object-arg calling convention:** Every compute module exports exactly one function with a canonical name and signature:

- Function name: `compute_<id>` (e.g., `compute_verify_password`)
- Input type: `Compute_<id>_Input` (imported from `.graphlang/gen/contracts.gen.ts`)
- Output type: `Compute_<id>_Output` (imported from `.graphlang/gen/contracts.gen.ts`)
- The function takes a single input object and returns a single output object
- The `compute_` prefix avoids collisions with other symbols and keeps functions grepable
- Function names are mechanically derived from node IDs — no creativity, no drift

**Compute modules and impurity:** Because compute modules are lint-enforced pure functions (no I/O, no side effects, no non-determinism), they never contribute to impurity in the type checker's impurity tracking. The four impurity sources — adapter calls, components, `render(raw)`, and `json` type — are all outside the compute layer. A behavior's compute steps don't affect its `ImpurityInfo`; only its adapter calls and `render(raw)` usage do. This is by design: the compute layer is the provably pure core of every GraphLang application.

### 5.4 Example Compute Modules

All compute modules follow the single-object-arg convention: import types from `.graphlang/gen/contracts.gen`, export `compute_<id>` with typed input/output.

#### impl/compute/hash_password.ts

```typescript
// Prototype-quality hash — replace with bcrypt adapter for production
import type {
  Compute_hash_password_Input,
  Compute_hash_password_Output,
} from "../../.graphlang/gen/contracts.gen";

export function compute_hash_password(
  input: Compute_hash_password_Input,
): Compute_hash_password_Output {
  let hash = 5381;
  for (let i = 0; i < input.plaintext.length; i++) {
    hash = (hash << 5) + hash + input.plaintext.charCodeAt(i);
  }
  return { hashed: "hashed_" + hash.toString() };
}
```

#### impl/compute/verify_password.ts

```typescript
import type {
  Compute_verify_password_Input,
  Compute_verify_password_Output,
} from "../../.graphlang/gen/contracts.gen";

export function compute_verify_password(
  input: Compute_verify_password_Input,
): Compute_verify_password_Output {
  let computed = 5381;
  for (let i = 0; i < input.plaintext.length; i++) {
    computed = (computed << 5) + computed + input.plaintext.charCodeAt(i);
  }
  return { valid: input.hash === "hashed_" + computed.toString() };
}
```

#### impl/compute/calculate_order_total.ts

```typescript
import type {
  Compute_calculate_order_total_Input,
  Compute_calculate_order_total_Output,
} from "../../.graphlang/gen/contracts.gen";

export function compute_calculate_order_total(
  input: Compute_calculate_order_total_Input,
): Compute_calculate_order_total_Output {
  const total = input.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  return { total: Math.round(total * 100) / 100 };
}
```

#### impl/compute/calculate_discount.ts

```typescript
import type {
  Compute_calculate_discount_Input,
  Compute_calculate_discount_Output,
} from "../../.graphlang/gen/contracts.gen";

export function compute_calculate_discount(
  input: Compute_calculate_discount_Input,
): Compute_calculate_discount_Output {
  let rate = 0;
  if (input.tier === "gold") rate = 0.2;
  else if (input.tier === "silver") rate = 0.1;
  const discount_amount = Math.round(input.subtotal * rate * 100) / 100;
  return { final_total: input.subtotal - discount_amount, discount_amount };
}
```

#### impl/compute/validate_password_strength.ts

```typescript
import type {
  Compute_validate_password_strength_Input,
  Compute_validate_password_strength_Output,
} from "../../.graphlang/gen/contracts.gen";

export function compute_validate_password_strength(
  input: Compute_validate_password_strength_Input,
): Compute_validate_password_strength_Output {
  if (input.password.length < 8)
    return { valid: false, reason: "Must be at least 8 characters" };
  if (!/[A-Z]/.test(input.password))
    return { valid: false, reason: "Must contain an uppercase letter" };
  if (!/[0-9]/.test(input.password))
    return { valid: false, reason: "Must contain a digit" };
  return { valid: true, reason: "" };
}
```

#### impl/compute/format_currency.ts

```typescript
import type {
  Compute_format_currency_Input,
  Compute_format_currency_Output,
} from "../../.graphlang/gen/contracts.gen";

export function compute_format_currency(
  input: Compute_format_currency_Input,
): Compute_format_currency_Output {
  const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[input.currency] || input.currency + " ";
  return { formatted: symbol + input.amount.toFixed(2) };
}
```

#### impl/compute/markdown_to_html.ts

```typescript
// Render compute — returns markup string
import type {
  Compute_markdown_to_html_Input,
  Compute_markdown_to_html_Output,
} from "../../.graphlang/gen/contracts.gen";

export function compute_markdown_to_html(
  input: Compute_markdown_to_html_Input,
): Compute_markdown_to_html_Output {
  // Simple markdown conversion — replace with a proper library for production
  let html = input.source
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
  return { markup: html };
}
```

### 5.5 Compute Module Loading

```typescript
// Server: import via generated registry
import { registry } from "./.graphlang/gen/registry.gen";
const result = registry.compute.verify_password({
  plaintext: "test",
  hash: "hashed_123",
});
// result: { valid: false }
```

Or direct import still works:

```typescript
// Server: direct import
import { compute_validate_password_strength } from "./impl/compute/validate_password_strength";
const result = compute_validate_password_strength({
  password: "MyPassword123",
});
// result: { valid: true, reason: "" }

// Client: bundled into generated JS by the compiler
// The projection compiler includes compute functions used in
// client-side validation and derived values.
```

No loader, no runtime, no marshaling. Functions are imported and called directly.

### 5.6 Generated Contract Surface

On every `graphlang sync` and `graphlang build`, the toolchain generates `.graphlang/gen/` from the graph:

**`types.gen.ts`** — Entity record types and tagged enum discriminated unions:

```typescript
// Generated — DO NOT EDIT
export interface Entity_User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: "admin" | "customer";
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | { variant: "Pending" }
  | { variant: "Confirmed" }
  | { variant: "Shipped"; carrier: string; tracking_number: string }
  | { variant: "Delivered"; delivered_at: string }
  | { variant: "Cancelled"; reason: string; cancelled_at: string };
```

**`contracts.gen.ts`** — Canonical signatures for every compute module, adapter action, and component:

```typescript
// Generated — DO NOT EDIT
// Compute: verify_password
export interface Compute_verify_password_Input {
  plaintext: string;
  hash: string;
}
export interface Compute_verify_password_Output {
  valid: boolean;
}

// Compute: calculate_order_total
export interface Compute_calculate_order_total_Input {
  items: Array<{ unit_price: number; quantity: number }>;
}
export interface Compute_calculate_order_total_Output {
  total: number;
}

// Adapter: stripe_payments, action: create_charge
export interface Adapter_stripe_payments__create_charge_Input {
  amount: number;
  currency: string;
  token: string;
  description: string;
}
export interface Adapter_stripe_payments__create_charge_Output {
  charge_id: string;
  status: "succeeded" | "pending" | "failed";
  failure_reason: string;
}

// Component: chart
export interface Component_chart_Props {
  data: Array<{ label: string; value: number }>;
  type: "bar" | "line" | "pie" | "area";
  title?: string;
  height?: number;
  color_scheme?: "default" | "warm" | "cool" | "mono";
}
```

**`validators.gen.ts`** — Runtime validators for adapter outputs and component events:

```typescript
// Generated — DO NOT EDIT
export function validate_stripe_payments__create_charge_output(
  data: unknown,
): Adapter_stripe_payments__create_charge_Output {
  // Validates shape, types, required fields
  // Throws ValidationError with structured diff on mismatch
}
```

**`registry.gen.ts`** — Binds all implementations into a single importable object:

```typescript
// Generated — DO NOT EDIT
import { compute_verify_password } from "../impl/compute/verify_password";
import { compute_hash_password } from "../impl/compute/hash_password";
// ...
export const registry = {
  compute: {
    verify_password: compute_verify_password,
    hash_password: compute_hash_password,
    // ...
  },
  adapters: {
    /* ... */
  },
  components: {
    /* ... */
  },
};
```

**`tsc` is the contract checker.** The generated types in `contracts.gen.ts` define exact interfaces for every compute module, adapter action, and component. Implementation files import these types. When `tsc --noEmit` runs, it validates that every implementation matches its generated contract — wrong argument types, missing fields, incompatible return types are all standard TypeScript compilation errors. No custom contract checking logic is needed.

**Missing implementation files** are still detected by `graphlang check`. The graph checker knows which compute/adapter/component nodes exist and can verify that their implementation files are present at the expected paths:

```
ERROR [missing-impl] (global)
  Compute module 'calculate_discount' has no implementation file.
  Expected: impl/compute/calculate_discount.ts
  Run 'graphlang sync' to generate a stub.
```

**Purity lint** remains a separate concern — `tsc` can't detect that a function calls `fetch()` or uses `Math.random()`. The purity lint pass (Section 5.3) catches these violations at build time.

### 5.7 Enum Type Mapping to TypeScript

Tagged enums map to TypeScript discriminated unions. The discriminant field is always `variant`:

**Graph declaration:**

```
enum Shape
  Circle
    field radius : decimal
  end
  Rectangle
    field width : decimal
    field height : decimal
  end
  Square
    field side : decimal
  end
end
```

**TypeScript type:**

```typescript
type Shape =
  | { variant: "Circle"; radius: number }
  | { variant: "Rectangle"; width: number; height: number }
  | { variant: "Square"; side: number };
```

Fieldless variants have only the `variant` discriminant:

```typescript
type OrderStatus =
  | { variant: "Pending" }
  | { variant: "Confirmed" }
  | { variant: "Shipped"; carrier: string; tracking_number: string }
  | { variant: "Delivered"; delivered_at: string }
  | { variant: "Cancelled"; reason: string; cancelled_at: string };
```

Compute modules that accept or return tagged enums use standard TypeScript narrowing. Types are imported from the generated contract surface:

```typescript
// impl/compute/describe_shape.ts
import type { Shape } from "../../.graphlang/gen/types.gen";
import type {
  Compute_describe_shape_Input,
  Compute_describe_shape_Output,
} from "../../.graphlang/gen/contracts.gen";

export function compute_describe_shape(
  input: Compute_describe_shape_Input,
): Compute_describe_shape_Output {
  switch (input.shape.variant) {
    case "Circle":
      return { description: `Circle with radius ${input.shape.radius}` };
    case "Rectangle":
      return {
        description: `${input.shape.width}x${input.shape.height} rectangle`,
      };
    case "Square":
      return { description: `Square with side ${input.shape.side}` };
  }
}
```

`tsc` validates that implementations using these types are correct — the TypeScript discriminated union in `types.gen.ts` is generated directly from the graph's enum declaration with matching variant names, field names, field types, and `variant` as discriminant. Since types are generated from the graph, drift is impossible.

### 5.8 Implementation Sync and Signature Lock

`graphlang sync` manages the boundary between graph declarations and TypeScript implementations. It is the only command that writes to `impl/` and `.graphlang/gen/`.

**Pipeline:**

1. Parse all `.gln` files → SQLite
2. Run type checker passes (all 10)
3. Generate `.graphlang/gen/*` — **always, even when there are type errors** (so AI can reference contracts while fixing graph errors)
4. Scan `impl/` for existing implementations
5. For each compute/adapter/component node:
   - If impl file missing → create stub with correct signature and a `throw new Error('not implemented')` body
   - If impl exists but export name is wrong → rename the export
   - If impl exists but signature doesn't match → rewrite the signature (import from contracts.gen.ts), preserve the function body
   - If impl uses inline types instead of generated imports → rewrite to use imports
6. Update `.graphlang/manifest.json` with node ID → file path + export symbol mappings
7. Report: what was generated, what was created, what was rewritten

**Signature lock:** The toolchain owns the signature. When a graph declaration changes (e.g., a compute module gains a new input field), `sync` rewrites the import and signature in the impl file. The function body is never modified — only the AI edits bodies. This means:

- The implementation can never "win" over the graph
- Drift is corrected automatically, not detected and reported
- The AI only ever has to fix function bodies, never signatures

**Manifest:**

```json
{
  "compute": {
    "verify_password": {
      "path": "impl/compute/verify_password.ts",
      "export": "compute_verify_password",
      "hash": "a1b2c3..."
    }
  },
  "adapters": {},
  "components": {}
}
```

### 5.9 Runtime Validators

The generated `validators.gen.ts` provides runtime validation for values that cross trust boundaries — adapter outputs and component events. These are the two places where the type system's guarantees thin out: the graph declares what should come back, but the external service or opaque component might return anything.

**Validation behavior:**

- **Dev/test mode:** Hard fail. Adapter returns wrong shape → behavior fails with structured error showing expected vs received.
- **Production mode:** Configurable. Default: warn and log. Option: hard fail (`--strict-runtime`).
- **Validation errors** include a structured diff showing exactly which fields are missing, extra, or wrong-typed.

The validators are generated from the same graph declarations that produce `contracts.gen.ts` — one source of truth for both build-time types and runtime checks.

---

## 6. Testing

Testing is a first-class concern in GraphLang, not an afterthought. The framework's design makes each layer independently testable, and the tooling enforces fast feedback by default.

### 6.1 Test Layers

| Layer           | What's Tested                                 | Substrate                          | Speed                  |
| --------------- | --------------------------------------------- | ---------------------------------- | ---------------------- |
| Compute modules | Pure function correctness                     | None (direct import)               | < 100ms for full suite |
| Type checker    | Error detection and messages                  | In-memory SQLite                   | < 500ms for full suite |
| Constraints     | Constraint evaluation logic                   | In-memory SQLite                   | Fast                   |
| Behaviors       | Full precondition → compute → mutate pipeline | In-memory SQLite, stubbed adapters | Fast                   |
| Integration     | Full graph → server → response                | In-memory SQLite, test HTTP client | Seconds                |

Each layer runs independently. Compute tests don't touch SQLite. Type checker tests don't start a server. Behavior tests don't make network calls.

### 6.2 Compute Module Tests

Compute modules are pure functions. Their tests require no setup:

```typescript
// tests/compute/calculate_order_total.test.ts
import { describe, it, expect } from "vitest";
import { compute_calculate_order_total } from "../../examples/ecommerce/impl/compute/calculate_order_total";

describe("compute_calculate_order_total", () => {
  it("sums line items", () => {
    const result = compute_calculate_order_total({
      items: [
        { unit_price: 10.0, quantity: 2 },
        { unit_price: 5.5, quantity: 1 },
      ],
    });
    expect(result.total).toBe(25.5);
  });

  it("rounds to two decimal places", () => {
    const result = compute_calculate_order_total({
      items: [{ unit_price: 0.1, quantity: 3 }],
    });
    expect(result.total).toBe(0.3);
  });
});
```

No mocks. No fixtures. No async. The purity constraint that makes compute modules safe for the runtime is exactly what makes them trivially testable.

### 6.3 Type Checker Tests

Type checker tests verify that specific graph definitions produce specific errors — or none. Each test parses a DSL snippet into an in-memory SQLite graph and runs the checker:

```typescript
// tests/typechecker/pass-behavior.test.ts
import { describe, it, expect } from "vitest";
import { createTestGraph, runTypeChecker } from "../helpers";

describe("behavior type checking", () => {
  it("catches compute param name mismatch", () => {
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
      code: "behavior-compute-param-mismatch",
      expected: "plaintext",
      received: "plain_text",
    });
  });

  it("passes when param names match", () => {
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
import { describe, it, expect, beforeEach } from "vitest";
import { createTestEnvironment } from "../helpers";

describe("update_email", () => {
  let env: TestEnvironment;

  beforeEach(() => {
    env = createTestEnvironment("examples/ecommerce");
  });

  it("updates the user email when valid", async () => {
    const user = env.seed("User", {
      email: "old@example.com",
      name: "Test User",
      role: "customer",
    });

    const result = await env.executeBehavior(
      "update_email",
      { new_email: "new@example.com" },
      { auth: { user } },
    );

    expect(result.success).toBe(true);
    expect(env.find("User", user.id).email).toBe("new@example.com");
  });

  it("rejects an invalid email format", async () => {
    const user = env.seed("User", { email: "old@example.com" });

    const result = await env.executeBehavior(
      "update_email",
      { new_email: "not-an-email" },
      { auth: { user } },
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

## 7. The Graph Model

The graph is the application's architecture made concrete. Every entity, relationship, behavior, projection, policy, and adapter is a node. Every dependency, data flow, and reference is an edge. The graph is stored in SQLite — not because the data is relational, but because SQLite is a query engine. Every architectural question the type checker, CLI, or AI needs to ask is a SQL query over the same two tables.

**Why SQLite for the graph:**
- **Queryability.** "Which behaviors mutate User?" is a SQL join, not custom traversal code. As the tooling grows more sophisticated, you add queries, not code.
- **Tool reuse.** The type checker, CLI query commands, compiler, and runtime all read from the same store. One representation, many readers.
- **Incremental update.** When a `.gln` file changes, the parser updates only the affected nodes and edges in SQLite. Downstream tools re-query and see the updated graph immediately.
- **In-memory speed.** The graph is small enough to fit entirely in SQLite's cache. WAL mode with `better-sqlite3` (synchronous, not async) gives in-memory performance with SQL's expressiveness.

### 7.1 Graph Topology

The graph is a directed multigraph: nodes can have multiple edges of different types between them. Node types correspond to the DSL's declaration types (entity, edge, compute, behavior, projection, constraint, policy, component, adapter, listener, enum). Edge types capture every kind of relationship between nodes — see the edge vocabulary table in Section 4.2 for the complete catalogue.

Every edge is stored with `from_node`, `to_node`, and `type`. Properties on edges (like `on_delete` for relationship edges, or `field` for mutation edges) are stored as JSON. This uniform structure means that graph traversal queries are always joins on the same `edges` table with filters on `type` — no special-casing per edge kind.

### 7.2 Schema

```sql
-- Graph structure (populated at build time from .gln files)
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

-- Note: enum declarations are stored as nodes with type = 'enum',
-- properties containing variants and their fields as JSON.
-- Entity data with tagged enum fields stores the value as JSON
-- with a 'variant' discriminant (see Section 7.3).

-- Indexes for type checker and runtime queries
CREATE INDEX idx_edges_from ON edges(from_node, type);
CREATE INDEX idx_edges_to ON edges(to_node, type);
CREATE INDEX idx_edges_type ON edges(type);
CREATE INDEX idx_nodes_type ON nodes(type);
CREATE INDEX idx_entity_data_type ON entity_data(entity_type);
```

### 7.3 Configuration

```typescript
import Database from "better-sqlite3";

const db = new Database("dist/app.db");
db.pragma("journal_mode = WAL"); // Write-ahead log for concurrency
db.pragma("synchronous = NORMAL"); // Balance safety/speed
db.pragma("cache_size = -64000"); // 64MB cache — entire graph fits in memory
```

### 7.4 Tagged Enum Storage

Tagged enum values in `entity_data` are stored as JSON objects with a `variant` discriminant field:

```json
// Shape field on a Drawing entity — variant with fields
{ "variant": "Circle", "radius": 5.0 }
{ "variant": "Rectangle", "width": 10.0, "height": 4.0 }
{ "variant": "Square", "side": 7.5 }

// OrderStatus field — fieldless variant
{ "variant": "Pending" }

// OrderStatus field — variant with fields
{ "variant": "Shipped", "carrier": "FedEx", "tracking_number": "1234567890" }
```

Flat `enum(val1, val2, ...)` fields continue to be stored as bare strings (e.g., `"pending"`, `"admin"`). Only tagged enums use the JSON object format.

Tagged enum values are queryable via SQLite's `json_extract`:

```sql
-- Find all orders with Shipped status
SELECT * FROM entity_data
WHERE entity_type = 'Order'
AND json_extract(data, '$.status.variant') = 'Shipped';

-- Find shipped orders with a specific carrier
SELECT * FROM entity_data
WHERE entity_type = 'Order'
AND json_extract(data, '$.status.variant') = 'Shipped'
AND json_extract(data, '$.status.carrier') = 'FedEx';
```

---

## 8. Client-Side Compilation

The compiler reads projection nodes and generates client-side JavaScript. No JS is hand-written by humans or AI.

### 8.1 Compilation Mapping

| Graph Construct                    | Generated JS                                                   |
| ---------------------------------- | -------------------------------------------------------------- |
| `state` block                      | `let` variables in module closure                              |
| `bind_value $state.x`              | `addEventListener('input', ...)` + value setter                |
| `derived x = ...`                  | Getter function, re-evaluates when deps change                 |
| `derived x = compute(module, ...)` | Direct function call wrapped in dependency tracking            |
| `visible_when <cond>`              | Toggle `data-gl-visible` attribute on state change             |
| `enabled_when <cond>`              | Toggle `data-gl-enabled` attribute on state change             |
| `on_click set $state.x = y`        | `addEventListener('click', ...)` with state mutation           |
| `on_click append/remove`           | Array manipulation + DOM re-render of `each` blocks            |
| `submit_to behavior(x)`            | `fetch('/api/behavior/x', ...)` with input collection          |
| `debounce 200ms`                   | `setTimeout` wrapper around state update                       |
| `delay(150ms)`                     | `setTimeout` wrapper around handler                            |
| `each <list> as <item>`            | Keyed DOM generation loop, re-runs when list changes           |
| `match <expr>`                     | Switch that unmounts current branch, mounts new branch         |
| `component(x)`                     | Mount component JS, pass typed props, wire event emitters      |
| `derived q = query(...)`           | `fetch` to query endpoint, cached, re-fetches when deps change |

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
  graph: Graph,
  behaviorId: string,
  input: any,
  auth: AuthContext,
): Promise<BehaviorResult> {
  const behavior = graph.getNode(behaviorId);

  // 1. Validate input types
  validateInput(behavior.properties.input, input);

  // 2. Build context
  const ctx = {
    input,
    auth,
    target: await resolveTarget(behavior, input, auth),
    computed: {},
  };

  // 3. Preconditions (short-circuit on failure)
  for (const pre of behavior.properties.preconditions || []) {
    const result = await evaluateConstraint(graph, pre, ctx);
    if (!result.passed) return { success: false, error: result.error };
  }

  // 4. Compute steps
  for (const step of behavior.properties.compute_steps || []) {
    const params = resolveParams(step.params, ctx);
    const computeModule = await import(`./compute/${step.module}`);
    ctx.computed[step.alias] = computeModule[step.function](
      ...Object.values(params),
    );

    // 4a. Validate compute output against declared types
    validateAgainstDeclaredTypes(
      ctx.computed[step.alias],
      graph.getNode(step.module).properties.outputs,
      `compute:${step.module}`,
    );
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
    const action = adapter.properties.actions.find(
      (a: any) => a.name === call.action,
    );
    const params = resolveParams(call.params, ctx);
    try {
      ctx.adapter_results[call.alias] = await executeAdapterAction(
        adapter,
        action,
        params,
      );
    } catch (err) {
      return {
        success: false,
        error: `Adapter call failed: ${call.adapter_id}.${call.action}`,
      };
    }

    // 6a. Validate adapter response against declared output types
    validateAgainstDeclaredTypes(
      ctx.adapter_results[call.alias],
      action.outputs,
      `adapter:${call.adapter_id}.${call.action}`,
    );
  }

  // 7. Require assertions on adapter results
  for (const req of behavior.properties.adapter_requirements || []) {
    if (!resolveExpression(req.expression, ctx)) {
      return { success: false, error: req.error_message };
    }
  }

  // 8. Mutations (atomic)
  db.transaction(() => {
    for (const m of behavior.properties.mutations || [])
      executeMutation(m, ctx, db);
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

// DeclaredOutput: { name: string; type: ResolvedType; nullable: boolean }
// (from the compute/adapter node's declared output list in the graph)
//
// Runtime type validation — checks actual values against declared types.
// Prototype behavior: warn on mismatch (log, don't fail). Production could
// optionally fail hard via a strictness flag.
function validateAgainstDeclaredTypes(
  actual: any,
  declaredOutputs: DeclaredOutput[],
  source: string,
): void {
  for (const output of declaredOutputs) {
    const value = actual[output.name];
    if (value === undefined && !output.nullable) {
      console.warn(
        `[runtime-type-mismatch] ${source}: expected output '${output.name}' but got undefined`,
      );
      continue;
    }
    if (value !== undefined && typeof value !== expectedJsType(output.type)) {
      console.warn(
        `[runtime-type-mismatch] ${source}: output '${output.name}' expected ${output.type}, got ${typeof value}`,
      );
    }
  }
}
```

Runtime validation is especially important for adapter calls, where the response comes from an external service and the declared output types are promises, not proofs. Compute modules are pure functions with TypeScript-checked signatures, so runtime mismatches should never occur there — the validation is a defense-in-depth measure.

---

## 10. Build Pipeline

### 10.1 CLI Commands

**Build commands:**

```bash
# Sync graph → implementations (generates contracts, creates stubs, rewrites signatures)
graphlang sync ./app/

# Read-only graph type check (no file mutations)
graphlang check ./app/
graphlang check ./app/ --format json

# Full build: sync → compile → bundle (calls sync first)
graphlang build ./app/ --output ./dist/

# Dev server with file watching (calls sync on graph changes)
graphlang dev ./app/ --port 3000

# Seed entity data
graphlang seed ./app/ --data ./seed.json
```

**Graph query commands** (the AI's read interface):

```bash
# Show a node's full definition, edges, and resolved types
graphlang show User
graphlang show place_order --format json

# Trace the full path from a projection to an entity
graphlang trace checkout_page Order

# Show what a node depends on (its inputs)
graphlang deps place_order

# Show what depends on a node (blast radius of changing it)
graphlang impact User

# Standalone impurity audit summary
graphlang audit ./app/
```

**Command semantics:**

- `sync` — mutates `impl/` and `.graphlang/gen/`. The only command allowed to create/rewrite implementation files. Generates contracts, creates stubs for missing implementations, rewrites drifted signatures, updates the manifest.
- `check` — read-only graph diagnostics. Reports type errors but never writes files. Runs Phase 1 of the build pipeline only.
- `build` — calls `sync` first, then compiles and bundles. Fails if sync produces errors.
- `dev` — calls `sync` on `.gln` file changes, then incrementally re-checks.
- `show` — reads a single node from SQLite and displays its type, properties, edges (with targets), and resolved types. `--format json` for AI consumption.
- `trace` — performs a recursive graph traversal from a projection node to an entity node, showing the full chain of edges (projection → behavior → compute → entity).
- `deps` — shows all nodes that the given node depends on (outgoing edges, transitively).
- `impact` — shows all nodes that depend on the given node (incoming edges, transitively). This is the blast radius — what breaks if you change this node.
- `audit` — runs the impurity analysis passes and prints the impurity audit summary without running the full type checker.

### 10.2 Build Pipeline

The build runs as three phases. Each phase gates the next — errors stop the pipeline.

**Phase 1: Graph** (runs on `graphlang check`, `graphlang build`, `graphlang dev`)

1. Parse changed `.gln` files → AST
2. Update SQLite graph store (nodes + edges tables) — incremental, only changed files
3. Run graph type checker (all 10 passes) → query SQLite, validate all edge contracts
4. **If graph errors → STOP.** Output all errors. Do not proceed.

**Phase 2: Implementations** (runs on `graphlang build`, `graphlang dev`)

5. Generate `.graphlang/gen/` → types, contracts, validators, registry
6. Sync implementations → create stubs for missing impls, rewrite drifted signatures, update manifest
7. Run `tsc --noEmit --incremental` → validate all implementation files against generated contracts
8. **If TypeScript errors → STOP.** Output errors. AI fixes `.ts` files.

**Phase 3: Build artifacts** (runs on `graphlang build` only)

9. Run tests → execute compute, type checker, and behavior test suites
10. **If test failures → STOP.**
11. Compile client JS → projection compiler generates `.js` per projection
12. Lint CSS → PostCSS plugin validates `data-gl-*` selectors
13. Bundle CSS → concatenate and minify
14. Copy runtime → shared `graphlang-runtime.js`
15. Report → summary

`graphlang check` runs Phase 1 only — fast graph validation. Full validation (graph + implementations) is Phase 1 + Phase 2. `graphlang build` runs all three phases.

### 10.3 Output Structure

**Project structure** (source tree with generated artifacts):

```
app/
├── .graphlang/
│   ├── gen/
│   │   ├── types.gen.ts          # Entity types, tagged enum unions
│   │   ├── contracts.gen.ts      # Compute/adapter/component signatures
│   │   ├── validators.gen.ts     # Runtime validators
│   │   └── registry.gen.ts       # Implementation bindings
│   └── manifest.json             # Node ID → impl file mapping + hashes
├── **/*.gln                      # Graph declarations
├── impl/                         # Toolchain-managed implementations
│   ├── compute/
│   ├── adapters/
│   └── components/
└── styles/
```

**Build output:**

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

### Phase 1: Graph Store + Type Checker + Query Commands (Weeks 1-2)

**Goal:** Build the graph store, type checker, and query commands. Parse `.gln` files into SQLite. Type-check everything. Make the graph queryable. Produce excellent errors.

This is the most important phase. The graph store and type checker together are the product — the graph makes architecture explicit, and the type checker enforces it.

1. TypeScript project setup
2. Lexer (tokenizer)
3. Recursive descent parser for all node types (including `match` in projections)
4. SQLite graph store (nodes + edges tables) — the foundation everything else queries
5. **Type checker passes 1-10** (the bulk of the work):
   - Pass 1: Entity integrity
   - Pass 2: Edge integrity
   - Pass 3: Compute module signatures (including `render(...)` output types)
   - Pass 4: Constraint validation
   - Pass 5: Behavior type checking (including adapter calls)
   - Pass 6: Projection type checking (including match exhaustiveness, transition validation, class bindings, track\_\* helpers)
   - Pass 7: Policy completeness
   - Pass 8: Cross-cutting validation
   - Pass 9: Component validation (prop record types, event types)
   - Pass 10: Adapter validation (action contracts, param types)
6. Record subtyping implementation
7. Error output formatting (console + JSON)
8. CLI: `graphlang check`
9. CLI graph query commands: `graphlang show`, `graphlang deps`, `graphlang impact`, `graphlang trace`

**Test:** Write intentionally broken `.gln` files. Verify the type checker catches every error with specific, actionable messages. Feed the errors to Claude and verify it can fix them. Verify query commands return correct, structured output for the example application.

### Phase 2: Compute Modules + CSS Pipeline (Week 3)

**Goal:** Compute modules run on server and client. CSS pipeline with PostCSS lint.

1. Write example compute modules in TypeScript (using single-object-arg convention)
2. Purity lint pass (no fs, no fetch, no DOM, no randomness)
3. Code generation pipeline (types.gen.ts, contracts.gen.ts, validators.gen.ts, registry.gen.ts)
4. `graphlang sync` command (stub creation, signature rewriting, manifest)
5. `tsc --noEmit --incremental` integration for contract validation
6. Client bundler includes compute functions used in projections
7. PostCSS lint plugin (validate `data-gl-*` selectors against graph)
8. CSS bundling (concatenate + minify source CSS files)
9. Base CSS theme with design tokens and data-attribute styles

**Test:** `compute_validate_password_strength({ password: "Weak" })` returns `{ valid: false, reason: "Must be at least 8 characters" }`. PostCSS lint catches a typo in a CSS selector referencing a graph node. `graphlang sync` creates stubs for all compute modules and generates correct contracts. `tsc` catches signature mismatches against generated contracts.

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

1. Projection → JS compiler (including match → switch, transition CSS classes, class bindings, track\_\* helpers)
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

1. Create Claude prompt for generating `.gln` + TypeScript compute modules
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
│   │   └── index.ts                # CLI: check, sync, build, dev, seed
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
│   │   ├── pass-entity.ts          # Pass 1: Entity & Enum integrity
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
│   ├── codegen/
│   │   ├── types.ts               # Generate types.gen.ts
│   │   ├── contracts.ts           # Generate contracts.gen.ts
│   │   ├── validators.ts         # Generate validators.gen.ts
│   │   ├── registry.ts           # Generate registry.gen.ts
│   │   └── sync.ts               # Stub creation, signature rewriting, manifest
│   ├── compute/
│   │   ├── loader.ts               # Import and call compute functions
│   │   ├── lint.ts                 # Validate purity rules (no fs, no fetch, etc.)
│   │   └── purity-check.ts         # Verify purity rules beyond what tsc catches
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
│       │                           # One declaration per .gln file.
│       │                           # Subdirectory layout is optional —
│       │                           # the tooling scans all .gln files
│       │                           # regardless of directory structure.
│       ├── .graphlang/
│       │   ├── gen/
│       │   │   ├── types.gen.ts          # Generated entity/enum types
│       │   │   ├── contracts.gen.ts      # Generated compute/adapter/component signatures
│       │   │   ├── validators.gen.ts     # Generated runtime validators
│       │   │   └── registry.gen.ts       # Generated implementation bindings
│       │   └── manifest.json             # Node ID → impl file mapping + hashes
│       ├── entities/               # Entity & enum declarations
│       │   ├── user.gln
│       │   ├── product.gln
│       │   ├── order.gln
│       │   ├── order_item.gln
│       │   ├── order_status.gln       # Tagged enum
│       │   └── payment_result.gln     # Tagged enum
│       ├── behaviors/              # Behavior declarations
│       │   ├── update_email.gln
│       │   ├── update_password.gln
│       │   └── place_order.gln
│       ├── projections/            # Projection declarations
│       │   ├── profile_edit.gln
│       │   ├── storefront.gln
│       │   └── admin_dashboard.gln
│       ├── policies/               # Policy declarations
│       │   ├── owner_access.gln
│       │   └── public_read_products.gln
│       ├── constraints/            # Constraint declarations
│       │   ├── is_owner.gln
│       │   └── email_is_valid.gln
│       ├── compute/                # Compute module declarations
│       │   ├── hash_password.gln
│       │   └── calculate_order_total.gln
│       ├── adapters/               # Adapter declarations
│       │   ├── stripe_payments.gln
│       │   └── email_sender.gln
│       ├── components/             # Component declarations
│       │   ├── chart.gln
│       │   └── drag_drop_list.gln
│       ├── styles/                 # CSS source files
│       │   ├── theme.css            # Design tokens, base styles
│       │   ├── layout.css           # Page, grid, card styles
│       │   ├── forms.css            # Field, action, form styles
│       │   └── transitions.css      # Enter/exit/match animations
│       ├── impl/                    # Implementation files (not .gln)
│       │   ├── compute/              # TypeScript compute modules
│       │   │   ├── hash_password.ts
│       │   │   ├── verify_password.ts
│       │   │   ├── calculate_order_total.ts
│       │   │   ├── calculate_discount.ts
│       │   │   ├── validate_password_strength.ts
│       │   │   ├── format_currency.ts
│       │   │   ├── sales_sparkline.ts    # Render compute (returns SVG markup)
│       │   │   └── markdown_to_html.ts   # Render compute (returns HTML)
│       │   ├── adapters/              # Adapter implementations
│       │   │   ├── stripe_payments.ts
│       │   │   ├── email_sender.ts
│       │   │   └── analytics.ts
│       │   └── components/           # Component TS implementations
│       │       ├── chart.ts
│       │       ├── drag_drop_list.ts
│       │       ├── rich_text_editor.ts
│       │       └── data_table.ts
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

### Graph Model (Primary)

1. Full application architecture (entities, relationships, behaviors, projections, policies, adapters, components, listeners) is representable as a typed graph in SQLite
2. `graphlang show`, `graphlang trace`, `graphlang deps`, and `graphlang impact` commands return correct, structured output
3. AI can query graph structure to understand architecture without reading source files — dependency analysis, blast radius, and data flow tracing all work through CLI commands
4. The graph is the single source of truth — every tool (type checker, compiler, runtime, CLI) reads from the same SQLite store

### Type System (Primary)

5. Type checker catches renamed fields, mismatched params, wrong types, missing required fields, invalid traversals — all with specific error messages
6. Error messages include: what's wrong, where, what was expected, what was received, and a fix suggestion
7. AI (Claude) can read error output and fix the graph in ≤2 iterations
8. JSON error output is parseable by AI tooling

### Testing (Primary)

9. Every compute module has tests; full compute test suite completes in under 100ms
10. Type checker tests cover all 10 passes with both valid and invalid fixture graphs
11. Behavior tests cover the happy path and key failure cases without network or disk I/O
12. `graphlang check` (type check + test run) completes in under 3 seconds on the prototype application
13. Watch mode delivers feedback in under 1 second for targeted single-file changes

### Runtime (Secondary)

14. Server renders working HTML from projection nodes
15. Client JS is generated from projections — no hand-written JS
16. Compute modules run identically on server and client (same TypeScript, same runtime)
17. Behaviors execute: preconditions → compute → adapters → mutations → effects
18. Policies enforce access control
19. Components render within projections with typed prop/event bindings validated by the type checker
20. Adapter calls in behaviors execute with typed contracts and proper error handling
21. Render compute modules inject format-typed, sanitized markup into projections

### Impurity Tracking

22. Impurity audit identifies all impurity sources with zero false negatives — every adapter call, component usage, `render(raw)` directive, and `json` type hole is reported
23. Impurity propagation correctly marks transitive impurity through listener→behavior and projection→behavior chains
24. Generated runtime validators (`validators.gen.ts`) validate adapter outputs against declared types (hard fail in dev/test, configurable in prod)

### Thesis Validation (Ultimate)

25. AI-modified graphs with type checking have a measurably lower error rate than AI-modified React code for equivalent changes

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
15. ~~**Compute contract verification.**~~ **Resolved.** `tsc --noEmit` validates implementations against generated contracts in `contracts.gen.ts`. No custom contract checker needed — TypeScript's own compiler enforces the contracts.
16. **`--strict-purity` flag.** Should there be a CLI flag that promotes `json-type-hole` and `render-raw-unsafe` warnings to errors? Useful for teams that want to enforce purity standards in CI. Prototype: warnings only. Production: opt-in flag.
17. ~~**Runtime adapter validation strictness.**~~ **Resolved.** Generated validators from `validators.gen.ts` validate adapter outputs at runtime. Dev/test: hard fail. Prod: configurable via `--strict-runtime`.
18. **Flat enum to tagged enum migration.** When upgrading a flat `enum(pending, shipped, cancelled)` field to a tagged enum `OrderStatus`, existing `entity_data` rows contain bare strings. The migration tool needs to map `"pending"` → `{ "variant": "Pending" }`. Prototype: wipe and re-seed. Production: automated migration script.
19. **`@default` for tagged enums.** Only fieldless variants should be usable as default values (e.g., `@default(OrderStatus.Pending)`). Variants with required fields cannot be defaults because there's no sensible way to provide field values at declaration time.
20. **Sync rewrite granularity.** When `sync` rewrites a signature, how much context does it preserve? Prototype: regex-based rewrite of the function signature line + import block. Production: TS AST-aware rewrite that preserves comments, formatting, and body exactly.

---

## 16. Future Directions

- **Test DSL** — declare behavior tests directly in `.gln` files with typed fixtures; the type checker validates fixture shapes, the test runner executes them; AI generates tests in the same language as the application
- **Visual graph editor** — drag-and-drop with live type checking
- **AI copilot** — natural language → graph modifications with type checker in the loop
- **Graph diffing** — semantic diffs: "added entity Review with 4 fields"
- **Compute module sandboxing** — V8 isolates for stronger purity guarantees beyond lint rules
- **Ahead-of-time compilation** — projections → optimized React/Svelte
- **Multi-tenant** — graph-level isolation
- **Compute in other languages** — optional Wasm target for performance-critical compute modules (Rust, Go)
- **Import from existing codebases** — analyze and generate equivalent `.gln`
- **Component registry** — community-published components with typed contracts (npm-like ecosystem for GraphLang UI primitives)
- **Adapter library** — pre-built typed adapter definitions for common services (Stripe, Twilio, SendGrid, AWS S3, Google Maps, etc.)
- **Adapter codegen** — generate typed adapter declarations from OpenAPI/Swagger specs automatically
- **Render compute library** — pre-built TypeScript modules for common rendering (markdown, syntax highlighting, SVG charts, QR codes)
- **Generic enums** — parameterized tagged enums like `Result<T, E>` and `Option<T>` for representing fallible operations and optional values in the type system; requires generics support in the type checker
- **Cross-graph composition** — import entities, components, and adapters from other GraphLang projects as typed dependencies
- **Record type inference** — when a behavior creates an object literal, infer the record type and validate downstream usage without requiring explicit type annotation
- **Generic record types** — parameterized record types for components that work with any data shape: `component data_table<T extends record({ id: uuid })>` where T is the row type
- **Entity-to-record coercion** — automatic structural compatibility checking when passing entity data where a record type is expected, eliminating manual mapping
- **Impurity budget** — CI-enforced threshold for pure coverage percentage (e.g., "pure coverage must be ≥ 70%"); fail the build if impurity grows beyond the budget
- **Adapter mock contracts** — generate typed mock implementations from adapter declarations for testing; behaviors that call adapters can be tested without real external services by using mocks that satisfy the declared output types
- **json elimination tooling** — AI-assisted migration from `json`-typed fields to `record({...})` types; analyze runtime data to infer record shapes, suggest replacements, and validate that all downstream usages would remain compatible
- **Automated body generation** — AI generates implementation bodies during `sync` when stubs are created, using graph context (entity types, constraints) as prompt input
- **Implementation diffing** — `graphlang sync --dry-run` shows what would change without writing files
