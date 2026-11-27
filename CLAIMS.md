# The Seed — pre-registered claims

Six claims, written down first. Each verdict on the live page is **computed from the recorded gate
record (`data/gates.json`) and the recorded plant run (`data/runs/plant.json`)** by
`scripts/claims.mjs` — never asserted. A claim whose evidence is missing is shown pending, never
passed by default. `test/claims.test.mjs` checks that every bar below still appears word for word,
that each verdict is the one the committed record forces, and that each claim can fail when the
record is tampered — so none is a tautology.

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
