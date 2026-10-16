import test from 'node:test';
import assert from 'node:assert/strict';
import { candidateReason, eligibleEntry, pickTonight } from '../src/lib/watchTonight.ts';

const filters = { mode: 'surprise', format: 'all', minutes: null, avoidHorror: false };
const candidate = (id, overrides = {}, details = { runtime: 85, genreIds: [35] }) => ({
  entry: { id, status: 'want_to_watch', media_type: 'movie', ...overrides }, details,
});

test('only pending titles enter a normal plan', () => {
  for (const status of ['watching', 'completed', 'paused', 'dropped']) {
    assert.equal(eligibleEntry(candidate('a', { status }).entry, filters), false);
  }
});
test('continue only uses TV already being watched', () => {
  const f = { ...filters, mode: 'continue' };
  assert.ok(candidateReason(candidate('a', { media_type: 'tv', status: 'watching' }), f));
  assert.equal(candidateReason(candidate('b', { media_type: 'tv' }), f), null);
  assert.equal(candidateReason(candidate('c', { status: 'watching' }), f), null);
});
test('quick respects 90 minutes and a stricter user limit', () => {
  assert.ok(candidateReason(candidate('a', {}, { runtime: 90, genreIds: [] }), { ...filters, mode: 'quick' }));
  assert.equal(candidateReason(candidate('a', {}, { runtime: 91, genreIds: [] }), { ...filters, mode: 'quick' }), null);
  assert.equal(candidateReason(candidate('a'), { ...filters, mode: 'quick', minutes: 60 }), null);
});
test('unknown, zero and TV runtimes cannot satisfy a time budget', () => {
  for (const c of [candidate('a', {}, null), candidate('b', {}, { runtime: 0, genreIds: [] }), candidate('c', { media_type: 'tv' })]) {
    assert.equal(candidateReason(c, { ...filters, minutes: 90 }), null);
  }
});
test('missing metadata still allows an unfiltered surprise', () => {
  assert.ok(candidateReason(candidate('a', {}, null), filters));
  assert.equal(candidateReason(candidate('a', {}, null), { ...filters, mode: 'comedy' }), null);
});
test('comedy is genre based and excludes unrelated titles', () => {
  assert.ok(candidateReason(candidate('a'), { ...filters, mode: 'comedy' }));
  assert.equal(candidateReason(candidate('b', {}, { genreIds: [18], runtime: 80 }), { ...filters, mode: 'comedy' }), null);
});
test('avoid horror also excludes mixed genres and unknown metadata', () => {
  for (const details of [null, { genreIds: [], runtime: 80 }, { genreIds: [35, 27], runtime: 80 }]) {
    assert.equal(candidateReason(candidate('a', {}, details), { ...filters, avoidHorror: true }), null);
  }
});
test('tension without horror keeps mystery', () => {
  assert.ok(candidateReason(candidate('a', {}, { genreIds: [9648], runtime: 80 }), { ...filters, mode: 'tension', avoidHorror: true }));
});
test('together understands TV adventure IDs', () => {
  assert.ok(candidateReason(candidate('a', { media_type: 'tv' }, { genreIds: [10759], runtime: null }), { ...filters, mode: 'together' }));
});
test('format filter is respected', () => {
  assert.equal(candidateReason(candidate('a'), { ...filters, format: 'tv' }), null);
});
test('selection never repeats or mutates its input and respects dismissals', () => {
  const pool = Array.from({ length: 8 }, (_, i) => candidate(String(i)));
  const before = JSON.stringify(pool);
  const result = pickTonight(pool, filters, new Set(['0', '1']), () => 0.5);
  assert.equal(result.length, 3);
  assert.equal(new Set(result.map((c) => c.entry.id)).size, 3);
  assert.ok(result.every((c) => !['0', '1'].includes(c.entry.id)));
  assert.equal(JSON.stringify(pool), before);
});
test('empty, single and exhausted libraries work without relaxing filters', () => {
  assert.deepEqual(pickTonight([], filters, new Set()), []);
  assert.equal(pickTonight([candidate('a')], filters, new Set()).length, 1);
  assert.deepEqual(pickTonight([candidate('a')], filters, new Set(['a'])), []);
  assert.deepEqual(pickTonight([candidate('a')], { ...filters, minutes: 60 }, new Set()), []);
});
