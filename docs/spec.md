# GraphLang: An AI-Native Application Framework

## Specification v0.8

**Author:** Mark Glenn

**Purpose:** Build a working prototype of an AI-native application framework. The core thesis: applications defined as typed directed acyclic graphs (DAGs) are more reliably authored and modified by AI than traditional codebases. The type system provides immediate, precise, actionable error feedback. The framework handles two concerns and only two: typed nodes (TypeScript functions) and typed flows (`.gln` wiring). Everything else — persistence, HTTP, email, rendering — lives in libraries.

---

## 1. Vision & Core Thesis

### The Problem: AI Can't See Architecture

AI is remarkably good at writing individual functions. It struggles with _systems_ — the connections between functions, the data flowing across boundaries, the downstream consequences of a change.

The root cause isn't AI capability. It's that traditional codebases hide architecture:

**Architecture is implicit and scattered.** In a typical application, "what happens when a user checks out" spans dozens of files across multiple layers — route handlers, middleware, service classes, database queries, queue producers, email templates. Understanding the full flow requires reading all of them. Modifying it safely requires understanding which of those files depend on which others.

**AI context windows are finite.** A 2,000-file application can't fit in any context window. The AI has to guess which files are relevant, read a subset, infer relationships from import chains and naming conventions, and hope it found everything. It usually hasn't. The files it missed are where the bugs hide.

**Changes cascade invisibly.** Rename a field on an entity. Which API endpoints break? Which downstream services consume that field? Which flows depend on it? In a traditional codebase, answering this requires a full-text search across every file, manual interpretation of each match, and judgment about whether the match is a real dependency or a coincidence. AI does this poorly because the answer isn't in any single file — it's in the _relationships between_ files, and those relationships aren't written down anywhere.

**Errors arrive late and vague.** When the AI gets something wrong, the feedback is a runtime crash, a failing integration test, or a user bug report — not a precise "you changed X, which broke Y because Z expected a number but got a string." The AI can't self-correct from vague feedback.

These problems compound at scale. A 50-file project is manageable. A 2,000-file project is where AI assistance becomes both most valuable and least reliable.

### The Thesis: Make Architecture Queryable

GraphLang externalizes application architecture into a typed, queryable graph. Instead of inferring relationships by reading source files, AI queries the graph directly:

```bash
# "What breaks if I rename this field?"
$ graphlang impact calculate_shipping
Used in flows: checkout, cart_updated, stock_changed/update_cart
Downstream nodes: estimate_delivery (reads shipping_cost)
Triggers affected: http.post("/checkout"), http.post("/cart/update")

# "What does this node need, and where does each field come from?"
$ graphlang context checkout charge_payment
charge_payment needs:
  discounted_total  ← apply_member_discount (step 4)
  tax_amount        ← calculate_alcohol_tax (step 6)
  shipping_cost     ← calculate_shipping (step 7)
  payment_token     ← CheckoutInput (flow input)

# "Show me the full checkout flow with types at each step"
$ graphlang trace checkout
  verify_age             [may short-circuit: ok/error]  needs: { user }
  → calculate_cart_total                                needs: { cart }
  → apply_case_discount                                 needs: { cart, subtotal }
  → ...
```

These queries run against a SQLite graph — they're instant, complete, and precise. The AI doesn't load 2,000 files into its context. It loads the answer to a specific architectural question.

**This is the core bet: AI that can query architecture is fundamentally more reliable than AI that must infer it.** The graph makes the blast radius of any change knowable before making it. The type checker makes every mistake catchable with specific, actionable feedback. Together, they close the loop that traditional codebases leave open.

### No Human Authors

GraphLang is not designed for humans to read or write. It is designed for AI to read and write, and for humans to direct.

Humans interact through natural language ("add age verification before checkout") or through a visual editor (drag a node into a flow). The AI translates intent into `.gln` files and TypeScript functions. The type checker validates the result. The human sees the outcome — a working application, a visual flow diagram, a failing type error — and gives the next instruction.

The text files exist because they're the best format for AI to manipulate and for git to version — not because anyone is expected to hand-author them. The `.gln` syntax doesn't need to be human-ergonomic. It needs to be unambiguous, parseable, and diffable. TypeScript was chosen because AI writes it reliably, not because developers prefer it.

This framing drives every design decision:

- **The type checker is the AI's feedback loop**, not a developer tool. Its errors are structured for machine consumption (JSON output, error codes, fix suggestions).
- **CLI query commands are the AI's read interface**, not a developer convenience. `graphlang context checkout charge_payment` gives the AI exactly the information it needs to make a safe modification.
- **The visual editor is the human's interface** to the application. Humans see flows as diagrams, inspect nodes by clicking, and direct changes in natural language. The underlying `.gln` and `.ts` files are an implementation detail.
- **Git diffability matters** because AI makes frequent, incremental changes. Text files diff cleanly, merge predictably, and maintain history. A proprietary binary format (like most low-code platforms use) would make version control useless.

### What GraphLang Is (and Isn't)

GraphLang is a typed DAG framework. It handles two concerns:

1. **Nodes** — TypeScript functions that do work. Pure functions are synchronous. Impure functions (I/O, external services) are asynchronous. TypeScript's own type system defines the contracts.

2. **Flows** — `.gln` files that wire nodes into typed DAGs. Each flow defines which nodes run, in what order, and how data routes between them. Every flow declares its input and output types. The type checker validates every connection.

The graph is NOT Turing complete on its own, and that's by design. The graph excels at structure and flow. TypeScript functions excel at computation. Each does what it's best at.

Everything else — persistence, HTTP, email, rendering — lives in libraries. GraphLang doesn't try to be a web framework. It's the typed wiring layer that makes AI modification safe.

### Why a Graph

In a traditional codebase, answering "what depends on this?" requires reading source files. In a GraphLang project, it's a SQL query:

```sql
-- Every flow that uses calculate_shipping
SELECT f.id FROM nodes f
JOIN edges e ON e.from_node = f.id
WHERE f.type = 'flow' AND e.to_node = 'calculate_shipping';

-- Every node downstream of calculate_shipping in the checkout flow
SELECT n.id FROM edges e
JOIN nodes n ON n.id = e.to_node
WHERE e.type = 'flow_step' AND e.properties->>'flow_id' = 'checkout'
AND e.properties->>'step_order' > (
  SELECT e2.properties->>'step_order' FROM edges e2
  WHERE e2.to_node = 'calculate_shipping'
  AND e2.properties->>'flow_id' = 'checkout'
);
```

The graph makes relationships _data_ — queryable, traversable, indexable. Every architectural question the AI needs to answer is a query, not a search.

**The AI emits TypeScript functions + `.gln` flow definitions. It queries the graph to understand context. The type checker tells it exactly what's wrong.**

### Two File Types, One Graph

| File Type | Contains                                      | Source of Truth For                         |
| --------- | --------------------------------------------- | ------------------------------------------- |
| `.ts`     | Entities (interfaces), Nodes (functions)      | Types, signatures, implementations          |
| `.gln`    | Flows (DAG wiring), Triggers (event bindings) | Structure, ordering, branching, composition |

TypeScript is the single source of truth for types. The tooling uses the TypeScript Compiler API (`ts.createProgram`) to extract interfaces and function signatures into the graph. No type declarations are duplicated in `.gln` files. The `.gln` files reference nodes by name — the type checker resolves those names against the extracted signatures in the graph.

### Purity Model

Purity is inferred from the function signature, not annotated:

- **Synchronous functions are intended to be pure.** The toolchain enforces a best-effort purity lint for sync nodes: no `fetch`, `fs`, `Math.random()`, `Date.now()`, mutable module-level state, or other known impurity sources. This is a convention backed by linting, not a language guarantee — TypeScript/JavaScript cannot prevent all side effects statically.
- **Asynchronous functions are assumed impure.** They typically perform I/O — database queries, HTTP calls, email sends. An async function _can_ be pure (e.g., `async` for API consistency), but the toolchain treats it as impure to be conservative.

The tooling detects sync vs async from the return type (`T` vs `Promise<T>`). No `@pure` or `@impure` annotations exist. The return type is the primary signal; the lint pass is the secondary guard.

### The AI Interaction Model

The AI is the sole author of all code. Humans provide intent ("add age verification before checkout"); the AI translates that into graph modifications. The interaction cycle has three phases: **Write**, **Query**, and **Validate**.

**Write.** The AI generates `.ts` files (entities and nodes) and `.gln` files (flows and triggers). No human writes or edits these files directly.

**Query.** Before making changes, the AI queries the graph to understand what exists and what a change will affect:

- `graphlang show <node>` — full node with edges and resolved types
- `graphlang deps <node>` — what this node depends on
- `graphlang impact <node>` — what depends on this node (blast radius)
- `graphlang trace <flow>` — full path through a flow with types at each step
- `graphlang context <flow> <node>` — what fields are available in the accumulated context at a given node

These commands read from SQLite and return structured output. The AI doesn't need to parse source files to understand architecture — it queries the graph directly.

**Validate.** Two checkers run in tandem:

1. `graphlang check` — validates the graph: accumulated context types at each node, discriminated union branch coverage, flow composition types, fan-out element types, trigger payload types.
2. `tsc --noEmit` — validates implementations: function bodies are correct TypeScript.

Graph errors mean fixing `.gln` files or node signatures. TypeScript errors mean fixing `.ts` function bodies.

### Testability by Design

The type checker catches structural errors. Tests catch behavioral errors. Together they form the complete feedback loop that makes AI-assisted development reliable.

- **Pure nodes are pure functions.** No side effects, no external state. Call them with inputs, assert the outputs. Tests require zero setup and zero teardown.
- **Flows are typed DAGs.** Each step is testable in isolation (unit test the node) or as a pipeline (integration test the flow with mocked impure nodes).
- **The graph is a query target.** SQLite in-memory is the test substrate. No disk, no network.

The feedback loop target: **under 1 second after every save**, with a ceiling of **3 seconds on large projects**. This is a first-class design constraint. Architecture decisions — synchronous SQLite access, pure functions, in-memory test isolation, incremental type checking — are all made with this target in mind.

### What This Prototype Should Prove

1. AI can build and maintain a full application through graph queries + type checker feedback alone — no human code review required for correctness
2. The graph externalizes application architecture in a form AI can query without loading the full codebase into context
3. The type system catches cross-boundary errors (context field missing, type mismatch, branch not handled)
4. Error feedback is specific enough that AI can self-correct in 1-2 iterations without human intervention
5. Discriminated unions + accumulated context handle all real control flow patterns
6. Flow composition scales — large applications decompose into small, reusable flows
7. The type check + test feedback loop completes in under 3 seconds
8. A visual editor can render `.gln` flows as diagrams, making the underlying text files invisible to human operators

---

## 2. Architecture Overview

The graph is the hub. Every tool in the pipeline — the TypeScript extractor, `.gln` parser, type checker, and CLI query commands — reads from the same SQLite graph store. TypeScript files are analyzed for signatures; `.gln` files are parsed for flow structure; both are stored as nodes and edges in the graph.

```
┌─────────────────────────────────────────────────────────┐
│                     Source Files                        │
│                                                         │
│  .ts files                          .gln files          │
│  (entities: interfaces,             (flows: DAG         │
│   nodes: functions)                  wiring, triggers)  │
└──────────┬──────────────────────────────┬───────────────┘
           │                              │
           │ ts.createProgram             │ .gln parser
           │ (extract signatures)         │ (parse flows)
           │                              │
           ▼                              ▼
    ┌──────────────────────────────────────────────┐
    │              Graph Store (SQLite)            │
    │                                              │
    │  nodes: entities, functions, flows           │
    │  edges: flow steps, branches, fan-outs       │
    │                                              │
    │  Accumulated context types computed per-node │
    └──────────────────┬───────────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────────┐
    │              Type Checker                    │
    │                                              │
    │  For each flow:                              │
    │  • Build accumulated context at each step    │
    │  • Validate node inputs exist in context     │
    │  • Validate discriminated union branches     │
    │  • Validate branch reconvergence             │
    │  • Validate fan-out element types            │
    │  • Validate flow composition types           │
    │  • Validate trigger payload types            │
    │                                              │
    │  Output: errors[] OR valid graph             │
    └──────────────────┬───────────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────────┐
    │              CLI / Query / Runtime           │
    │                                              │
    │  graphlang check    — validate everything    │
    │  graphlang show     — inspect a node         │
    │  graphlang deps     — dependency analysis    │
    │  graphlang impact   — blast radius           │
    │  graphlang trace    — flow path + types      │
    │  graphlang context  — context at a node      │
    │  graphlang dev      — watch mode             │
    └──────────────────────────────────────────────┘
```

### Why SQLite

SQLite isn't chosen for persistence or performance — it's chosen because it's a **query engine for the graph**.

The type checker, dependency analyzer, and CLI query commands all need to ask questions about the graph's structure. These questions are graph traversal queries, and SQL is excellent at expressing them:

```sql
-- "What fields are available in the context at node X in flow Y?"
WITH RECURSIVE flow_path(node_id, step_order) AS (
  SELECT first_node, 0 FROM flows WHERE id = 'checkout'
  UNION ALL
  SELECT e.to_node, fp.step_order + 1
  FROM flow_path fp
  JOIN edges e ON e.from_node = fp.node_id AND e.type = 'flow_step'
  WHERE fp.node_id != 'charge_payment'  -- stop at target
)
SELECT n.id, n.properties FROM flow_path fp
JOIN nodes n ON n.id = fp.node_id;

-- "What flows use this node?"
SELECT f.id FROM nodes f
JOIN edges e ON e.from_node = f.id
WHERE f.type = 'flow' AND e.to_node = 'calculate_cart_total';

-- "What breaks if I change the output type of calculate_shipping?"
SELECT DISTINCT f.id as flow, n.id as downstream_node
FROM edges e1
JOIN edges e2 ON e2.from_node = e1.from_node AND e2.type = 'flow_step'
JOIN nodes n ON n.id = e2.to_node
JOIN nodes f ON f.id = e1.from_node
WHERE e1.to_node = 'calculate_shipping' AND e1.type = 'flow_step'
AND e2.properties->>'step_order' > e1.properties->>'step_order';
```

With an in-memory graph (Map + Array), each of these queries is custom traversal code. With SQLite, every new query is just SQL. As the type checker grows more sophisticated, you add queries, not code.

Additional benefits:

- SQLite's `json_extract` functions let you query into node properties stored as JSON
- WAL mode with `better-sqlite3` (synchronous, not async) gives in-memory speed with SQL queryability
- The graph is small enough to fit entirely in SQLite's cache
- `ts.createWatchProgram` for incremental TypeScript extraction, feeding incremental SQLite updates

---

## 3. Nodes

Nodes are TypeScript functions. The tooling extracts function names, input types, and output types using the TypeScript Compiler API.

### 3.0 Node Discovery

By default, the tooling scans `nodes/` and `entities/` directories (recursively) for exported functions and interfaces. This prevents helper utilities, test fixtures, and library re-exports from polluting the graph.

The scan scope is configurable in `graphlang.config.json`:

```json
{
  "include": ["nodes/**/*.ts", "entities/**/*.ts"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

A `--scan-all` flag is available for projects that prefer to organize differently, but the default convention keeps the graph clean — which is critical for AI, since every node in the graph is a node the AI considers when building or modifying flows.

### 3.1 Anatomy of a Node

```typescript
// Pure node — synchronous, no I/O
export function calculate_cart_total(input: { cart: Cart }): {
  subtotal: number;
} {
  const subtotal = input.cart.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  return { subtotal: Math.round(subtotal * 100) / 100 };
}
```

```typescript
// Impure node — asynchronous, performs I/O
export async function charge_payment(input: {
  discounted_total: number;
  tax_amount: number;
  shipping_cost: number;
  payment_token: string;
}): Promise<
  { ok: true; charge_id: string; total: number } | { ok: false; error: string }
> {
  const total =
    Math.round(
      (input.discounted_total + input.tax_amount + input.shipping_cost) * 100,
    ) / 100;
  // Would call payment processor
  throw new Error("not implemented — requires payment provider");
}
```

### 3.2 Conventions

- Every node exports exactly one function
- The function takes a single `input` object parameter (or no parameters)
- The function returns a single object (or a discriminated union of objects)
- Sync nodes are intended to be pure (enforced by lint); async nodes are assumed impure
- The function name is the node's identity in the graph and in `.gln` files
- Nodes can import from any npm package — libraries provide capabilities, not a plugin system

### 3.3 Discriminated Unions

Nodes that need to branch return discriminated unions. The discriminant field determines which path the flow takes:

```typescript
// Branch on product type
export async function classify_product(input: {
  product_id: string;
}): Promise<
  | { type: "single_bottle"; product: Wine }
  | { type: "wine_pack"; pack: WinePack; bottles: Wine[] }
> { ... }
```

```typescript
// Branch on success/failure
export async function check_stock(input: {
  product_id: string;
  quantity: number;
}): Promise<
  | { ok: true; product_id: string; quantity: number }
  | { ok: false; error: string }
> { ... }
```

The type checker knows which fields are available in each branch. The `single_bottle` branch has `product: Wine` in context. The `wine_pack` branch has `pack: WinePack` and `bottles: Wine[]`. The `ok: true` branch has `charge_id: string` and `total: number`. The `ok: false` branch has `error: string`.

### 3.4 Signature Extraction

The tooling uses the TypeScript Compiler API to extract node signatures:

```typescript
import * as ts from "typescript";

// Initial extraction
const program = ts.createProgram(files, compilerOptions);
const checker = program.getTypeChecker();

// For each exported function:
// - Extract function name → node ID
// - Extract input parameter type → node input schema
// - Extract return type → node output schema (including union variants)
// - Detect async → mark as impure

// Incremental updates (watch mode)
const host = ts.createWatchCompilerHost(configPath, {}, ts.sys, ...);
ts.createWatchProgram(host);
// On file change: re-extract only changed signatures, update graph
```

This is fast. The TypeScript Compiler API parses and type-checks incrementally. Only changed files are re-analyzed. The extracted signatures are stored as JSON in the graph's `nodes` table.

---

## 4. Entities

Entities are TypeScript interfaces. They define data shapes — no behavior, no persistence, no relationships. They're imported by nodes that need them.

```typescript
// entities/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  date_of_birth: string;
  membership_tier: "none" | "silver" | "gold" | "platinum";
  state: string;
}
```

```typescript
// entities/order.ts
import type { CartItem } from "./cart";

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  items: CartItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_cost: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  created_at: string;
}
```

The tooling extracts interfaces the same way it extracts function signatures — using the TypeScript Compiler API. Entity interfaces become nodes in the graph with their field types stored as properties. When a node's input references `User`, the type checker resolves it against the extracted interface.

Entities don't have relationships declared on them. Relationships are implicit in the data (e.g., `Order.user_id` references a `User`). The graph captures structural relationships through the flow edges — which nodes consume which entity types.

---

## 5. Flows

Flows are the heart of GraphLang. A `.gln` file defines a typed DAG: which nodes run, in what order, and how data routes between them.

### 5.1 Syntax

```
flow <name>
  input <TypeName>
  output <TypeName>

  <node>
  → <node>
  → <node>
end
```

Every flow declares its input and output types by referencing TypeScript types. The `→` operator connects nodes sequentially. The output of one node feeds into the accumulated context for the next.

The type checker validates both directions:

- **External**: does the trigger/caller provide the declared input type? Does the consumer expect the declared output type?
- **Internal**: is the declared input sufficient for every node in the flow? Does the final accumulated context satisfy the declared output?

#### Linear Flow

```
flow cart_updated
  input CartUpdatedInput
  output CartUpdatedOutput

  calculate_cart_total
  → apply_case_discount
  → calculate_shipping
  → estimate_delivery
end
```

#### Branching

When a node returns a discriminated union, branches route on the discriminant:

```
flow add_to_cart
  input AddToCartInput
  output AddToCartOutput

  classify_product
    | single_bottle → check_stock → add_bottle_to_cart
    | wine_pack → check_pack_stock → add_pack_to_cart
  → calculate_cart_total
  → apply_case_discount
  → calculate_shipping
end
```

After the branch, the flow reconverges at `calculate_cart_total`. The type checker applies **strict reconvergence**: only fields present in the output of _every_ branch are available in the post-reconvergence context. Fields that exist in some branches but not others are dropped.

This means if the `single_bottle` branch adds `{ product: Wine }` and the `wine_pack` branch adds `{ pack: WinePack }`, neither `product` nor `pack` exist after reconvergence — only fields common to both branches survive. If the downstream node needs data from both branches, a "normalize" node at the end of each branch must produce a common output shape.

Strict reconvergence is intentional: it forces explicit data harmonization rather than silently introducing optional fields. This makes flows predictable for AI — every field in the context is guaranteed to exist, not "maybe present depending on which branch ran."

#### Branching into Sub-Flows

When branches don't reconverge — when each branch is a distinct path to completion — use sub-flows:

```
flow checkout
  input CheckoutInput
  output CheckoutOutput

  verify_age
  → calculate_cart_total
  → apply_case_discount
  → apply_member_discount
  → get_tax_rate
  → calculate_alcohol_tax
  → calculate_shipping
  → generate_order_number
  → charge_payment
    | ok → checkout_success
    | error → checkout_payment_failed
end

flow checkout_success
  input CheckoutSuccessInput
  output CheckoutSuccessOutput

  reserve_stock
  → build_order
  → emit order.placed
end

flow checkout_payment_failed
  input CheckoutPaymentFailedInput
  output CheckoutPaymentFailedOutput

  release_stock
end
```

Sub-flows in the same file are private to that file — they're composition units, not independently triggerable flows. Each still declares its own input/output contract. The type checker validates that the branch's accumulated context satisfies the sub-flow's declared input type.

#### Error Short-Circuit

When a node returns a discriminated union on `ok` (i.e., `{ ok: true; ... } | { ok: false; error: string }`) and the flow has no explicit `| error` branch, the flow short-circuits automatically — it stops and returns the error to the caller. This is railway-oriented programming: the happy path is explicit, errors propagate implicitly unless handled.

**The `ok` discriminant is special.** Only unions discriminated on `ok: true | false` participate in automatic short-circuit. Other discriminants (like `type: "single_bottle" | "wine_pack"`) require explicit branches — unhandled variants are a type error, not an implicit exit.

```
flow checkout
  verify_age           # returns ok/error — unhandled error stops here
  → calculate_cart_total
  → ...
end
```

If `verify_age` returns `{ ok: false, error: "Must be 21..." }`, the flow stops. No `calculate_cart_total` runs. The error propagates to whoever triggered the flow.

**Short-circuit points are visible.** `graphlang trace` annotates every node that may short-circuit:

```
$ graphlang trace checkout
  verify_age            [may short-circuit: ok/error]
  → calculate_cart_total
  → apply_case_discount
  → ...
  → charge_payment      [branches: ok → checkout_success, error → checkout_payment_failed]
```

This keeps the "no hidden control flow" principle intact — the graph _does_ have implicit exits, but they are always visible through tooling, never require inference.

#### Early Return

The `done` built-in stops the flow and returns success:

```
flow get_cart_summary
  input GetCartSummaryInput
  output GetCartSummaryOutput

  check_cache
    | hit → done
    | miss → load_cart → calculate_cart_total → calculate_shipping
end
```

The type checker validates that the `done` branch's context satisfies the flow's declared output type, same as the other branch.

### 5.2 Flow Composition

Flows compose. A flow can call another flow as if it were a node. The called flow's declared `input` type is what it needs from the context; its declared `output` type is what it adds back.

```
flow checkout
  input CheckoutInput
  output CheckoutOutput

  verify_age
  → add_to_cart       # this is a flow, not a node — same syntax
  → charge_payment
  ...
end
```

From the caller's perspective there's no difference — the called flow's `input`/`output` declarations work exactly like a node's input/output types. The type checker validates them the same way.

### 5.3 Fan-Out

When a node returns a list and each item needs the same processing, use `fan_out(field, flow)`:

```
flow stock_changed
  input StockChangedInput
  output StockChangedOutput

  find_affected_carts
  → fan_out(carts, update_cart)
end

flow update_cart
  input UpdateCartInput
  output UpdateCartOutput

  remove_unavailable_items
  → calculate_cart_total
  → calculate_shipping
  → notify_user
end
```

`fan_out` takes a field name (the list to iterate) and a flow to run for each item. The type checker validates that the field is a list of `T` and `T` satisfies the target flow's declared input type.

Each iteration is independent — if one fails, the rest still process. Errors are collected and returned as a list.

### 5.4 Events and Triggers

Flows don't know what triggered them. They receive typed inputs. Triggers are declared separately, binding an event to a flow:

```
on http.post("/cart/add") → add_to_cart
on http.post("/cart/update") → cart_updated
on http.post("/checkout") → checkout

on event(stock.changed) → stock_changed
on event(order.placed) → send_order_confirmation

on schedule("0 3 * * *") → cleanup_abandoned_carts
```

The type checker validates that the trigger payload matches the flow's expected input context.

**Emit.** Flows can emit events. Handlers pick them up independently. The emitted event payload is validated against the flow's declared output type.

```
on event(order.placed) → send_order_confirmation
on event(order.placed) → update_analytics
```

Multiple handlers on the same event is fine. Each is an independent flow. `emit` takes the event name and includes the current accumulated context as the event payload.

### 5.5 Complete `.gln` Grammar

```
file         = (flow | trigger)*
flow         = "flow" IDENT input_decl output_decl step+ "end"
input_decl   = "input" TYPE_IDENT
output_decl  = "output" TYPE_IDENT
step         = node_ref | "→" node_ref | branch | "→" emit
node_ref     = IDENT
branch       = "|" IDENT "→" (node_ref ("→" node_ref)* | "done")
emit         = "emit" EVENT_NAME
trigger      = "on" trigger_source "→" IDENT
trigger_source = http_trigger | event_trigger | schedule_trigger
http_trigger = "http." METHOD "(" STRING ")"
event_trigger = "event(" EVENT_NAME ")"
schedule_trigger = "schedule(" STRING ")"
fan_out      = "fan_out(" IDENT "," IDENT ")"

IDENT        = [a-z_][a-z0-9_]*
TYPE_IDENT   = [A-Z][a-zA-Z0-9]*
EVENT_NAME   = IDENT ("." IDENT)*
METHOD       = "get" | "post" | "put" | "delete" | "patch"
STRING       = '"' [^"]* '"'
```

Comments use `#` and extend to end of line.

---

## 6. Data Flow: Accumulated Context

Each flow maintains a **context object** that grows as nodes execute. This is the data flow model — there are no explicit variable bindings in `.gln` files.

### 6.1 How It Works

1. The flow starts with its declared `input` type as the initial context
2. Each node's input fields are pulled from the current context
3. Each node's output fields are merged back into the context
4. The type checker validates that every node's required input fields exist in the context at that point in the flow
5. At the end of the flow, the type checker validates that the accumulated context satisfies the declared `output` type

### 6.2 Example: Checkout Flow

Tracing through the checkout flow:

```
flow checkout
  input CheckoutInput            # { user, cart, payment_token }
  output CheckoutOutput

  verify_age                    # needs: { user }
  → calculate_cart_total        # needs: { cart }
  → apply_case_discount         # needs: { cart, subtotal }
  → apply_member_discount       # needs: { discounted_total, user }
  → get_tax_rate                # needs: { user }
  → calculate_alcohol_tax       # needs: { discounted_total, tax_rate }
  → calculate_shipping          # needs: { cart }
  → generate_order_number       # needs: nothing
  → charge_payment              # needs: { discounted_total, tax_amount, shipping_cost, payment_token }
    | ok → checkout_success
    | error → checkout_payment_failed
end
```

The context evolves:

| After Node                   | Context Adds                                       | Cumulative Context                           |
| ---------------------------- | -------------------------------------------------- | -------------------------------------------- |
| _(input)_                    | `user`, `cart`, `payment_token`                    | `{ user, cart, payment_token }`              |
| `verify_age`                 | `ok: true`                                         | `{ user, cart, payment_token }`              |
| `calculate_cart_total`       | `subtotal`                                         | `{ user, cart, payment_token, subtotal }`    |
| `apply_case_discount`        | `discount_amount`, `discounted_total`              | `{ ..., discount_amount, discounted_total }` |
| `apply_member_discount`      | `member_discount`, `discounted_total` (overwrites) | `{ ..., member_discount }`                   |
| `get_tax_rate`               | `tax_rate`                                         | `{ ..., tax_rate }`                          |
| `calculate_alcohol_tax`      | `tax_amount`                                       | `{ ..., tax_amount }`                        |
| `calculate_shipping`         | `shipping_cost`                                    | `{ ..., shipping_cost }`                     |
| `generate_order_number`      | `order_number`                                     | `{ ..., order_number }`                      |
| `charge_payment` (ok branch) | `charge_id`, `total`                               | `{ ..., charge_id, total }`                  |

### 6.3 Name Collisions

Last write wins. If `apply_case_discount` outputs `discounted_total` and then `apply_member_discount` also outputs `discounted_total`, the second value overwrites the first. The type checker **warns on shadowing** so the developer is aware, but it's not an error — it's a common pattern for progressive refinement.

**Recommended convention:** For nodes that output domain-specific results, prefer structured output keys — e.g., `{ shipping: { cost, method } }` or `{ tax: { rate, amount } }` — over flat field names. This reduces accidental collisions as flows grow. Flat fields like `subtotal` or `discount_amount` are fine for simple, unambiguous values.

This is a style recommendation, not a language requirement. The type checker warns on shadowing regardless of naming style. But projects that follow this convention will have fewer "it type-checks but it's wrong" failures, which is the hardest class of bug for AI to catch.

### 6.4 Type Checker Responsibilities

For each flow, the type checker:

1. **Resolves the initial context** from the flow's declared `input` type
2. **At each node**, verifies that every required input field exists in the current context with a compatible type
3. **After each node**, merges the output fields into the context
4. **At branches**, splits the context — each branch gets the context plus the branch-specific fields from the discriminated union
5. **At reconvergence**, computes the strict intersection of branch contexts — only fields present in all branches survive; drops branch-specific fields
6. **At `fan_out`**, validates the iterated field is a list and the target flow accepts the element type
7. **At `emit`**, records the event payload type for trigger validation
8. **At flow end**, validates that the accumulated context satisfies the flow's declared `output` type
9. **At `done`**, validates that the context at that point satisfies the flow's declared `output` type

---

## 7. The Type System

### 7.1 Philosophy

Every edge in the graph is a typed contract. When node A connects to node B in a flow, the type system verifies that A's output provides what B's input requires — not by direct wiring, but through the accumulated context.

The type system is:

- **Structural.** Types are defined by their shape. If node B needs `{ cart: Cart }` and the context contains `cart: Cart`, it matches.
- **Complete.** Every node connection, every branch, every fan-out, every trigger — all type-checked.
- **Specific in errors.** Every error includes: what went wrong, where (flow, node, field), what was expected, what was received, and a suggestion for fixing it.
- **Exhaustive.** The type checker collects ALL errors before reporting, not just the first one. AI works better when it can see all problems at once.

### 7.2 Type Checking Passes

The type checker runs the following passes:

1. **Node signature validation** — every function exported from `.ts` files has valid input/output types, follows conventions (single object arg, object return)
2. **Entity integrity** — interfaces are valid, no circular references that can't be resolved
3. **Flow structure** — every node referenced in a `.gln` file exists in the graph, flows are acyclic, branches reference valid discriminant values, `input` and `output` types resolve to valid TypeScript types
4. **Flow contracts** — the declared `input` type is sufficient for every node in the flow; the final accumulated context satisfies the declared `output` type
5. **Accumulated context** — at each step in every flow, the node's input fields exist in the context with compatible types
6. **Branch validation** — non-`ok` discriminated unions require exhaustive branches (all variants handled); `ok`-discriminated unions allow implicit short-circuit on `ok: false`; reconverging branches use strict intersection for post-reconvergence context
7. **Fan-out validation** — the iterated field is a list type, the target flow's declared `input` type accepts the element type
8. **Flow composition** — when a flow calls another flow, the context satisfies the sub-flow's declared `input` type, and the sub-flow's declared `output` type merges into the caller's context
9. **Trigger validation** — event/HTTP payloads match the target flow's declared `input` type
10. **Cross-cutting** — orphan nodes (defined but never used in a flow), unused entities, shadowing warnings

### 7.3 Error Format

Every type error includes enough information for AI to self-correct:

```typescript
interface TypeCheckError {
  level: "error" | "warning";
  code: string; // e.g., "MISSING_CONTEXT_FIELD"
  flow: string; // which flow
  node: string; // which node in the flow
  field?: string; // which field is missing/wrong
  message: string; // human-readable description
  expected?: string; // what type was expected
  received?: string; // what type was found (or "missing")
  source_file: string; // .gln or .ts file
  source_line?: number; // line number if applicable
  suggestions: string[]; // concrete fix suggestions
}
```

Example errors:

```json
{
  "level": "error",
  "code": "MISSING_CONTEXT_FIELD",
  "flow": "checkout",
  "node": "calculate_alcohol_tax",
  "field": "tax_rate",
  "message": "Node 'calculate_alcohol_tax' requires 'tax_rate: number' but it is not in the accumulated context at this point",
  "expected": "number",
  "received": "missing",
  "source_file": "flows/checkout.gln",
  "source_line": 7,
  "suggestions": [
    "Add a node that outputs 'tax_rate: number' before 'calculate_alcohol_tax' in the flow",
    "The node 'get_tax_rate' outputs this field — consider adding it upstream"
  ]
}
```

```json
{
  "level": "error",
  "code": "UNHANDLED_BRANCH",
  "flow": "add_to_cart",
  "node": "classify_product",
  "message": "Node 'classify_product' returns a discriminated union on 'type' with variants ['single_bottle', 'wine_pack'] but branch 'wine_pack' is not handled",
  "source_file": "flows/add_to_cart.gln",
  "source_line": 2,
  "suggestions": ["Add a branch: | wine_pack → <handler_node>"]
}
```

### 7.4 JSON Error Output

All errors are also available as JSON for AI tooling:

```bash
graphlang check --format json
```

Returns a JSON array of `TypeCheckError` objects. The AI can parse this output programmatically to determine which files to modify and how.

---

## 8. The Graph Model

The graph is the application's architecture made concrete. Every entity, node, and flow is a graph node. Every flow step, branch, and composition is a graph edge.

### 8.1 Schema

```sql
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,          -- 'entity', 'node', 'flow'
  properties JSON NOT NULL,    -- type-specific data (signatures, fields, etc.)
  source_file TEXT,
  source_line INTEGER
);

CREATE TABLE edges (
  id TEXT PRIMARY KEY,
  from_node TEXT NOT NULL REFERENCES nodes(id),
  to_node TEXT NOT NULL REFERENCES nodes(id),
  type TEXT NOT NULL,          -- 'flow_step', 'branch', 'fan_out', 'triggers', 'emits'
  properties JSON DEFAULT '{}',
  UNIQUE(from_node, to_node, type)
);

CREATE INDEX idx_edges_from ON edges(from_node, type);
CREATE INDEX idx_edges_to ON edges(to_node, type);
CREATE INDEX idx_edges_type ON edges(type);
CREATE INDEX idx_nodes_type ON nodes(type);
```

### 8.2 Node Types

| Type     | Stored Properties                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------- |
| `entity` | Field names, field types, source interface                                                          |
| `node`   | Function name, input type (as JSON schema), output type (including union variants), `pure: boolean` |
| `flow`   | Flow name, node sequence, branch structure                                                          |

### 8.3 Edge Types

| Type        | Meaning                                 | Properties                                            |
| ----------- | --------------------------------------- | ----------------------------------------------------- |
| `flow_step` | Node A precedes Node B in a flow        | `step_order`, `flow_id`                               |
| `branch`    | Flow branches on a discriminant value   | `discriminant_field`, `discriminant_value`, `flow_id` |
| `fan_out`   | Fan-out from a list field to a sub-flow | `field_name`, `flow_id`                               |
| `triggers`  | A trigger activates a flow              | `trigger_type`, `trigger_config`                      |
| `emits`     | A flow emits an event                   | `event_name`                                          |
| `composes`  | A flow calls another flow as a step     | `flow_id`                                             |
| `uses_type` | A node references an entity type        | `field_name`, `usage` (input/output)                  |

### 8.4 Configuration

```typescript
import Database from "better-sqlite3";

const db = new Database(":memory:"); // In-memory for dev/test
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("cache_size = -64000"); // 64MB — entire graph fits in memory
```

---

## 9. Tooling & CLI

### 9.1 Commands

| Command                           | Purpose                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| `graphlang check`                 | Run all type checking passes, report errors                     |
| `graphlang check --format json`   | Errors as JSON for AI consumption                               |
| `graphlang show <name>`           | Display a node/flow with full type information                  |
| `graphlang deps <name>`           | Show what a node/flow depends on                                |
| `graphlang impact <name>`         | Show what depends on a node (blast radius)                      |
| `graphlang trace <flow>`          | Show full flow path with accumulated context types at each step |
| `graphlang context <flow> <node>` | Show the accumulated context at a specific node in a flow       |
| `graphlang dev`                   | Watch mode — incremental type checking on file save             |

### 9.2 Watch Mode (`graphlang dev`)

Watch mode uses two incremental systems working together:

1. **TypeScript Compiler API** (`ts.createWatchProgram`) — watches `.ts` files, re-extracts only changed signatures, updates the graph
2. **`.gln` file watcher** — watches `.gln` files, re-parses only changed flows, updates the graph

On any change:

1. Update the affected nodes/edges in SQLite
2. Determine which type checking passes are affected
3. Re-run only those passes
4. Report errors

Target: feedback in under 1 second for a single-file change.

---

## 10. Extensibility

GraphLang doesn't own persistence, HTTP, email, or any external concern. Libraries provide nodes. GraphLang wires them.

A library is just an npm package that exports typed functions:

```typescript
// From @graphlang/sqlite (hypothetical library)
export async function upsert(input: {
  table: string;
  data: Record<string, unknown>;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  // ...
}
```

A project node can wrap or re-export library functions:

```typescript
import { upsert } from "@graphlang/sqlite";
import type { Cart } from "../entities/cart";

export async function save_cart(input: {
  cart: Cart;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return upsert({ table: "carts", data: input.cart });
}
```

The tooling extracts the function signature, adds it to the graph, detects it's async (impure), and validates the types. No plugin system, no adapter registry. A library is a package. A node is a function. TypeScript types are the contract.

---

## 11. Build Pipeline

```
1. Discover files
   - Glob for .ts and .gln files in the project

2. Extract TypeScript signatures
   - ts.createProgram on all .ts files
   - Extract interfaces → entity nodes
   - Extract exported functions → node nodes
   - Store in SQLite graph

3. Parse .gln files
   - Lex + parse each .gln file
   - Create flow nodes + flow_step/branch/fan_out edges
   - Create trigger edges
   - Store in SQLite graph

4. Type check
   - Run all passes (Section 7.2)
   - Report errors with suggestions

5. (Optional) Bundle for runtime
   - When a runtime is provided (e.g., @graphlang/runtime),
     generate the execution harness from the graph
```

Steps 2 and 3 are independent and can run in parallel.

---

## 12. Testing

### 12.1 Test Layers

| Layer              | What It Tests                                        | Speed                           |
| ------------------ | ---------------------------------------------------- | ------------------------------- |
| Pure node tests    | Individual sync functions with known inputs/outputs  | Microseconds per test           |
| Flow context tests | Type checker correctly computes context at each step | Milliseconds (in-memory SQLite) |
| Integration tests  | Full flow execution with mocked impure nodes         | Milliseconds                    |

### 12.2 Pure Node Tests

Pure nodes are pure functions. Testing them is trivial:

```typescript
import { calculate_cart_total } from "../nodes/calculate_cart_total";
import { describe, it, expect } from "vitest";

describe("calculate_cart_total", () => {
  it("sums item prices", () => {
    const result = calculate_cart_total({
      cart: {
        id: "1",
        user_id: "u1",
        items: [
          {
            product_id: "w1",
            product_type: "single_bottle",
            quantity: 2,
            unit_price: 25.0,
          },
          {
            product_id: "w2",
            product_type: "single_bottle",
            quantity: 1,
            unit_price: 40.0,
          },
        ],
        created_at: "",
        updated_at: "",
      },
    });
    expect(result.subtotal).toBe(90.0);
  });
});
```

### 12.3 Type Checker Tests

Use fixture `.gln` files and stub `.ts` signatures to test that the type checker catches errors:

```typescript
// Test: missing context field
const graph = buildGraphFromFixtures({
  nodes: {
    calculate_shipping: {
      input: { cart: "Cart" },
      output: { shipping_cost: "number" },
    },
  },
  flows: { bad_flow: ["calculate_shipping"] }, // no node provides 'cart' in context
  triggers: { "http.post('/test')": "bad_flow" },
  triggerPayloads: { "http.post('/test')": {} }, // empty payload
});

const errors = typeCheck(graph);
expect(errors).toContainEqual(
  expect.objectContaining({
    code: "MISSING_CONTEXT_FIELD",
    flow: "bad_flow",
    node: "calculate_shipping",
    field: "cart",
  }),
);
```

---

## 13. Project Structure

```
project/
  entities/           # TypeScript interfaces — data shapes
    user.ts
    order.ts
    cart.ts
    ...
  nodes/              # TypeScript functions — units of work
    verify_age.ts
    calculate_cart_total.ts
    charge_payment.ts
    ...
  flows/              # .gln files — DAG wiring
    checkout.gln
    add_to_cart.gln
    triggers.gln
    ...
  tests/              # vitest tests
    nodes/
    flows/
  package.json
  tsconfig.json
```

This is a convention, not a requirement. The tooling discovers `.ts` and `.gln` files anywhere in the project directory. Node identity comes from the exported function name, not the file path.

---

## 14. Dependencies

| Package          | Version | Purpose                               |
| ---------------- | ------- | ------------------------------------- |
| `typescript`     | ^5.4.0  | Compiler API for signature extraction |
| `better-sqlite3` | ^11.0.0 | Graph store                           |
| `vitest`         | ^1.0.0  | Test runner                           |
| `tsx`            | ^4.0.0  | TypeScript execution                  |
| `chokidar`       | ^3.6.0  | File watching (for `graphlang dev`)   |

The framework itself is minimal. Runtime concerns (HTTP, persistence, email) are provided by separate library packages.

---

## 15. Success Criteria

### Graph Model

1. Full application flow is representable as typed nodes and edges in SQLite
2. `graphlang show`, `graphlang trace`, `graphlang deps`, and `graphlang impact` return correct, structured output
3. AI can query graph structure to understand architecture without reading source files

### Type System

4. Type checker catches missing context fields, type mismatches, unhandled branches, invalid fan-out types — all with specific error messages
5. Error messages include: what's wrong, where, what was expected, what was received, and a fix suggestion
6. AI can read error output and fix the graph in ≤2 iterations
7. JSON error output is parseable by AI tooling

### Testing

8. Every pure node has tests; full pure node test suite completes in under 100ms
9. Type checker tests cover all passes with both valid and invalid fixture graphs
10. `graphlang check` completes in under 3 seconds on the prototype application
11. Watch mode delivers feedback in under 1 second for single-file changes

### Thesis Validation

12. AI-modified graphs with type checking have a measurably lower error rate than AI-modified imperative code for equivalent changes

---

## 16. Open Questions

1. **Fan-out error aggregation.** When some iterations succeed and others fail, what shape is the result? Array of results? First error short-circuits? Configurable per fan-out?
2. ~~**Flow-level return types.**~~ **Resolved.** Every flow declares `input` and `output` types referencing TypeScript types. The type checker validates both external (trigger/caller provides the input) and internal (accumulated context satisfies the output).
3. ~~**Trigger payload mapping.**~~ **Resolved.** Triggers validate against the target flow's declared `input` type. HTTP triggers that need body/param mapping use a node as the first step.
4. **Hot reloading.** `graphlang dev` should watch files. Incremental type checking (only re-check changed files + dependents) for speed. Prototype: manual rebuild.
5. **Context pruning.** The accumulated context grows monotonically. Should there be a way to explicitly drop fields? Or is the context always the full accumulation?
6. **Parallel steps.** Two nodes that don't depend on each other could run in parallel within a flow. Should the `.gln` syntax support this? (e.g., `[get_tax_rate, calculate_shipping]` for parallel execution.)
7. **Flow-level middleware.** Cross-cutting concerns like logging, timing, or authentication that apply to every node in a flow. Is this just a wrapper flow, or does it need special syntax?
8. **Purity lint strictness.** How aggressive should the sync node purity lint be? Prototype: ban known impurity sources (fs, fetch, Math.random, Date.now, mutable module state). Production: consider AST-level analysis for global mutations and closure captures.

---

## 17. Future Directions

### Human Interface

- **Visual flow editor** — the primary human interface. Reads/writes `.gln` files. Flows rendered as diagrams, nodes as cards with typed input/output. Click a node to see accumulated context. Live type checking on every change. The visual editor and AI share the same SQLite query interface.
- **Natural language interface** — "add age verification before checkout" → AI queries the graph, generates the node and flow change, type checker validates, visual editor updates. The human never sees `.gln` syntax.
- **Graph diffing** — semantic diffs in the visual editor: "added node verify_age to checkout flow between step 0 and step 1" instead of text diffs

### AI Capabilities

- **Autonomous modification** — AI makes changes, runs `graphlang check`, self-corrects from errors, repeats until valid. Human approves the final result, not each intermediate step.
- **Ahead-of-time optimization** — analyze flows for parallelizable steps, pre-compute context types
- **Automated test generation** — AI generates test cases for every node and flow from the graph structure and type information

### Platform

- **Cross-project composition** — import flows and nodes from other GraphLang projects as typed dependencies
- **Flow versioning** — run multiple versions of a flow simultaneously (A/B testing, gradual rollout)
- **Replay and debugging** — record flow executions with full context at each step, replay for debugging
- **Runtime observability** — automatic tracing, metrics, and logging derived from the graph structure
- **Generic flows** — parameterized flows that work with any entity type matching a constraint
