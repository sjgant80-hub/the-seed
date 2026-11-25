import { test } from 'node:test';
import assert from 'node:assert/strict';
import W from '../src/watcher.mjs';

test('a layer runs its inner work up to a hard budget, then terminates instead of growing without bound', () => {
  const w = W.watcher('grow', 2);
  assert.equal(w.run((x) => x + 1, 1).value, 2);
  assert.equal(w.run((x) => x + 1, 2).value, 3);
  const third = w.run((x) => x + 1, 3);
  assert.deepEqual([third.terminated, third.value], [true, undefined]);
  assert.equal(w.calls, 3);
  assert.deepEqual(w.telemetry(), { layer: 'grow', budget: 2, calls: 3, terminated: 1, failed: 0 });
});

test('a layer is total: an inner call that throws is caught, counted and emitted, never thrown on', () => {
  const w = W.watcher('x', 5);
  assert.doesNotThrow(() => w.run(() => { throw new Error('boom'); }));
  const r = w.log[0];
  assert.deepEqual([r.ok, r.error, r.terminated], [false, 'boom', false]);
  assert.equal(w.telemetry().failed, 1);
  // a non-function inner does not throw
  assert.doesNotThrow(() => w.run(5));
});

test('budgets that are not whole non-negative integers are read as zero (everything terminates)', () => {
  for (const b of [-1, 1.5, null, undefined, 'x']) { const w = W.watcher('n', b); assert.equal(w.budget, 0); assert.equal(w.run(() => 1).terminated, true); }
  const s = W.stack([['outer', 3], ['inner', 1]]);
  assert.deepEqual(s.map((w) => [w.name, w.budget]), [['outer', 3], ['inner', 1]]);
  assert.deepEqual(W.stack(null), []);
});
