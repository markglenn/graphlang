# GraphLang

A research framework exploring a core thesis: **applications defined as typed graphs are more reliably authored and modified by AI than traditional codebases.**

## What Is This?

GraphLang is an experimental framework for **100% AI-authored applications**. Humans direct; AI builds. No one hand-writes `.gln` files or TypeScript nodes — the AI generates them from natural language instructions, the type checker validates the result, and the human sees a working application or a precise error.

The text files (`.ts`, `.gln`) exist because they're the best format for AI to manipulate and for git to version — not because anyone is expected to read or write them. The human interface is natural language and (eventually) a visual flow editor. The AI interface is structured queries and typed feedback.

### The Problem

AI is good at writing individual functions. It struggles with *systems* — the connections between functions, the data flowing across boundaries, the downstream consequences of a change.

In a 2,000-file application, the AI can't fit everything into its context window. It has to guess which files are relevant, read a subset, infer relationships from import chains and naming conventions, and hope it found everything. It usually hasn't. The files it missed are where the bugs hide.

Rename a field on an entity. Which flows break? Which downstream nodes consume that field? In a traditional codebase, answering this requires a full-text search across every file and manual interpretation of each match. AI does this poorly because the answer isn't in any single file — it's in the *relationships between* files.

### The Bet

GraphLang makes architecture queryable instead of inferrable:

```bash
$ graphlang impact calculate_shipping
Used in flows: checkout, cart_updated, stock_changed/update_cart
Downstream nodes: estimate_delivery (reads shipping_cost)

$ graphlang context checkout charge_payment
charge_payment needs:
  discounted_total  ← apply_member_discount (step 4)
  tax_amount        ← calculate_alcohol_tax (step 6)
  shipping_cost     ← calculate_shipping (step 7)
  payment_token     ← CheckoutInput (flow input)
```

The AI doesn't load 2,000 files into context. It queries the graph for the precise answer to an architectural question. The type checker catches every mistake with specific, actionable feedback. Together, they close the loop that traditional codebases leave open.

## The Approach

Two file types, one graph. Both are AI-written:

**TypeScript files** — everything executable. Entities are interfaces (data shapes). Nodes are functions (units of work). Sync functions are pure; async functions are impure. TypeScript is the single source of truth for types. AI writes it reliably — it's the language AI knows best.

**`.gln` files** — the wiring. Flows define typed DAGs connecting nodes. Every flow declares its input and output types, referencing TypeScript types by name. The syntax is minimal and unambiguous — optimized for AI generation and git diffing, not human ergonomics.

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
```

The tooling uses the TypeScript Compiler API to extract all type and function signatures into a SQLite graph. The `.gln` parser adds flow edges. The type checker validates that every connection is type-safe — from trigger payload to node input to branching logic to downstream effects.

Everything else — persistence, HTTP, email, rendering — lives in libraries. GraphLang owns two concerns: typed nodes and typed flows.

## Key Concepts

- **Accumulated context** — each flow maintains a growing context object. Nodes pull input fields from context and merge output fields back. The type checker validates field availability at every step.
- **Discriminated unions** — one mechanism for all control flow. Branching, error handling, and early returns all work the same way: a node returns a union, the graph routes on the discriminant.
- **Flow contracts** — every flow declares `input` and `output` types. The type checker validates both externally (does the caller provide the input?) and internally (does the accumulated context satisfy the output?).
- **Railway-oriented errors** — nodes returning `{ ok: false }` short-circuit the flow automatically unless explicitly handled. Other discriminants require exhaustive branches.
- **Flow composition** — flows can call other flows as if they were nodes. `fan_out(field, flow)` iterates a list through a sub-flow.
- **SQLite as query engine** — the graph is stored in SQLite, making every architectural question a SQL query. "What flows use this node?" is a join, not custom traversal code.

## Status

Early prototype. The specification is written; implementation has not started.

- **[Full specification](docs/spec.md)** — the type system, flow syntax, graph store, data flow model, and tooling design.
- **[Wine shop example](examples/wine-shop/)** — a reference application with 5 entities, 23 nodes, 5 flows, and flow contract types demonstrating the architecture.

## Research Questions

1. Can AI build and maintain a full application through graph queries + type checker feedback alone?
2. Does externalizing architecture into a typed graph reduce the error rate of AI-generated code?
3. Are type errors specific enough that AI can self-correct in 1–2 iterations without human intervention?
4. Is the feedback loop (type check + tests) fast enough? Target: under 1 second per save.
5. Does flow composition scale — can large applications decompose into small, reusable flows?
6. Can a visual editor over `.gln` files replace traditional IDEs for human oversight?

## License

MIT
