import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captionsFromWords, tempoFilters} from '../lib/timing.mjs';
test('el cambio de velocidad conserva el factor incluso fuera del rango de atempo', () => {
  for (const target of [.1, .75, 1, 1.6, 7]) {
    const factors = tempoFilters(target).split(',').map(s => Number(s.split('=')[1]));
    assert.ok(factors.every(f => f >= .5 && f <= 2));
    assert.ok(Math.abs(factors.reduce((a, b) => a * b, 1) - target) < 1e-6);
  }
  assert.throws(() => tempoFilters(NaN));
});
test('los subtítulos preservan palabras, separan pausas y no se solapan', () => {
  const words = [
    {word: 'Hola,', start: .5, end: .8}, {word: 'Venus.', start: .9, end: 1.4},
    {word: 'Otro', start: 3, end: 3.4}, {word: 'mundo', start: 3.45, end: 3.8},
    {word: 'fin', start: 39.8, end: 41}, {word: 'fuera', start: 42, end: 43},
  ];
  const captions = captionsFromWords(words);
  assert.equal(captions.flatMap(c => c.words).length, 5);
  assert.equal(captions.length, 3);
  assert.equal(captions.at(-1).end, 40);
  assert.equal(captions.at(-1).words[0].end, 40);
  captions.forEach((c, i) => {assert.ok(c.end > c.start); if (i) assert.ok(c.start >= captions[i - 1].end);});
  assert.throws(() => captionsFromWords([]));
});
