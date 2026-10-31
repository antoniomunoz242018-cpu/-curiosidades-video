import 'dotenv/config';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderMedia} from '@remotion/renderer';
import {readFile, mkdir, rm} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {run} from '../lib/system.mjs';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function renderVideo(propsFile, outputFile, {onProgress} = {}) {
  const inputProps = JSON.parse(await readFile(propsFile, 'utf8'));
  const browserExecutable = process.env.CHROME_EXECUTABLE || undefined;
  // bundle() copia public/: se rehace en cada render para incluir imágenes y voces nuevas.
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
  const composition = await selectComposition({serveUrl, id: 'Curiosidad', inputProps, browserExecutable});
  await mkdir(path.dirname(outputFile), {recursive: true});
  const rawOutput = path.join(path.dirname(outputFile), `.render-${randomUUID()}.mp4`);
  let last = -1;
  await renderMedia({
    composition, serveUrl, inputProps, outputLocation: rawOutput,
    codec: 'h264', audioCodec: 'aac', pixelFormat: 'yuv420p', crf: 20,
    browserExecutable, concurrency: Number(process.env.RENDER_CONCURRENCY || 2),
    onProgress: ({progress}) => {
      onProgress?.(progress);
      const step = Math.floor(progress * 10);
      if (step > last) { console.log(`Render ${Math.min(step * 10, 100)}%`); last = step; }
    },
  });
  try {
    // AAC puede añadir muestras de relleno: fijar el contenedor a 40 s.
    await run('ffmpeg', ['-y', '-v', 'error', '-i', rawOutput, '-t', '40', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputFile]);
  } finally { await rm(rawOutput, {force: true}); }
  console.log(`MP4: ${outputFile}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  (async () => {
    const latest = process.argv[2] || JSON.parse(await readFile(path.join(root, 'output/latest.json'), 'utf8')).propsFile;
    await renderVideo(path.resolve(root, latest), path.resolve(root, process.argv[3] || 'output/video.mp4'));
  })().catch(e => {console.error(`Error de render: ${e.message}`); process.exitCode = 1;});
}
