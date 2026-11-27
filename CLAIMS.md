# The Seed — claims checked against the recorded run

**These were written on 2026-11-27, after the plant run they rule on (recorded 2026-11-25). They are
therefore a _check of the record_, not pre-registered bars set before the run — a description, honestly
labelled as one.** Unlike The Crystal or The Verifier Set, whose claims were sealed before their runs,
these were authored once the run existed; so they say what the record shows, and the test guards against
the one abuse that matters for a post-hoc claim — that it is a tautology.

Six claims. Each verdict on the live page is **computed from the recorded gate record
(`data/gates.json`) and the recorded plant run (`data/runs/plant.json`)** by `scripts/claims.mjs` —
never asserted. A claim whose evidence is missing is shown pending, never passed by default.
`test/claims.test.mjs` checks that every bar below still appears word for word, that each verdict is the
one the committed record forces, and that **each claim can fail when the record is tampered — so none is
a tautology** (the real risk when a claim is written after its result is known).

- **S1 — Every organ proves itself under mutation.**
  Across every gated organ, no planted bug survives: the record is clean, and killed equals total for the whole and for each file.

- **S2 — A cell seals only if it bonds and passes the genome.**
  For every grown cell, it is sealed exactly when it bonded AND passed the genome birth-check — never one without the other.

- **S3 — Every sealed cell is itself a cell.**
  Every sealed cell passes all four genome laws: describe, verify, prune, know-your-edge.

- **S4 — Nothing is called truer than what it stands on.**
  The bond chain terminates at an axiom floor the seed re-derives itself, with no model.

- **S5 — The pattern reproduces.**
  A sealed cell carried the seed, forged the next, and that next one bonded and sealed too.

- **S6 — A cell that cannot prove itself is dissolved and not kept.**
  Every cell that did not bond-and-admit is dissolved, and none of the dissolved is sealed.
