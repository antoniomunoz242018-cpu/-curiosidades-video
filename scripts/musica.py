"""Música de fondo original y efectos de sonido, sintetizados con código (sin derechos de autor).
Uso: python3 -I scripts/musica.py public/audio
Crea musica-curiosidad.wav (bucle de 60 s), whoosh.wav e impacto.wav."""
import os, subprocess, sys, wave
import numpy as np

SR = 44100
out = sys.argv[1] if len(sys.argv) > 1 else 'public/audio'
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)

def save(name, x):
    x = np.clip(x / (np.max(np.abs(x)) + 1e-9) * 0.89, -1, 1)
    with wave.open(os.path.join(out, name), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def lowpass(x, cutoff):
    # filtro de un polo; cutoff puede ser un número o un array (barrido)
    cutoff = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc; y[i] = acc
    return y

def note(n):  # nota MIDI -> Hz
    return 440 * 2 ** ((n - 69) / 12)

# ---------- Música: "curiosidad" en La menor, 96 bpm ----------
bpm = 96; beat = 60 / bpm; bar = 4 * beat
chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
bars = int(np.ceil(60 / bar)); dur = bars * bar
n = int(dur * SR); t = np.arange(n) / SR
mix = np.zeros(n)

def add(start, sig, gain):
    i = int(start * SR); j = min(n, i + len(sig))
    if i < n: mix[i:j] += sig[:j - i] * gain

for b in range(bars):
    ch = chords[b % 4]; t0 = b * bar
    # colchón (pad) suave con ataque lento
    L = int(bar * SR); tt = np.arange(L) / SR
    env = np.minimum(1, tt / .6) * np.minimum(1, (bar - tt) / .5)
    pad = sum(np.sin(2 * np.pi * note(m) * tt) + .3 * np.sin(4 * np.pi * note(m) * tt + .5) for m in ch)
    add(t0, pad * env, .05)
    # arpegio tipo "pluck" en corcheas
    seq = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12]
    for k, m in enumerate(seq):
        P = int(.9 * SR); tp = np.arange(P) / SR
        pl = (np.sin(2 * np.pi * note(m) * tp) + .35 * np.sin(4 * np.pi * note(m) * tp)) * np.exp(-tp * 5.5)
        add(t0 + k * beat / 2, pl, .11)
    # bajo en tiempos 1 y 3
    for k in (0, 2):
        P = int(beat * 1.6 * SR); tp = np.arange(P) / SR
        add(t0 + k * beat, np.sin(2 * np.pi * note(ch[0] - 24) * tp) * np.exp(-tp * 2.2), .32)
    # bombo suave (1 y 3) y hi-hat en contratiempos
    for k in (0, 2):
        P = int(.35 * SR); tp = np.arange(P) / SR
        f = 50 + 70 * np.exp(-tp * 25)
        add(t0 + k * beat, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tp * 9), .38)
    for k in range(4):
        P = int(.06 * SR)
        hh = np.diff(rng.standard_normal(P + 1)) * np.exp(-np.arange(P) / SR * 70)
        add(t0 + k * beat + beat / 2, hh, .025)

save('musica-raw.wav', mix)
# espacio (eco suave) y fundido para que el bucle encaje
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(out, 'musica-raw.wav'),
                '-af', 'aecho=0.8:0.6:180|360:0.25|0.12,lowpass=f=7000,afade=t=in:d=0.05,loudnorm=I=-20:TP=-2',
                '-ar', str(SR), '-ac', '1', os.path.join(out, 'musica-curiosidad.wav')], check=True)
os.remove(os.path.join(out, 'musica-raw.wav'))

# ---------- Whoosh: ruido con filtro que sube ----------
L = int(.7 * SR); tt = np.arange(L) / SR
noise = rng.standard_normal(L)
sweep = 250 * (6000 / 250) ** (tt / tt[-1])
wh = lowpass(noise, sweep) - lowpass(noise, sweep * .25)
env = np.sin(np.pi * np.minimum(1, tt / .7)) ** 1.5
save('whoosh.wav', wh * env)

# ---------- Impacto: golpe grave con cola ----------
L = int(1.4 * SR); tt = np.arange(L) / SR
f = 45 + 90 * np.exp(-tt * 18)
boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.5)
click = lowpass(rng.standard_normal(L), 3000) * np.exp(-tt * 40)
save('impacto.wav', boom + .5 * click)
print('Audio listo en', out)
