"""Transcripción local y gratuita con marcas de tiempo por palabra (faster-whisper).
Uso: python3 -I scripts/transcribir.py audio.wav salida.json ["texto de referencia"]
Escribe {"words": [{"word", "start", "end"}, ...]} igual que Whisper de OpenAI."""
import difflib, json, subprocess, sys, unicodedata
import numpy as np
from faster_whisper import WhisperModel

audio_path, out_path = sys.argv[1], sys.argv[2]
prompt = sys.argv[3] if len(sys.argv) > 3 else None
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio_path, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
model = WhisperModel('small', device='cpu', compute_type='int8')
segments, _ = model.transcribe(np.frombuffer(raw, np.float32), language='es', word_timestamps=True, initial_prompt=prompt)
words = [{'word': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3)} for s in segments for w in (s.words or [])]

def norm(t):
    t = unicodedata.normalize('NFD', t.lower())
    return ''.join(c for c in t if c.isalnum() and unicodedata.category(c) != 'Mn')

if prompt and words:
    # Alinea el guion con lo transcrito: el subtítulo muestra el texto exacto del guion
    # con los tiempos reales de la voz; las palabras sin pareja se interpolan.
    tokens = prompt.split()
    a, b = [norm(t) for t in tokens], [norm(w['word']) for w in words]
    times = [None] * len(tokens)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            w = words[blk.b + k]
            times[blk.a + k] = (w['start'], w['end'])
    known = [i for i, x in enumerate(times) if x]
    if len(known) >= max(3, len(tokens) // 3):
        for i in range(len(tokens)):
            if times[i]: continue
            prev = max([k for k in known if k < i], default=None)
            nxt = min([k for k in known if k > i], default=None)
            t0 = times[prev][1] if prev is not None else words[0]['start']
            t1 = times[nxt][0] if nxt is not None else words[-1]['end']
            lo = prev if prev is not None else -1
            hi = nxt if nxt is not None else len(tokens)
            span = (t1 - t0) / (hi - lo)
            st = t0 + (i - lo - 1) * span + span * .05
            times[i] = (st, st + span * .9)
        words = [{'word': t, 'start': round(x[0], 3), 'end': round(x[1], 3)} for t, x in zip(tokens, times)]
json.dump({'words': words}, open(out_path, 'w'), ensure_ascii=False, indent=1)
print(f'{len(words)} palabras')
