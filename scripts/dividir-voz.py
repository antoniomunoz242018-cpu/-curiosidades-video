"""Corta un audio con varias narraciones seguidas en un archivo por vídeo.
Uso: python3 -I scripts/dividir-voz.py audio.mp3 guiones/lote.json slug1 slug2 ...
Guarda public/jobs/anim-<slug>/voice-raw.mp3 para cada slug, en el orden en que se leyeron."""
import json, os, subprocess, sys, unicodedata
import numpy as np
from faster_whisper import WhisperModel

audio, lote, slugs = sys.argv[1], sys.argv[2], sys.argv[3:]
items = {x['slug']: x for x in json.load(open(lote))}
def norm(t):
    t = unicodedata.normalize('NFD', t.lower())
    return ''.join(c for c in t if c.isalnum() and unicodedata.category(c) != 'Mn')

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
model = WhisperModel('small', device='cpu', compute_type='int8')
segs, _ = model.transcribe(np.frombuffer(raw, np.float32), language='es', word_timestamps=True)
words = [(norm(w.word), w.start, w.end) for s in segs for w in (s.words or [])]
total = len(raw) / 4 / 16000

# Inicio de cada narración: primera aparición de sus 3 primeras palabras después de la anterior.
starts, pos = [], 0
for slug in slugs:
    head = [norm(t) for t in items[slug]['narration'].split()[:3]]
    found = None
    for i in range(pos, len(words) - 2):
        if sum(words[i + k][0] == head[k] for k in range(3)) >= 2:
            found = i; break
    if found is None: sys.exit(f'No encontré el inicio de «{slug}»')
    starts.append(found); pos = found + 3

for n, slug in enumerate(slugs):
    i = starts[n]
    t0 = max(0, words[i][1] - .12)
    t1 = (words[starts[n + 1] - 1][2] + .25) if n + 1 < len(slugs) else total
    out = f'public/jobs/anim-{slug}'
    os.makedirs(out, exist_ok=True)
    for f in ('voice-raw.mp3', 'voice.wav', 'transcription.json'):
        if os.path.exists(f'{out}/{f}'): os.remove(f'{out}/{f}')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', audio, '-ss', f'{t0:.3f}', '-to', f'{t1:.3f}', '-c:a', 'libmp3lame', '-q:a', '2', f'{out}/voice-raw.mp3'], check=True)
    print(f'{slug}: {t0:.2f}–{t1:.2f} s ({t1 - t0:.1f} s)')
