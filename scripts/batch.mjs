// Genera varios vídeos a partir de un archivo JSON de guiones (ver guiones/*.json).
// Uso: node scripts/batch.mjs guiones/lote.json [--no-render]
// Cada paso se guarda en public/jobs/<slug>/ y se reutiliza si ya existe: volver a ejecutarlo no repite gastos.
import {readFile, writeFile, access, readdir} from 'node:fs/promises';
import path from 'node:path';
import {generateImage, synthesizeVoice, buildProps, savePropsFile, jobDir, estimatedCaptions, hasKey, OUTPUT_DIR, JOBS_DIR} from '../lib/pipeline.mjs';
import {captionsFromWords} from '../lib/timing.mjs';
import {audioDuration, run} from '../lib/system.mjs';
import OpenAI from 'openai';
import {createReadStream} from 'node:fs';
import {renderVideo} from './render.mjs';

const START = 0.15, END_PAD = 0.9;
const exists = f => access(f).then(() => true, () => false);

async function makeOne(item, n, total) {
  const id = item.slug;
  const dir = await jobDir(id);
  const log = m => console.log(`[${n}/${total} ${id}] ${m}`);
  // Imágenes (una por escena; se reutilizan si ya existen).
  const files = await readdir(dir);
  const images = [];
  for (const [i, prompt] of item.scenes.entries()) {
    const done = files.find(f => f.startsWith(`scene-${i}-`));
    if (done) { images.push(`jobs/${id}/${done}`); continue; }
    log(`imagen ${i + 1}/${item.scenes.length}…`);
    images.push(await generateImage(id, i, prompt));
  }
  // Voz: duración natural (sin acelerar), con 0,15 s de margen inicial.
  const raw = path.join(dir, 'voice-raw.mp3');
  if (!await exists(raw)) { log('voz…'); await synthesizeVoice(id, item.narration); }
  const voice = path.join(dir, 'voice.wav');
  if (!await exists(voice)) await run('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af', `adelay=${Math.round(START * 1000)}:all=1,apad=pad_dur=${END_PAD}`, '-ar', '24000', '-ac', '1', voice]);
  const duration = Math.round(await audioDuration(voice) * 30) / 30;
  // Subtítulos sincronizados con Whisper (sobre el audio final, ya con el margen).
  const tfile = path.join(dir, 'transcription.json');
  let words;
  if (await exists(tfile)) words = JSON.parse(await readFile(tfile, 'utf8')).words;
  else if (hasKey('WHISPER')) {
    log('subtítulos…');
    try {
      const client = new OpenAI({apiKey: process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY, maxRetries: 2});
      const tr = await client.audio.transcriptions.create({file: createReadStream(voice), model: 'whisper-1', language: 'es', response_format: 'verbose_json', timestamp_granularities: ['word'], prompt: item.narration});
      await writeFile(tfile, JSON.stringify(tr, null, 2));
      words = tr.words;
    } catch (e) { log(`Whisper falló (${e.message}); tiempos estimados.`); }
  }
  // Whisper quita puntuación: si el número de palabras coincide, se usa el texto del guion.
  const tokens = item.narration.split(/\s+/).filter(Boolean);
  if (words?.length === tokens.length) words = words.map((w, i) => ({...w, word: tokens[i]}));
  const captions = words?.length ? captionsFromWords(words, duration) : estimatedCaptions(item.narration, {start: START, span: duration - START - END_PAD, duration});
  const script = {title: item.title, narration: item.narration, object: 'bulb', accent: item.accent || 'amber'};
  const props = {...buildProps(script, {images, audioSrc: `jobs/${id}/voice.wav`, captions, brand: item.brand ?? 'No Es Casualidad', showTitle: false}), hook: item.hook, durationInSeconds: duration};
  const propsFile = await savePropsFile(id, props);
  await writeFile(path.join(dir, 'publicacion.txt'), `${item.postText}\n`);
  return {propsFile, out: path.join(OUTPUT_DIR, `${String(n).padStart(2, '0')}-${id}.mp4`), log};
}

const [file] = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!file) throw new Error('Uso: node scripts/batch.mjs guiones/lote.json');
const items = JSON.parse(await readFile(file, 'utf8'));
const jobs = [];
for (const [i, item] of items.entries()) {
  try { jobs.push(await makeOne(item, i + 1, items.length)); }
  catch (e) { console.error(`[${item.slug}] ERROR: ${e.message}`); if (e.status === 401 || e.status === 429) throw e; }
}
if (!process.argv.includes('--no-render')) {
  for (const j of jobs) {
    if (await exists(j.out)) { j.log('ya renderizado'); continue; }
    j.log('renderizando…');
    await renderVideo(j.propsFile, j.out);
  }
}
console.log('Listo.');
