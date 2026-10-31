// Vídeo "dibujado con código": escena animada de src/scenes + voz + subtítulos. Sin imágenes.
// Uso: node scripts/animado.mjs guiones/lote-1.json ventanas-redondas
// Sin clave de OpenAI genera una vista previa sin voz con tiempos estimados.
import {readFile, writeFile, access} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';
import {synthesizeVoice, savePropsFile, jobDir, estimatedCaptions, hasKey, OUTPUT_DIR} from '../lib/pipeline.mjs';
import {captionsFromWords} from '../lib/timing.mjs';
import {audioDuration, run} from '../lib/system.mjs';
import {renderVideo} from './render.mjs';

const START = 0.15, END_PAD = 0.9;
const exists = f => access(f).then(() => true, () => false);
const [file, slug] = process.argv.slice(2);
const item = JSON.parse(await readFile(file, 'utf8')).find(x => x.slug === slug);
if (!item) throw new Error(`No encuentro «${slug}» en ${file}`);
const dir = await jobDir(`anim-${slug}`);
let audioSrc, captions, duration;
if (hasKey('TTS')) {
  const raw = path.join(dir, 'voice-raw.mp3');
  if (!await exists(raw)) { console.log('Voz…'); await synthesizeVoice(`anim-${slug}`, item.narration); }
  const voice = path.join(dir, 'voice.wav');
  if (!await exists(voice)) await run('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af', `adelay=${START * 1000}:all=1,apad=pad_dur=${END_PAD}`, '-ar', '24000', '-ac', '1', voice]);
  duration = Math.round(await audioDuration(voice) * 30) / 30;
  audioSrc = `jobs/anim-${slug}/voice.wav`;
  const tfile = path.join(dir, 'transcription.json');
  let words;
  if (await exists(tfile)) words = JSON.parse(await readFile(tfile, 'utf8')).words;
  else {
    console.log('Subtítulos…');
    const client = new OpenAI({apiKey: process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY, maxRetries: 2});
    const tr = await client.audio.transcriptions.create({file: createReadStream(voice), model: 'whisper-1', language: 'es', response_format: 'verbose_json', timestamp_granularities: ['word'], prompt: item.narration});
    await writeFile(tfile, JSON.stringify(tr, null, 2));
    words = tr.words;
  }
  const tokens = item.narration.split(/\s+/).filter(Boolean);
  if (words.length === tokens.length) words = words.map((w, i) => ({...w, word: tokens[i]}));
  captions = captionsFromWords(words, duration);
} else {
  const span = item.narration.split(/\s+/).length / 2.7;
  duration = Math.round((START + span + END_PAD) * 30) / 30;
  captions = estimatedCaptions(item.narration, {start: START, span, duration});
}
const props = {title: item.title, narration: item.narration, object: 'bulb', accent: item.accent || 'amber', layout: 'animacion', scene: slug,
  images: [], brand: item.brand ?? 'No Es Casualidad', showTitle: false, hook: item.hook, captions, durationInSeconds: duration, demo: !audioSrc, ...(audioSrc ? {audioSrc} : {})};
const propsFile = await savePropsFile(`anim-${slug}`, props);
await renderVideo(propsFile, path.join(OUTPUT_DIR, `animado-${slug}${audioSrc ? '' : '-preview'}.mp4`));
