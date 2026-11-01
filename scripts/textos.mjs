// Textos listos para copiar en TikTok, YouTube Shorts y Facebook a partir de un lote de guiones.
// Uso: node scripts/textos.mjs guiones/lote-2.json > output/lote-2-publicar.txt
import {readFile} from 'node:fs/promises';

const [file] = process.argv.slice(2);
const items = JSON.parse(await readFile(file, 'utf8'));
const base = ['NoEsCasualidad', 'SabiasQue', 'Curiosidades'];
const line = '━'.repeat(32);
const out = items.map((x, i) => {
  const tags = [...base, ...(x.tags || [])];
  const firstSentence = x.narration.split(/(?<=[.!?])\s/)[0];
  return `${line}
VIDEO ${i + 1}: ${x.title.toUpperCase()}
Archivo: reel-${x.slug}.mp4
${line}

▶ TIKTOK
${x.titles.tiktok}
${x.postText} 👇
${tags.slice(0, 5).map(t => '#' + t).join(' ')} #fyp

▶ YOUTUBE SHORTS
Título:
${x.titles.youtube}
Descripción:
${firstSentence} En este video te explico por qué, en menos de un minuto.
Suscríbete para descubrir el porqué de las cosas de todos los días.
${tags.slice(0, 6).map(t => '#' + t).join(' ')} #Shorts

▶ FACEBOOK
${x.titles.facebook}
${x.postText} ¿Tú lo sabías? 👇
${tags.slice(0, 6).map(t => '#' + t).join(' ')} #Reels
`;
}).join('\n');
console.log(`TEXTOS PARA PUBLICAR · No Es Casualidad\nPublica 1 video al día (7–9 pm). Mismo video en las tres plataformas.\n\n${out}`);
