export const DURATION = 40;
export const VOICE_START = 0.5;
export const VOICE_DURATION = 39;

// atempo admite factores entre 0.5 y 2 en todas las versiones soportadas.
export function tempoFilters(factor) {
  if (!Number.isFinite(factor) || factor <= 0) throw new Error('Duración de audio inválida');
  const filters = [];
  while (factor > 2) { filters.push('atempo=2'); factor /= 2; }
  while (factor < 0.5) { filters.push('atempo=0.5'); factor /= 0.5; }
  filters.push(`atempo=${factor.toFixed(8)}`);
  return filters.join(',');
}

export function captionsFromWords(words, duration = DURATION) {
  if (!Array.isArray(words) || !words.length) throw new Error('Whisper no devolvió marcas de palabras');
  const clean = words.map(w => ({text: String(w.word ?? w.text ?? '').trim(), start: Number(w.start), end: Number(w.end)}))
    .filter(w => w.text && Number.isFinite(w.start) && Number.isFinite(w.end) && w.start >= 0 && w.end > w.start && w.start < duration)
    .sort((a, b) => a.start - b.start);
  if (!clean.length) throw new Error('No hay palabras con marcas de tiempo válidas');
  const groups = [];
  let group = [];
  for (const word of clean) {
    const length = [...group, word].map(w => w.text).join(' ').length;
    if (group.length && (group.length >= 4 || length > 24 || word.start - group[0].start > 2.3 || word.start - group.at(-1).end > 0.45)) {
      groups.push(group); group = [];
    }
    group.push({...word, end: Math.min(word.end, duration)});
    if (/[.!?]$/.test(word.text)) { groups.push(group); group = []; }
  }
  if (group.length) groups.push(group);
  return groups.map((g, i) => ({
    start: g[0].start,
    end: Math.min(duration, groups[i + 1]?.[0].start ?? duration, g.at(-1).end + 0.12),
    words: g,
  }));
}

export function voiceFilter(factor) {
  // Cortar por muestras evita discrepancias de PTS tras encadenar atempo.
  return `aresample=24000,${tempoFilters(factor)},asetpts=N/SR/TB,apad=whole_len=936000,atrim=end_sample=936000,asetpts=N/SR/TB,afade=t=out:st=38.92:d=0.08,adelay=12000S:all=1,apad=whole_len=960000,atrim=end_sample=960000,asetpts=N/SR/TB`;
}
