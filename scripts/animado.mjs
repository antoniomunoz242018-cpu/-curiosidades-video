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

const START = 0.15, END_PAD = 0.9, TEASER = 1.4; // TEASER igual que en src/AnimatedLayout.tsx
const exists = f => access(f).then(() => true, () => false);
const [file, slug] = process.argv.slice(2);
const item = JSON.parse(await readFile(file, 'utf8')).find(x => x.slug === slug);
if (!item) throw new Error(`No encuentro «${slug}» en ${file}`);
const dir = await jobDir(`anim-${slug}`);
let audioSrc, captions, duration;
const rawVoice = path.join(dir, 'voice-raw.mp3');
if (hasKey('TTS') || await exists(rawVoice)) {
  const raw = rawVoice;
  if (!await exists(raw)) { console.log('Voz…'); await synthesizeVoice(`anim-${slug}`, item.narration); }
  const voice = path.join(dir, 'voice.wav');
  if (!await exists(voice)) await run('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af', `adelay=${START * 1000}:all=1,apad=pad_dur=${END_PAD}`, '-ar', '24000', '-ac', '1', voice]);
  duration = Math.round(await audioDuration(voice) * 30) / 30;
  audioSrc = `jobs/anim-${slug}/voice-mix.wav`;
  // Mezcla final: voz + música de fondo que baja cuando habla + whoosh al inicio + impacto en el corte del avance.
  const audioDir = path.join(path.dirname(dir), '..', 'audio');
  if (!await exists(path.join(audioDir, 'musica-curiosidad.wav'))) await run('python3', ['-I', path.join(path.dirname(new URL(import.meta.url).pathname), 'musica.py'), audioDir]);
  await run('ffmpeg', ['-y', '-v', 'error', '-i', voice, '-stream_loop', '-1', '-i', path.join(audioDir, 'musica-curiosidad.wav'),
    '-i', path.join(audioDir, 'whoosh.wav'), '-i', path.join(audioDir, 'impacto.wav'), '-filter_complex',
    `[0:a]aresample=44100,asplit=2[v][sc];[1:a]volume=0.32,afade=t=out:st=${(duration - 1.2).toFixed(2)}:d=1.2[m];` +
    `[m][sc]sidechaincompress=threshold=0.03:ratio=5:attack=15:release=350[md];[2:a]volume=0.55[w];[3:a]adelay=${Math.round(TEASER * 1000) - 60}:all=1,volume=0.75[i];` +
    `[v][md][w][i]amix=inputs=4:normalize=0:duration=first,alimiter=limit=0.95`,
    '-t', String(duration), '-ar', '44100', '-ac', '1', path.join(dir, 'voice-mix.wav')]);
  const tfile = path.join(dir, 'transcription.json');
  let words;
  if (await exists(tfile)) words = JSON.parse(await readFile(tfile, 'utf8')).words;
  else if (!hasKey('WHISPER') || process.env.LOCAL_WHISPER !== '0') {
    // Sin clave: transcripción local gratuita con faster-whisper.
    console.log('Subtítulos (local)…');
    await run('python3', ['-I', path.join(path.dirname(new URL(import.meta.url).pathname), 'transcribir.py'), voice, tfile, item.narration]);
    words = JSON.parse(await readFile(tfile, 'utf8')).words;
  } else {
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
  images: [], brand: item.brand ?? 'No Es Casualidad', showTitle: false, hook: item.hook, safe: !!item.titles, captions, durationInSeconds: duration, demo: !audioSrc, ...(audioSrc ? {audioSrc} : {})};
const propsFile = await savePropsFile(`anim-${slug}`, props);
await renderVideo(propsFile, path.join(OUTPUT_DIR, `${process.env.OUT_PREFIX || 'animado-'}${slug}${audioSrc ? '' : '-preview'}.mp4`));
