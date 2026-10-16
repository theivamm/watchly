import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTasteProfile, explainTaste } from '../src/lib/tasteProfile.ts';
import { ratingWeight } from '../supabase/functions/calculate-user-dna/_lib/ratingWeight.ts';
const baseline = [{ key: '27', label: 'Terror', percentage: 80, weight: 8 }, { key: '35', label: 'Comedia', percentage: 20, weight: 2 }];
const rated = (rating, genre, title = 'Ejemplo', status = 'completed') => ({ entry: { rating, title, status }, details: { genreIds: [genre] } });
test('low stars reduce affinity even for frequently consumed genres', () => {
  const p = buildTasteProfile([rated(1, 27), rated(1, 27), rated(5, 35)], baseline);
  assert.equal(p.genres[0].key, '35');
  assert.equal(p.genres.some(g => g.key === '27'), false);
});
test('unrated, abandoned without stars and watchlist are not dislikes', () => {
  const p = buildTasteProfile([rated(null, 27, 'A', 'dropped'), rated(1, 27, 'B', 'want_to_watch')], baseline);
  assert.equal(p.ratedCount, 0);
  assert.equal(p.genres[0].key, '27');
});
test('explanation cites only a positively rated title sharing the genre', () => {
  const p = buildTasteProfile([rated(4.5, 35, 'Una comedia'), rated(1, 27, 'Terror malo')], baseline);
  assert.match(explainTaste({ genreIds: [35] }, p), /Una comedia.*4.5/);
  assert.doesNotMatch(explainTaste({ genreIds: [18] }, p), /Una comedia|Terror malo/);
});
test('missing metadata does not fabricate evidence', () => {
  const p = buildTasteProfile([{ entry: { rating: 5 }, details: null }], baseline);
  assert.equal(p.ratedCount, 0);
  assert.match(explainTaste({ genreIds: [27] }, p), /Todavía no/);
});
test('half stars have increasing weights and unknown remains neutral', () => {
  assert.equal(ratingWeight(null), 1);
  assert.equal(ratingWeight(NaN), 1);
  for (let n = 0.5; n < 5; n += 0.5) assert.ok(ratingWeight(n) < ratingWeight(n + 0.5));
  assert.ok(ratingWeight(4.5) > ratingWeight(4));
});
