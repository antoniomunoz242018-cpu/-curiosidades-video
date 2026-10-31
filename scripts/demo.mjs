// Demostración sin llamadas ni claves: los tiempos de subtítulos son estimados, no Whisper.
// Uso: npm run demo [-- --no-render] [-- --image ruta1.jpg --image ruta2.png]
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {buildProps, estimatedCaptions, saveImage, savePropsFile, OUTPUT_DIR} from '../lib/pipeline.mjs';
import {renderVideo} from './render.mjs';

const args = process.argv.slice(2);
const imagePaths = args.flatMap((a, i) => a === '--image' && args[i + 1] ? [args[i + 1]] : []);
const narration = '¿Sabías que el gancho de tu flexómetro está flojo a propósito? No está descompuesto. Ese pequeño juego mide exactamente lo mismo que el grosor del gancho. Cuando empujas la cinta contra una pared, el gancho se desliza hacia dentro y su grosor deja de contar. Cuando lo enganchas en el borde de una tabla y tiras, se desliza hacia fuera y su grosor sí se suma. Así, la medida es correcta en los dos casos. Por eso, nunca lo aprietes ni lo arregles con un martillo: le quitarías su precisión.';
const script = {title: 'El gancho flojo de tu flexómetro', narration, object: 'crystal', accent: 'amber', postText: '', scenes: []};
const images = [];
for (const [i, file] of imagePaths.entries()) images.push(await saveImage('demo', i, await readFile(path.resolve(file))));
const props = buildProps(script, {images, captions: estimatedCaptions(narration), brand: images.length ? 'Curiosidades' : ''});
const propsFile = await savePropsFile('demo', props);
console.log(`Demo sin voz; subtítulos con tiempos estimados. Diseño: ${props.layout}.`);
if (!args.includes('--no-render')) await renderVideo(propsFile, path.join(OUTPUT_DIR, 'demo.mp4'));
