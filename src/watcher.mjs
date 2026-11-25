// watcher.mjs — the layer skeleton. Each layer wraps the one below, carries a hard termination budget (it cannot run
// forever), and emits telemetry for the glass. A layer that hits its budget terminates instead of growing without
// bound. Pure and total: an inner call that throws is caught, counted and emitted, never thrown on.

const str = (x) => (typeof x === 'string' ? x : '');

// watcher(name, budget) → a layer. run(fn, arg) calls fn up to `budget` times; the call past the budget is refused
// (terminated). Every call is recorded in .log: { call, ok, terminated, error }.
export function watcher(name, budget) {
  const cap = Number.isInteger(budget) ? Math.max(0, budget) : 0;
  const log = [];
  let calls = 0;
  return {
    name: str(name), budget: cap, log,
    run(fn, arg) {
      calls++;
      if (calls > cap) { const rec = { call: calls, ok: false, terminated: true, error: null }; log.push(rec); return { value: undefined, ...rec }; }
      let value, ok = true, error = null;
      try { value = typeof fn === 'function' ? fn(arg) : undefined; } catch (e) { ok = false; error = str(e && e.message) || 'threw'; }
      const rec = { call: calls, ok, terminated: false, error };
      log.push(rec);
      return { value, ...rec };
    },
    get calls() { return calls; },
    // telemetry → what the glass shows for this layer
    telemetry() { return { layer: str(name), budget: cap, calls, terminated: log.filter((r) => r.terminated).length, failed: log.filter((r) => !r.ok && !r.terminated).length }; },
  };
}

// stack(layers) → wrap a chain of watchers outer-to-inner; each layer's budget bounds the one below it
export function stack(specs) {
  return (Array.isArray(specs) ? specs : []).map(([name, budget]) => watcher(name, budget));
}

export default { watcher, stack };
