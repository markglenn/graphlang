# GraphLang — AI Development Guide

This file is for AI agents working on this codebase. Read it before writing any code.

---

## What You're Building

GraphLang is an AI-native application framework. The thesis: applications defined as typed graphs are more reliably authored and modified by AI than traditional codebases, because the type system provides immediate, precise, actionable error feedback at every boundary.

Two layers:
1. **Graph layer** — `.gln` DSL files declaring typed nodes (entities, behaviors, projections, etc.) and edges (relationships, triggers, calls). Declarative. No computation.
2. **Compute layer** — pure TypeScript functions for actual computation. No side effects, no I/O, no external state.

The type checker bridges them. It validates every connection in the graph using SQL queries against a SQLite store. When the AI emits a broken graph, the type checker tells it exactly what's wrong and how to fix it.

**The full spec is in `docs/spec.md`.** Read it. It is the source of truth.

---

## Development Rules

- **Never auto-commit.** Only commit when the user explicitly asks.
- **Never skip tests.** The test suite is part of the feedback loop, not optional.
- **Never write impure compute modules.** No `fs`, `fetch`, `Date.now()`, `Math.random()`, DOM access. Pure functions only.
- **Never hand-write client JS.** Client JavaScript is generated from projection nodes by the compiler. The source of truth is the graph.
- **Never use `json` type when `record({...})` works.** Every `json` usage is a hole in the type system.
- **Prefer synchronous code.** `better-sqlite3` is synchronous by design. Don't make the graph store async.

---

## The Feedback Loop Constraint

**Goal: under 1 second from save to feedback. Ceiling: 3 seconds on large projects.**

This is a hard constraint that drives architecture decisions:
- `better-sqlite3` is synchronous → no async overhead on type checker queries
- Compute modules are pure → tests need zero setup/teardown
- SQLite `:memory:` for tests → no disk I/O
- Type checker is incremental → only re-check changed nodes and their dependents
- Vitest stays warm in watch mode → no cold start per save

Every architecture decision that trades speed for convenience is the wrong decision.

---

## Stack

| Concern | Tool |
|---------|------|
| Graph store | `better-sqlite3` (WAL mode, synchronous) |
| HTTP server | `hono` + `@hono/node-server` |
| Test runner | `vitest` |
| TypeScript runtime | `tsx` |
| CSS processing | `postcss` |

---

## Project Structure

```
src/
  cli/              — check, build, dev, seed commands
  parser/           — lexer.ts, parser.ts, ast.ts, resolver.ts
  graph/            — types.ts, store.ts (SQLite read/write), query.ts
  typechecker/      — index.ts (orchestrator), pass-*.ts (10 passes), errors.ts, suggestions.ts, type-map.ts
  compute/          — loader.ts, lint.ts (purity check), contract-check.ts
  runtime/          — server.ts (Hono), router.ts, renderer.ts, behavior.ts, constraint.ts, policy.ts, adapter-executor.ts
  compiler/         — client-js.ts, dependency-graph.ts, codegen.ts
  css/              — postcss-lint.ts, bundler.ts

examples/ecommerce/ — the reference application
  **/*.gln            — graph definitions (one declaration per file, any directory layout)
  impl/compute/*.ts   — compute module implementations
  impl/components/*.js — component JS implementations (mount/update/unmount)
  styles/*.css        — CSS source files

tests/
  helpers.ts        — createTestGraph(), createTestEnvironment(), runTypeChecker()
  typechecker/      — one test file per pass, fixture graphs in fixtures/valid/ and fixtures/invalid/
  compute/          — pure function tests
  runtime/          — behavior, renderer, constraint tests
  integration/      — full pipeline tests
```

---

## SQLite Schema

```sql
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,          -- 'entity', 'behavior', 'projection', 'compute', 'constraint', 'policy', 'component', 'adapter', 'listener'
  properties JSON NOT NULL,
  source_file TEXT,
  source_line INTEGER
);

CREATE TABLE edges (
  id TEXT PRIMARY KEY,
  from_node TEXT NOT NULL REFERENCES nodes(id),
  to_node TEXT NOT NULL REFERENCES nodes(id),
  type TEXT NOT NULL,          -- 'has_many', 'has_one', 'belongs_to', 'mutates', 'calls_compute', 'precondition', ...
  properties JSON DEFAULT '{}'
);

CREATE TABLE entity_data (     -- runtime application data
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
```

---

## DSL Quick Reference

```
# Entity
entity User
  field id : uuid @generated
  field email : string @format(email) @unique @required
  field role : enum(admin, customer) @default(customer)
end

# Relationship
edge User -> Order : has_many
  on_delete cascade
end

# Compute module declaration (implementation in .ts file)
compute hash_password
  source "compute/hash_password.ts"
  input plaintext : string
  output hashed : string
end

# Constraint
constraint is_owner
  params target_entity : entity
  evaluate
    traverse auth.user -> id as auth_id
    traverse target_entity -> user -> id as owner_id
    assert auth_id == owner_id
  end
end

# Policy
policy owner_access
  applies_to User, Order
  rule
    allow read when is_owner(target_entity: $target)
    deny all
  end
end

# Behavior (phases must be in this order)
behavior update_email
  trigger projection(profile_edit).action(update_email_btn)
  input
    new_email : string
  end
  precondition is_owner(target_entity: $target_user)
  compute result = some_module(param: $input.value)
  require result.valid else "Message"
  adapter charge = stripe.create_charge(amount: result.total)  # before mutations
  mutate $target_user.email = $input.new_email
  effect emit(user.email_changed, user: $target_user)
  on_success show_message("Done", type: success)
  on_failure show_message($error, type: error)
end

# Projection
projection profile_edit
  route /account/profile
  auth required
  data
    bind current_user = auth.user
  end
  state
    loading : boolean = false
  end
  derived
    filtered = items | where(active == true)
  end
  layout
    page max_width(narrow)
      form id(email_form)
        field id(new_email) type(email) label("New Email")
          required true
        end
        action id(update_email_btn) label("Update")
          submit_to behavior(update_email)
          send new_email = field(new_email).value
        end
      end
    end
  end
end

# Component declaration
component chart
  source "components/chart.js"
  prop data : list(record({ label: string, value: decimal })) @required
  prop type : enum(bar, line, pie) @required
  event on_click : record({ label: string })
end

# Adapter declaration
adapter stripe_payments
  type http
  config
    base_url "https://api.stripe.com/v1"
    auth bearer(env(STRIPE_SECRET_KEY))
  end
  action create_charge
    input amount : integer
    input currency : string
    output charge_id : string
    output status : enum(succeeded, failed)
  end
end
```

**Field types:** `string`, `text`, `integer`, `decimal`, `boolean`, `uuid`, `timestamp`, `enum(...)`, `record({...})`, `list(T)`, `json` (avoid)

**Field annotations:** `@required`, `@unique`, `@generated`, `@sensitive`, `@immutable`, `@default(v)`, `@format(email|url|phone)`, `@min(n)`, `@max(n)`

---

## Type Checker: 10 Passes

Build the type checker pass by pass. Each is a set of SQL queries against the graph store.

| Pass | File | What It Checks |
|------|------|---------------|
| 1 | `pass-entity.ts` | Duplicate fields, invalid types, annotation validity |
| 2 | `pass-edge.ts` | Valid entity references, valid cardinalities |
| 3 | `pass-compute.ts` | Valid type signatures, render output types |
| 4 | `pass-constraint.ts` | Traversal paths, assert expression types |
| 5 | `pass-behavior.ts` | Inputs, preconditions, compute steps, mutations, effects, phase ordering |
| 6 | `pass-projection.ts` | Bindings, state, derived values, forms, actions, match exhaustiveness |
| 7 | `pass-policy.ts` | Constraint references, target types, coverage |
| 8 | `pass-crosscut.ts` | Orphans, unused modules, circular preconditions, broken references |
| 9 | `pass-component.ts` | Prop types (including record shapes), event types, required props |
| 10 | `pass-adapter.ts` | Action contracts, param types, adapter call phase ordering |

Every error must include: `code`, `source_file`, `source_line`, `node_id`, `message`, `expected`, `received`, `path`, `suggestions[]`. The AI reads these errors and self-corrects — quality of error messages is a primary quality metric.

---

## Testing Approach

**Compute tests** — pure function calls, zero setup:
```typescript
import { hash_password } from '../../examples/ecommerce/compute/hash_password';
expect(hash_password({ plaintext: 'abc' })).toHaveProperty('hashed');
```

**Type checker tests** — fixture DSL snippets into in-memory SQLite:
```typescript
const graph = createTestGraph(`entity User field id : uuid @generated end`);
const errors = runTypeChecker(graph);
expect(errors).toHaveLength(0);
```

**Behavior tests** — in-memory SQLite, no network, stubbed adapters:
```typescript
const env = createTestEnvironment('examples/ecommerce');
const user = env.seed('User', { email: 'a@b.com' });
const result = await env.executeBehavior('update_email', { new_email: 'c@d.com' }, { auth: { user } });
expect(result.success).toBe(true);
```

Fixture files live in `tests/typechecker/fixtures/valid/` (should pass) and `tests/typechecker/fixtures/invalid/` (should fail with specific errors).

---

## Build Phases

Implement in this order — the type checker is the core product:

1. **Phase 1** — Parser + SQLite + Type Checker (all 10 passes). This is the most important phase.
2. **Phase 2** — Compute modules + CSS pipeline (purity lint, contract check, PostCSS)
3. **Phase 3** — Server runtime + HTML rendering (Hono, projection renderer, data binding)
4. **Phase 4** — Client-side JS compilation + behavior executor
5. **Phase 5** — AI integration test (prove the thesis)

Do not move to a later phase until the current phase has passing tests.

---

## Error Message Quality Bar

Every type check error must be good enough that Claude can fix it without seeing the original code. Test this literally: take an error message in isolation and ask: "Can I fix the graph based only on this message?" If the answer is no, the error message is not good enough.

Good error:
```
ERROR [behavior-compute-param-mismatch] behaviors.gln:18
  Behavior 'update_password', compute step 'verify_result':
  Calling compute module 'verify_password' with param 'plain_text',
  but module expects 'plaintext'.

  Module signature (compute.gln:8):
    input plaintext : string

  Suggestion: Change 'plain_text' to 'plaintext'
```

Bad error:
```
TypeError: param mismatch
```

---

## CSS Convention

No styling in the graph. CSS targets generated `data-gl-*` attributes:

```css
[data-gl-type="action"][data-gl-action-style="primary"] { ... }
[data-gl-visible="false"] { display: none; }
[data-gl-projection="storefront"][data-gl-node="cart_section"] { ... }
```

The compiler generates these attributes from projection layout definitions.
