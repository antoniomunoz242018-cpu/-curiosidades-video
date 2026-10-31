import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {
  writeScript, generateImage, synthesizeVoice, fitVoice, transcribe, buildProps, savePropsFile,
  newJobId, jobDir, hasKey, OUTPUT_DIR,
} from '../lib/pipeline.mjs';
import {run} from '../lib/system.mjs';
import {renderVideo} from './render.mjs';

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter(a => a.startsWith('--')));
  const topic = args.filter(a => !a.startsWith('--')).join(' ').trim();
  if (!topic || topic.length > 500) throw new Error('Uso: npm run generate -- "Tema (máx. 500 caracteres)" [--no-render] [--no-images]');
  const withImages = !flags.has('--no-images');
  for (const type of ['LLM', 'TTS', 'WHISPER', ...(withImages ? ['IMAGE'] : [])]) {
    if (!hasKey(type)) throw new Error(`Configura ${type}_API_KEY u OPENAI_API_KEY en .env`);
  }
  await run('ffmpeg', ['-version'], true);
  await run('ffprobe', ['-version'], true);
  const id = newJobId();
  const dir = await jobDir(id);
  const total = withImages ? 6 : 5;
  let step = 0;
  const log = msg => console.log(`${++step}/${total} · ${msg}`);

  log('Escribiendo guion en español…');
  const script = await writeScript(topic);
  await writeFile(path.join(dir, 'script.json'), JSON.stringify({topic, ...script}, null, 2));
  console.log(`   Texto para la publicación: ${script.postText}`);

  const images = [];
  if (withImages) {
    log(`Generando ${script.scenes.length} imágenes…`);
    for (const [i, scene] of script.scenes.entries()) images.push(await generateImage(id, i, scene.prompt));
  }
  log('Sintetizando voz…');
  const raw = await synthesizeVoice(id, script.narration);
  log('Ajustando voz a 40 segundos…');
  const voice = await fitVoice(id, raw);
  log('Sincronizando palabras con Whisper…');
  const captions = await transcribe(voice, script.narration);
  const props = buildProps(script, {images, audioSrc: `jobs/${id}/voice.wav`, captions});
  const propsFile = await savePropsFile(id, props);
  console.log(`Props guardadas: ${propsFile}`);
  if (!flags.has('--no-render')) {
    log('Renderizando MP4…');
    await renderVideo(propsFile, path.join(OUTPUT_DIR, `${id}.mp4`));
  }
}
main().catch(e => { console.error(`Error: ${e.message}`); process.exitCode = 1; });
