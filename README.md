# The Seed

**Live: https://sjgant80-hub.github.io/the-seed/** — plant it in your browser: a small model loads into the tab and
grows verified cells on your own graphics chip, nothing leaving the device.

The Seed is a minimal, transmissible repo. Give it a model and an empty workspace and it grows an organism of software
one cell at a time, where every bond is checked and nothing unverified is kept. It is not a program that runs once; it
is the executable definition of the loop, small enough to transmit whole.

```
  task ──▶  the MODEL generates a reply
            │
         BOND-CHECK ──▶ does it reduce to an axiom floor the seed re-derives itself?
         no │                    │ yes
            ▼                    ▼
        DISSOLVE            GENOME: describe · verify · prune · know-edge
                                 ▼
                           SEALED CELL ──▶ carries the seed ──▶ forges the next
```

## The one rule

**Verify or dissolve.** Nothing persists that cannot prove itself, and nothing is called truer than what it stands on.
A cell seals only when its reply **bonds** — the verifier passes and the seed re-derives that same verdict at an axiom
floor it computes itself — **and** it passes the genome's four laws, so every sealed cell is a cell, able to be planted
again. A cell that cannot prove itself dissolves and is not kept.

## The organs (nine, each mutation-gated)

| organ | what it is |
|---|---|
| `src/genome.mjs` | the four laws every cell runs on itself at birth: describe, verify, prune, know your edge |
| `src/floor.mjs` | the axiom floor — what the seed re-derives itself, with no model: exact arithmetic and byte-equality. The termination below |
| `src/verifier.mjs` | the bond-check contract any verifier plugs into, with its floor and strength; a bond is only as strong as its weakest root |
| `src/loop.mjs` | generate → verify-or-dissolve → crystallise. One turn, one sealed cell |
| `src/terminate.mjs` | the floor below, and a human above: nothing irreversible without a grant the seed cannot mint |
| `src/watcher.mjs` | each layer wraps the one below, carries a hard budget, and emits telemetry |
| `src/forge.mjs` | a sealed cell reproduces the next; it never emits debris |
| `src/distill.mjs` | verified cells → training data; adopt new weights only if they beat the sealed set, and only with a grant |
| `src/plant.mjs` | probe the floor, grow and seal cells, prove the pattern reproduces. Does no irreversible act |

Two reference verifiers ship so the loop runs the moment it is planted: **proven** (exact arithmetic) and **grounded**
(a quote that is the source's own bytes). The seed carries the *contract* any other verifier plugs into — each
declaring its own floor and its own honest strength — not the whole estate's verifiers. That is what minimal and
transmissible means.

## The two terminations

- **Below, the floor.** Nothing bonds that the seed cannot re-derive itself at a recognised axiom floor. A verifier can
  never pass something the seed cannot ground.
- **Above, a person.** An irreversible act — adopting weights, publishing, deleting, spending, rewriting the floor — is
  refused unless a human hands in a grant the seed cannot mint. So the seed grows freely and never, on its own, does
  the one kind of thing you cannot take back.

## Run it

```bash
node --test test/*.test.mjs
```

```bash
node scripts/make-page.mjs
```

```bash
node scripts/gates.mjs --witness .witness/witness.mjs
```

The model work happens in the browser: open the live page (or `index.html` from any static server) and press **Plant
it here**. It needs a browser with WebGPU. The recorded plant reads without one, and the seed re-grows it with no model
to the same result (`scripts/publish.mjs --check`).

## Honest edges

- It is a first cell, not a finished organism. The loop is alive and every bond is checked; the estate grows from here,
  cell by cell, each sealed before the next.
- Grounded is not true. A grounded cell cites a document faithfully; if the document is wrong, the answer is wrong, and
  it is still grounded. The label is the promise.
- The floor is small on purpose: two axiom floors ship. The seed carries the contract for any other.
- Depth 5 (training weights) is not built. Distillation harvests verified cells and gates adoption; it never adopts
  without beating the sealed set and a human grant.
- The browser model comes from the public WebLLM library; this page does not check it against a fixed fingerprint.

Built by Kar. MIT licence, holder Simon Gant. Supplied by [AI Native Solutions](https://www.ai-nativesolutions.com);
support is agreed per deployment, in each deployment's agreement.
