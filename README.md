# GraphLang

A research programming language and framework exploring a core thesis: **applications defined as typed graphs are more reliably authored and modified by AI than traditional codebases.**

## What Is This?

GraphLang is an experimental, AI-native application framework. It is not production software. It is a research prototype designed to test whether a sufficiently expressive type system — applied across an entire application graph — can create a feedback loop tight enough for AI to reliably self-correct.

The central bet: the problem with AI-generated code isn't the AI. It's that traditional codebases have implicit relationships scattered across files, frameworks, and language boundaries that no single tool can validate end-to-end. GraphLang makes every relationship explicit and typed, then checks all of them at once.

## The Approach

Applications are defined in two layers:

**The Graph Layer** — a declarative DSL (`.gln` files) describing the entire application as a typed graph: data entities, relationships, UI projections, business logic behaviors, access policies, and external service contracts. The graph handles *what connects to what*. It is not Turing complete by design.

**The Compute Layer** — small, pure TypeScript functions handling actual computation: math, string processing, validation, data transformation. Bounded, testable, side-effect-free.

The type checker validates every edge in the graph — from UI field to behavior input to entity mutation to external adapter call — as one unified, cross-boundary type check. A renamed field, a mismatched parameter, a missing required value: all caught at build time, all reported with errors specific enough for an AI to self-correct.

## Status

Early prototype. The specification is being written before the implementation.

See the **[full specification](docs/spec.md)** for the complete design: the type system, DSL syntax, graph store, compute layer, build pipeline, and implementation plan.

## Research Questions

1. Does a comprehensive type system reduce the error rate of AI-generated application code?
2. Are errors specific enough that AI can self-correct in 1–2 iterations without human intervention?
3. Can an entire application's architecture — UI, logic, data, access control, external services — be expressed as a typed graph?
4. Is the feedback loop (type check + tests) fast enough to be useful? Target: under 1 second per save.

## License

MIT
