const $ = s => document.querySelector(s);
const ACCENT_NAMES = {amber: 'Amarillo', cyan: 'Cian', violet: 'Violeta'};
const OBJECT_NAMES = {planet: 'Planeta', atom: 'Átomo', bulb: 'Bombilla', brain: 'Cerebro', crystal: 'Cristal', ocean: 'Océano'};
let config, job = null, saveTimer = null, pollTimer = null, savePromise = Promise.resolve();

// ---------- API ----------
async function api(path, {method = 'GET', json, body, headers} = {}) {
  const res = await fetch(path, {method, headers: json ? {'Content-Type': 'application/json'} : headers, body: json ? JSON.stringify(json) : body});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}
function toast(msg, ok = false) {
  const t = $('#toast');
  t.textContent = msg; t.className = ok ? 'toast ok' : 'toast'; t.hidden = false;
  clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, ok ? 2500 : 7000);
}
async function busy(btn, label, fn) {
  const old = btn.innerHTML;
  btn.disabled = true; btn.textContent = label;
  try { return await fn(); } catch (e) { toast(e.message); } finally { btn.disabled = false; btn.innerHTML = old; }
}

// ---------- Lista de proyectos ----------
async function loadList() {
  const list = await api('/api/jobs');
  $('#job-list').innerHTML = '';
  for (const j of list) {
    const li = document.createElement('li');
    if (job?.id === j.id) li.className = 'active';
    li.innerHTML = `${j.thumb ? `<img src="/media/${j.thumb}" alt="">` : '<div class="ph"></div>'}<div><div class="t"></div><div class="s"></div></div>`;
    li.querySelector('.t').textContent = j.title;
    li.querySelector('.s').textContent = {draft: 'Borrador', working: 'Procesando…', done: '✓ Vídeo listo', error: '⚠ Error'}[j.status] || j.status;
    li.onclick = () => openJob(j.id);
    $('#job-list').append(li);
  }
}

// ---------- Editor ----------
function showStart() {
  job = null; clearInterval(pollTimer);
  $('#start').hidden = false; $('#editor').hidden = true;
  history.replaceState(null, '', '/');
  loadList();
}
async function openJob(id) {
  await flushSave();
  try { setJob(await api(`/api/jobs/${id}`), true); } catch (e) { toast(e.message); showStart(); }
}
function setJob(j, full = false) {
  job = j;
  $('#start').hidden = true; $('#editor').hidden = false;
  history.replaceState(null, '', `#${j.id}`);
  if (full) fillForm();
  renderScenes(); renderStatus(); loadList();
}
function fillForm() {
  const s = job.script;
  $('#title').value = s.title; $('#narration').value = s.narration; $('#post-text').value = s.postText || '';
  $('#layout').value = job.layout; $('#accent').value = s.accent; $('#object').value = s.object;
  $('#brand').value = job.brand || ''; $('#show-title').checked = !!job.showTitle;
  document.querySelectorAll('input[name=voice]').forEach(r => r.checked = r.value === job.voice.mode);
  const prev = $('#voice-preview');
  if (job.voice.upload) { prev.src = `/media/jobs/${job.id}/${job.voice.upload}?v=${Date.now()}`; prev.hidden = false; $('#voice-status').textContent = `Audio cargado: ${job.voice.seconds?.toFixed(1)} s`; }
  else { prev.hidden = true; prev.removeAttribute('src'); $('#voice-status').textContent = 'Lee la narración en 30–50 s; se ajusta a 40 s.'; }
  updateDerived();
}
function updateDerived() {
  const words = $('#narration').value.trim().split(/\s+/).filter(Boolean).length;
  const wc = $('#word-count');
  wc.textContent = `${words} palabras · objetivo 88–100`;
  wc.className = `pill ${words >= 80 && words <= 110 ? 'ok' : 'warn'}`;
  $('#object-wrap').hidden = $('#layout').value !== 'clasico';
  const mode = document.querySelector('input[name=voice]:checked')?.value;
  $('#upload-box').hidden = mode !== 'upload';
}
function collect() {
  return {
    script: {
      title: $('#title').value, narration: $('#narration').value, postText: $('#post-text').value,
      accent: $('#accent').value, object: $('#object').value,
      scenes: [...document.querySelectorAll('.scene textarea')].map(t => ({prompt: t.value})),
    },
    layout: $('#layout').value, brand: $('#brand').value, showTitle: $('#show-title').checked,
    voiceMode: document.querySelector('input[name=voice]:checked')?.value,
  };
}
function scheduleSave() {
  updateDerived();
  clearTimeout(saveTimer);
  $('#save-state').textContent = 'Cambios sin guardar…';
  saveTimer = setTimeout(() => flushSave(), 700);
}
async function flushSave() {
  if (!job || $('#save-state').textContent !== 'Cambios sin guardar…') return savePromise;
  clearTimeout(saveTimer);
  const body = collect();
  savePromise = savePromise.then(async () => {
    try {
      const updated = await api(`/api/jobs/${job.id}`, {method: 'PUT', json: body});
      job = updated; $('#save-state').textContent = '✓ Guardado';
      loadList();
    } catch (e) { $('#save-state').textContent = '⚠ No guardado'; toast(e.message); throw e; }
  });
  return savePromise;
}

// ---------- Escenas ----------
function renderScenes() {
  const box = $('#scenes');
  box.innerHTML = '';
  job.script.scenes.forEach((scene, i) => {
    const img = job.images[i];
    const el = document.createElement('div');
    el.className = 'scene';
    el.innerHTML = `
      <div class="n"><span>Escena ${i + 1}</span>${job.script.scenes.length > 1 ? '<button class="btn ghost danger rm" title="Quitar escena" style="padding:0 6px">✕</button>' : ''}</div>
      <div class="frame">${img ? `<img src="/media/${img}" alt="">` : 'Sin imagen'}</div>
      <textarea rows="3" placeholder="Describe la imagen (en inglés funciona mejor): close-up of a tape measure hook…"></textarea>
      <div class="tools">
        <button class="btn gen" ${config.keys.image ? '' : 'disabled title="Falta la clave de API de imágenes"'}>✨ Generar</button>
        <label class="btn">📁 Subir<input type="file" accept="image/png,image/jpeg,image/webp" hidden></label>
        ${img ? '<button class="btn clear" title="Quitar imagen">🗑</button>' : ''}
      </div>`;
    const ta = el.querySelector('textarea');
    ta.value = scene.prompt; ta.oninput = scheduleSave;
    const frame = el.querySelector('.frame');
    const working = (label) => { const b = document.createElement('div'); b.className = 'busy'; b.textContent = label; frame.append(b); return b; };
    el.querySelector('.gen').onclick = async (e) => {
      await flushSave();
      const veil = working('Generando… (≈30 s)');
      await busy(e.currentTarget, '…', async () => setJob(await api(`/api/jobs/${job.id}/images/${i}/generate`, {method: 'POST', json: {prompt: ta.value}})));
      veil.remove();
    };
    el.querySelector('input[type=file]').onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      await flushSave();
      const veil = working('Subiendo…');
      try { setJob(await api(`/api/jobs/${job.id}/images/${i}`, {method: 'POST', body: file, headers: {'Content-Type': file.type}})); }
      catch (err) { toast(err.message); } finally { veil.remove(); }
    };
    el.querySelector('.clear')?.addEventListener('click', async () => {
      await flushSave();
      try { setJob(await api(`/api/jobs/${job.id}/images/${i}`, {method: 'DELETE'})); } catch (err) { toast(err.message); }
    });
    el.querySelector('.rm')?.addEventListener('click', async () => {
      await flushSave();
      try { setJob(await api(`/api/jobs/${job.id}/scenes/${i}`, {method: 'DELETE'})); } catch (err) { toast(err.message); }
    });
    box.append(el);
  });
  $('#add-scene').disabled = job.script.scenes.length >= config.maxScenes;
}
// ---------- Voz ----------
let recorder = null;
async function toggleRecording() {
  const btn = $('#rec-btn');
  if (recorder) { recorder.stop(); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({audio: true}); }
  catch { return toast('No se pudo acceder al micrófono. Revisa los permisos del navegador.'); }
  const chunks = [];
  recorder = new MediaRecorder(stream);
  const started = Date.now();
  const tick = setInterval(() => btn.textContent = `⏹ Detener (${Math.round((Date.now() - started) / 1000)} s)`, 250);
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = async () => {
    clearInterval(tick); stream.getTracks().forEach(t => t.stop());
    const type = (recorder.mimeType || 'audio/webm').split(';')[0];
    recorder = null; btn.textContent = '🎙️ Grabar';
    await uploadVoice(new Blob(chunks, {type}));
  };
  recorder.start();
}
async function uploadVoice(blob) {
  await flushSave();
  $('#voice-status').textContent = 'Subiendo audio…';
  try { setJob(await api(`/api/jobs/${job.id}/voice`, {method: 'POST', body: blob, headers: {'Content-Type': blob.type || 'audio/webm'}}), true); toast('Audio guardado', true); }
  catch (e) { toast(e.message); $('#voice-status').textContent = 'No se pudo cargar el audio.'; }
}

// ---------- Render ----------
function renderStatus() {
  const p = $('#progress'), r = $('#result');
  const working = job.status === 'working';
  $('#render-btn').disabled = working;
  p.hidden = !working && job.status !== 'error';
  p.querySelector('div').style.width = `${Math.round((job.progress || 0) * 100)}%`;
  p.querySelector('span').textContent = job.status === 'error' ? `⚠ ${job.error}` : job.step;
  p.querySelector('div').style.background = job.status === 'error' ? 'var(--danger)' : '';
  if (job.status === 'error') p.querySelector('div').style.width = '100%';
  r.hidden = !job.video || working;
  if (job.video && !working && !$('#video').src.endsWith(job.video)) {
    $('#video').src = job.video;
    $('#download').href = `${job.video.split('?')[0]}?download=1`;
  }
  clearInterval(pollTimer);
  if (working) pollTimer = setInterval(async () => {
    try {
      const j = await api(`/api/jobs/${job.id}`);
      if (j.id !== job?.id) return;
      job = j; renderStatus();
      if (j.status !== 'working') { loadList(); j.status === 'done' ? toast('¡Vídeo listo!', true) : toast(j.error); }
    } catch {}
  }, 1500);
}

// ---------- Arranque ----------
async function init() {
  config = await api('/api/config');
  const names = {llm: 'Guion IA', image: 'Imágenes IA', tts: 'Voz IA', whisper: 'Sincronía IA'};
  $('#keys').innerHTML = Object.entries(config.keys).map(([k, on]) => `<span class="${on ? 'on' : ''}">${on ? '●' : '○'} ${names[k]}</span>`).join('');
  $('#accent').innerHTML = config.accents.map(a => `<option value="${a}">${ACCENT_NAMES[a] || a}</option>`).join('');
  $('#object').innerHTML = config.objects.map(o => `<option value="${o}">${OBJECT_NAMES[o] || o}</option>`).join('');
  if (!config.keys.llm) $('#ai-btn').title = 'Falta la clave de API (OPENAI_API_KEY en .env)';
  if (!config.keys.tts) $('#tts-note').textContent = '(requiere clave de API)';

  $('#new-btn').onclick = async () => { await flushSave(); showStart(); $('#topic').focus(); };
  const create = manual => async (e) => busy(e.currentTarget, manual ? 'Creando…' : 'Escribiendo guion…', async () => {
    const j = await api('/api/jobs', {method: 'POST', json: {topic: $('#topic').value, scenes: Number($('#scene-count').value), manual}});
    $('#topic').value = ''; setJob(j, true);
  });
  $('#ai-btn').onclick = create(false);
  $('#manual-btn').onclick = create(true);
  for (const id of ['#title', '#narration', '#post-text', '#brand']) $(id).oninput = scheduleSave;
  for (const id of ['#layout', '#accent', '#object', '#show-title']) $(id).onchange = scheduleSave;
  document.querySelectorAll('input[name=voice]').forEach(r => r.onchange = scheduleSave);
  $('#copy-btn').onclick = async () => { await navigator.clipboard.writeText($('#post-text').value).then(() => toast('Texto copiado', true), () => toast('No se pudo copiar')); };
  $('#add-scene').onclick = async () => {
    const body = collect(); body.script.scenes.push({prompt: ''});
    try { setJob(await api(`/api/jobs/${job.id}`, {method: 'PUT', json: body})); } catch (e) { toast(e.message); }
  };
  $('#delete-btn').onclick = async () => {
    if (!confirm('¿Borrar este proyecto y su vídeo?')) return;
    try { clearTimeout(saveTimer); $('#save-state').textContent = ''; await api(`/api/jobs/${job.id}`, {method: 'DELETE'}); showStart(); } catch (e) { toast(e.message); }
  };
  $('#rec-btn').onclick = toggleRecording;
  $('#voice-file').onchange = e => e.target.files[0] && uploadVoice(e.target.files[0]);
  $('#render-btn').onclick = async (e) => busy(e.currentTarget, 'Iniciando…', async () => {
    await flushSave();
    setJob(await api(`/api/jobs/${job.id}/render`, {method: 'POST'}));
  });
  window.addEventListener('beforeunload', () => flushSave());

  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h && h !== job?.id) openJob(h); });
  const id = location.hash.slice(1);
  if (id) openJob(id); else showStart();
}
init().catch(e => toast(`No se pudo conectar con el servidor: ${e.message}`));
