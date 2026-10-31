// App web local para crear vídeos de curiosidades paso a paso.
// Uso: npm start  →  http://localhost:3000
import 'dotenv/config';
import http from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile, writeFile, stat, readdir, rm} from 'node:fs/promises';
import path from 'node:path';
import {
  ROOT, JOBS_DIR, OUTPUT_DIR, OBJECTS, ACCENTS, MAX_SCENES, ScriptSchema,
  writeScript, generateImage, saveImage, saveVoiceUpload, synthesizeVoice, fitVoice, transcribe,
  estimatedCaptions, buildProps, savePropsFile, newJobId, jobDir, hasKey,
} from './lib/pipeline.mjs';
import {renderVideo} from './scripts/render.mjs';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const WEB_DIR = path.join(ROOT, 'web');
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.json': 'application/json'};

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

// ---------- Estado de los trabajos (persistido en public/jobs/<id>/job.json) ----------
const jobs = new Map();
const jobFile = id => path.join(JOBS_DIR, id, 'job.json');
async function loadJob(id) {
  if (!/^[\w-]{1,80}$/.test(id)) throw new HttpError(400, 'Identificador inválido');
  if (jobs.has(id)) return jobs.get(id);
  try {
    const job = JSON.parse(await readFile(jobFile(id), 'utf8'));
    if (job.status === 'working') Object.assign(job, {status: 'error', error: 'El servidor se reinició durante el proceso. Vuelve a intentarlo.'});
    jobs.set(id, job);
    return job;
  } catch { throw new HttpError(404, 'Proyecto no encontrado'); }
}
async function saveJob(job) {
  job.updatedAt = new Date().toISOString();
  await jobDir(job.id);
  await writeFile(jobFile(job.id), JSON.stringify(job, null, 2));
  return job;
}
function newJob(topic, script) {
  return {
    id: newJobId(), topic, createdAt: new Date().toISOString(), script,
    images: script.scenes.map(() => null), brand: '', layout: 'foto', showTitle: false,
    voice: {mode: hasKey('TTS') ? 'tts' : 'none'}, status: 'draft', step: '', progress: 0, error: '', video: '',
  };
}
const emptyScript = () => ScriptSchema.parse({title: 'Nueva curiosidad', narration: 'Escribe aquí la narración del vídeo, entre 88 y 100 palabras.', scenes: [{prompt: ''}, {prompt: ''}, {prompt: ''}]});

// Los renders se ejecutan de uno en uno: Remotion ya usa varios procesos de Chrome.
let queue = Promise.resolve();
function enqueue(job, task) {
  Object.assign(job, {status: 'working', step: 'En cola…', progress: 0, error: ''});
  queue = queue.then(async () => {
    try { await task(); }
    catch (e) { Object.assign(job, {status: 'error', error: e.message, step: ''}); console.error(`[${job.id}]`, e); }
    finally { await saveJob(job).catch(() => {}); }
  });
}
const setStep = (job, step, progress) => { Object.assign(job, {step, progress}); console.log(`[${job.id}] ${step}`); };

async function produce(job) {
  const {id, script} = job;
  let audioSrc, captions;
  const mode = job.voice.mode;
  if (mode === 'tts' || mode === 'upload') {
    let raw;
    if (mode === 'tts') {
      setStep(job, 'Sintetizando voz…', 0.03);
      raw = await synthesizeVoice(id, script.narration);
    } else {
      if (!job.voice.upload) throw new Error('Sube primero tu grabación de voz');
      raw = path.join(JOBS_DIR, id, job.voice.upload);
    }
    setStep(job, 'Ajustando la voz a 40 segundos…', 0.08);
    const voice = await fitVoice(id, raw);
    audioSrc = `jobs/${id}/voice.wav`;
    if (hasKey('WHISPER')) {
      setStep(job, 'Sincronizando subtítulos con Whisper…', 0.12);
      captions = await transcribe(voice, script.narration);
    } else {
      captions = estimatedCaptions(script.narration);
    }
  } else {
    captions = estimatedCaptions(script.narration);
  }
  const images = job.images.filter(Boolean);
  const props = buildProps(script, {images, audioSrc, captions, layout: job.layout, brand: job.brand, showTitle: job.showTitle});
  const propsFile = await savePropsFile(id, props);
  setStep(job, 'Preparando el render…', 0.18);
  const file = `${id}.mp4`;
  await renderVideo(propsFile, path.join(OUTPUT_DIR, file), {onProgress: p => setStep(job, `Renderizando vídeo… ${Math.round(p * 100)} %`, 0.2 + p * 0.78)});
  Object.assign(job, {status: 'done', step: '¡Vídeo listo!', progress: 1, video: `/media/output/${file}?v=${Date.now()}`});
}

// ---------- Utilidades HTTP ----------
async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, `El archivo supera ${Math.round(limit / 1e6)} MB`);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function readJson(req) {
  try { return JSON.parse((await readBody(req, 1e6)).toString('utf8') || '{}'); }
  catch (e) { throw e instanceof HttpError ? e : new HttpError(400, 'JSON inválido'); }
}
function send(res, status, data) {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
  res.end(JSON.stringify(data));
}
async function sendFile(req, res, file, {download} = {}) {
  let info;
  try { info = await stat(file); if (!info.isFile()) throw new Error(); } catch { throw new HttpError(404, 'No encontrado'); }
  const headers = {'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache'};
  if (download) headers['Content-Disposition'] = `attachment; filename="${path.basename(file)}"`;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : info.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : info.size - 1;
    start = Math.max(0, start); end = Math.min(end, info.size - 1);
    if (start > end) { res.writeHead(416, {'Content-Range': `bytes */${info.size}`}); return res.end(); }
    res.writeHead(206, {...headers, 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Content-Length': end - start + 1});
    return createReadStream(file, {start, end}).pipe(res);
  }
  res.writeHead(200, {...headers, 'Content-Length': info.size});
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}
const inside = (base, rel) => {
  const file = path.resolve(base, rel);
  if (!file.startsWith(base + path.sep)) throw new HttpError(403, 'Ruta no permitida');
  return file;
};
const sceneIndex = (job, n) => {
  const i = Number(n);
  if (!Number.isInteger(i) || i < 0 || i >= MAX_SCENES) throw new HttpError(400, 'Escena inválida');
  while (job.script.scenes.length <= i) job.script.scenes.push({prompt: ''});
  while (job.images.length < job.script.scenes.length) job.images.push(null);
  return i;
};
const assertIdle = job => { if (job.status === 'working') throw new HttpError(409, 'El proyecto se está procesando; espera a que termine'); };

// ---------- Rutas ----------
const routes = [
  ['GET', /^\/api\/config$/, async () => ({
    keys: {llm: hasKey('LLM'), image: hasKey('IMAGE'), tts: hasKey('TTS'), whisper: hasKey('WHISPER')},
    objects: OBJECTS, accents: ACCENTS, maxScenes: MAX_SCENES,
  })],
  ['GET', /^\/api\/jobs$/, async () => {
    const ids = (await readdir(JOBS_DIR, {withFileTypes: true}).catch(() => [])).filter(d => d.isDirectory()).map(d => d.name);
    const list = [];
    for (const id of ids) {
      try { const j = await loadJob(id); list.push({id, title: j.script.title, status: j.status, updatedAt: j.updatedAt, thumb: j.images.find(Boolean) || null}); } catch {}
    }
    return list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 50);
  }],
  ['POST', /^\/api\/jobs$/, async (req) => {
    const {topic = '', scenes = 3, manual = false} = await readJson(req);
    const clean = String(topic).trim().slice(0, 500);
    let script;
    if (manual) {
      script = emptyScript();
      if (clean) script.title = clean.slice(0, 65).padEnd(3, '.');
    } else {
      if (!clean) throw new HttpError(400, 'Escribe un tema');
      if (!hasKey('LLM')) throw new HttpError(400, 'No hay clave de API para escribir el guion. Añádela en .env o usa «Escribir yo el guion».');
      script = await writeScript(clean, {scenes});
    }
    return saveJob(newJob(clean, script));
  }],
  ['GET', /^\/api\/jobs\/([\w-]+)$/, async (req, [id]) => loadJob(id)],
  ['DELETE', /^\/api\/jobs\/([\w-]+)$/, async (req, [id]) => {
    const job = await loadJob(id);
    assertIdle(job);
    jobs.delete(id);
    await rm(path.join(JOBS_DIR, id), {recursive: true, force: true});
    await rm(path.join(OUTPUT_DIR, `${id}.mp4`), {force: true});
    return {ok: true};
  }],
  ['PUT', /^\/api\/jobs\/([\w-]+)$/, async (req, [id]) => {
    const job = await loadJob(id);
    assertIdle(job);
    const body = await readJson(req);
    const parsed = ScriptSchema.safeParse({...job.script, ...body.script});
    if (!parsed.success) throw new HttpError(400, `Revisa el guion: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    job.script = parsed.data;
    job.images = job.script.scenes.map((_, i) => job.images[i] ?? null);
    if (typeof body.brand === 'string') job.brand = body.brand.slice(0, 40);
    if (['foto', 'clasico'].includes(body.layout)) job.layout = body.layout;
    if (typeof body.showTitle === 'boolean') job.showTitle = body.showTitle;
    if (['tts', 'upload', 'none'].includes(body.voiceMode)) job.voice.mode = body.voiceMode;
    if (job.status === 'error') Object.assign(job, {status: 'draft', error: ''});
    return saveJob(job);
  }],
  ['POST', /^\/api\/jobs\/([\w-]+)\/images\/(\d+)\/generate$/, async (req, [id, n]) => {
    const job = await loadJob(id);
    assertIdle(job);
    const i = sceneIndex(job, n);
    if (!hasKey('IMAGE')) throw new HttpError(400, 'No hay clave de API para generar imágenes. Sube tus propias imágenes.');
    const body = await readJson(req);
    if (typeof body.prompt === 'string') job.script.scenes[i].prompt = body.prompt.slice(0, 800);
    job.images[i] = await generateImage(id, i, job.script.scenes[i].prompt);
    return saveJob(job);
  }],
  ['POST', /^\/api\/jobs\/([\w-]+)\/images\/(\d+)$/, async (req, [id, n]) => {
    const job = await loadJob(id);
    assertIdle(job);
    const i = sceneIndex(job, n);
    try { job.images[i] = await saveImage(id, i, await readBody(req, 20e6)); }
    catch (e) { throw e instanceof HttpError ? e : new HttpError(400, e.message); }
    return saveJob(job);
  }],
  ['DELETE', /^\/api\/jobs\/([\w-]+)\/images\/(\d+)$/, async (req, [id, n]) => {
    const job = await loadJob(id);
    assertIdle(job);
    job.images[sceneIndex(job, n)] = null;
    return saveJob(job);
  }],
  ['DELETE', /^\/api\/jobs\/([\w-]+)\/scenes\/(\d+)$/, async (req, [id, n]) => {
    const job = await loadJob(id);
    assertIdle(job);
    const i = sceneIndex(job, n);
    if (job.script.scenes.length <= 1) throw new HttpError(400, 'El vídeo necesita al menos una escena');
    job.script.scenes.splice(i, 1);
    job.images.splice(i, 1);
    return saveJob(job);
  }],
  ['POST', /^\/api\/jobs\/([\w-]+)\/voice$/, async (req, [id]) => {
    const job = await loadJob(id);
    assertIdle(job);
    let saved;
    try { saved = await saveVoiceUpload(id, await readBody(req, 60e6), req.headers['content-type']); }
    catch (e) { throw e instanceof HttpError ? e : new HttpError(400, e.message); }
    job.voice = {mode: 'upload', upload: path.basename(saved.file), seconds: saved.seconds};
    return saveJob(job);
  }],
  ['POST', /^\/api\/jobs\/([\w-]+)\/render$/, async (req, [id]) => {
    const job = await loadJob(id);
    assertIdle(job);
    if (job.voice.mode === 'tts' && !hasKey('TTS')) throw new HttpError(400, 'No hay clave de API para la voz. Sube tu grabación o elige «Sin voz».');
    if (job.layout === 'foto' && !job.images.some(Boolean)) throw new HttpError(400, 'Añade al menos una imagen o elige el diseño «Ilustración».');
    enqueue(job, () => produce(job));
    await saveJob(job);
    return job;
  }],
];

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.startsWith('/api/')) {
      for (const [method, pattern, handler] of routes) {
        const m = pattern.exec(pathname);
        if (m && method === req.method) return send(res, 200, await handler(req, m.slice(1)));
      }
      throw new HttpError(404, 'Ruta no encontrada');
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Método no permitido');
    if (pathname.startsWith('/media/jobs/')) return await sendFile(req, res, inside(JOBS_DIR, pathname.slice('/media/jobs/'.length)));
    if (pathname.startsWith('/media/output/')) return await sendFile(req, res, inside(OUTPUT_DIR, pathname.slice('/media/output/'.length)), {download: url.searchParams.has('download')});
    return await sendFile(req, res, inside(WEB_DIR, pathname === '/' ? 'index.html' : pathname.slice(1)));
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    // Los errores de las APIs externas (OpenAI) llegan con su propio estado.
    if (!res.headersSent) send(res, status >= 400 && status < 600 ? status : 500, {error: e.message || 'Error interno'});
    else res.end();
  }
});
server.listen(PORT, HOST, () => console.log(`Estudio de curiosidades en http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`));
