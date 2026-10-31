import {test} from 'node:test';
import assert from 'node:assert/strict';
import {estimatedCaptions, buildProps, ScriptSchema, saveImage} from '../lib/pipeline.mjs';
import {DURATION} from '../lib/timing.mjs';

test('los subtítulos estimados cubren toda la narración dentro de la duración', () => {
  const narration = 'Uno dos tres. Cuatro, cinco seis siete ocho nueve diez once doce. Trece catorce.';
  const captions = estimatedCaptions(narration);
  assert.equal(captions.flatMap(c => c.words).map(w => w.text).join(' '), narration);
  assert.ok(captions.at(-1).end <= DURATION);
  captions.forEach((c, i) => { assert.ok(c.end > c.start); if (i) assert.ok(c.start >= captions[i - 1].end); });
  assert.throws(() => estimatedCaptions('   '));
});

test('el diseño foto solo se usa cuando hay imágenes', () => {
  const script = ScriptSchema.parse({title: 'Título', narration: 'Una narración de prueba suficientemente larga.'});
  const captions = estimatedCaptions(script.narration);
  const sinImagenes = buildProps(script, {captions, layout: 'foto'});
  assert.equal(sinImagenes.layout, 'clasico');
  assert.equal(sinImagenes.demo, true);
  const conImagenes = buildProps(script, {captions, images: ['jobs/x/a.png'], audioSrc: 'jobs/x/voice.wav'});
  assert.equal(conImagenes.layout, 'foto');
  assert.equal(conImagenes.showTitle, false);
  assert.equal(conImagenes.demo, false);
});

test('las imágenes se validan por su contenido, no por la extensión', async () => {
  await assert.rejects(saveImage('test-validacion', 0, Buffer.from('<svg></svg>')), /Formato no admitido/);
  await assert.rejects(saveImage('../fuera', 0, Buffer.from([0xff, 0xd8, 0xff, 0])), /Identificador inválido/);
});
