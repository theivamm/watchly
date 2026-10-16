import test from 'node:test';
import assert from 'node:assert/strict';
import { rankNewDnaMovies } from '../src/lib/dnaDiscovery.ts';
const genres = [{ key: '35', label: 'Comedia', weight: 10 }, { key: '18', label: 'Drama', weight: 2 }];
const movie = (id, genreIds = [35]) => ({ tmdbId: id, mediaType: 'movie', genreIds, tmdbRating: 7 });

test('excludes every library status, including movies not in watchlist', () => {
  const library = ['want_to_watch', 'watching', 'completed', 'paused', 'dropped'].map((status, i) => ({ tmdb_id: i, media_type: 'movie', status }));
  assert.deepEqual(rankNewDnaMovies(Array.from({ length: 6 }, (_, i) => movie(i)), library, genres).map(({ item }) => item.tmdbId), [5]);
});
test('never returns TV, duplicates or movies with no matching DNA genre', () => {
  const result = rankNewDnaMovies([movie(1), movie(1), { ...movie(2), mediaType: 'tv' }, movie(3, [27])], [], genres);
  assert.equal(result.length, 1);
  assert.equal(result[0].item.tmdbId, 1);
});
test('ranks by DNA weight and explains the matching genre', () => {
  const result = rankNewDnaMovies([movie(1, [18]), movie(2)], [], genres);
  assert.equal(result[0].item.tmdbId, 2);
  assert.match(result[0].reason, /comedia/);
});
test('TV IDs in library do not exclude unrelated movie IDs', () => {
  assert.equal(rankNewDnaMovies([movie(1)], [{ tmdb_id: 1, media_type: 'tv' }], genres).length, 1);
});
test('maps TV DNA genres to movie genres and handles missing DNA', () => {
  assert.equal(rankNewDnaMovies([movie(1, [28])], [], [{ key: '10759', label: 'Acción y aventura', weight: 5 }]).length, 1);
  assert.deepEqual(rankNewDnaMovies([movie(1)], [], []), []);
});
