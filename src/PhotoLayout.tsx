import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Caption, VideoProps} from './types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const FADE = 0.6; // segundos de fundido entre escenas

/** Imagen con movimiento de cámara lento (zoom, desplazamiento y giro en perspectiva) para dar sensación 3D. */
const Scene: React.FC<{src: string; index: number; start: number; end: number; time: number; last: boolean}> = ({src, index, start, end, time, last}) => {
  const {fps} = useVideoConfig();
  const local = time - start;
  const length = end - start;
  const p = Math.min(1, Math.max(0, local / length));
  const dir = index % 2 === 0 ? 1 : -1;
  const opacity = Math.min(
    index === 0 ? 1 : interpolate(local, [0, FADE], [0, 1], clamp),
    last ? 1 : interpolate(time, [end, end + FADE], [1, 0], clamp),
  );
  if (opacity <= 0) return null;
  // Primera escena: arranca muy cerca y se aleja de golpe para que haya movimiento desde el primer fotograma.
  const pop = index === 0 ? interpolate(local, [0, 0.7], [0, 1], {...clamp, easing: t => 1 - Math.pow(1 - t, 3)}) : 1;
  const scale = (1.04 + p * 0.14) * (1.35 - 0.35 * pop);
  const tx = dir * interpolate(p, [0, 1], [-28, 28]);
  const ty = interpolate(p, [0, 1], [18, -22]) + Math.sin(time * 1.1) * 6;
  const rotY = dir * interpolate(p, [0, 1], [5, -5]);
  const rotZ = dir * interpolate(p, [0, 1], [-1.2, 1.2]);
  const mask = 'linear-gradient(to bottom, transparent 0%, #000 9%, #000 80%, transparent 100%), linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%)';
  const url = staticFile(src);
  return <AbsoluteFill style={{opacity}}>
    {/* Fondo: la misma imagen desenfocada y oscurecida para rellenar cualquier proporción. */}
    <Img src={url} style={{position: 'absolute', inset: -80, width: 'calc(100% + 160px)', height: 'calc(100% + 160px)', objectFit: 'cover', filter: 'blur(70px) brightness(.22) saturate(1.1)', transform: `scale(${1.1 + p * 0.05})`}}/>
    <AbsoluteFill style={{perspective: 1400}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, height: 1520, transform: `translate(${tx}px, ${ty}px) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`, WebkitMaskImage: mask, maskImage: mask, WebkitMaskComposite: 'source-in', maskComposite: 'intersect'}}>
        <Img src={url} style={{width: '100%', height: '100%', objectFit: 'contain'}}/>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

/** Subtítulos grandes: cada palabra entra desenfocada y se enfoca cuando se pronuncia. */
export const PopCaptions: React.FC<{captions: Caption[]; time: number; highlight: string; top: number}> = ({captions, time, highlight, top}) => {
  const caption = captions.find(c => time >= c.start && time < c.end);
  if (!caption) return null;
  const out = interpolate(time, [caption.end - 0.12, caption.end], [1, 0], clamp);
  return <div style={{position: 'absolute', top, left: 60, right: 60, minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: out}}>
    <div style={{textAlign: 'center', fontSize: 84, lineHeight: 1.15, fontWeight: 900, letterSpacing: -1.5, fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif'}}>
      {caption.words.filter(w => time >= w.start - 0.04).map((w, i) => {
        const k = interpolate(time, [w.start - 0.04, w.start + 0.16], [0, 1], clamp);
        const active = time >= w.start && time < w.end + 0.05;
        return <React.Fragment key={i}>
          <span style={{
            display: 'inline-block', opacity: k, filter: `blur(${(1 - k) * 14}px)`,
            transform: `translateY(${(1 - k) * 20}px) scale(${0.88 + 0.12 * k + (active ? 0.04 : 0)})`,
            color: active ? highlight : '#ffffff',
            textShadow: '0 6px 26px rgba(0,0,0,.9), 0 2px 4px rgba(0,0,0,.8)',
          }}>{w.text}</span>{' '}
        </React.Fragment>;
      })}
    </div>
  </div>;
};

/** Gancho: texto grande en recuadros amarillos durante los primeros 3 s. */
export const Hook: React.FC<{text: string; time: number; color: string; top?: number}> = ({text, time, color, top = 230}) => {
  const k = interpolate(time, [0, 0.25], [0, 1], {...clamp, easing: t => 1 - Math.pow(1 - t, 3)});
  const out = interpolate(time, [2.9, 3.2], [1, 0], clamp);
  return <div style={{position: 'absolute', top, left: 60, right: 60, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: out, transform: `scale(${1.25 - 0.25 * k})`}}>
    <div style={{textAlign: 'center', fontSize: 92, lineHeight: 1.13, fontWeight: 900, letterSpacing: -1, fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif'}}>
      <span style={{background: color, color: '#0b1214', padding: '0 30px', borderRadius: 18, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', boxShadow: '0 8px 30px rgba(0,0,0,.6)'}}>{text.toUpperCase()}</span>
    </div>
  </div>;
};

export const highlightColor = {cyan: '#7ef0ff', violet: '#d7b8ff', amber: '#ffd84d'};
const glowColor = {cyan: '#4fd6ff', violet: '#a77bff', amber: '#ffb347'};

export const PhotoLayout: React.FC<VideoProps> = (props) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const time = frame / fps;
  const duration = durationInFrames / fps;
  const images = props.images ?? [];
  const slot = duration / Math.max(1, images.length);
  const glow = glowColor[props.accent];
  const endFade = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [1, 0], clamp);
  const pulse = 0.55 + 0.15 * Math.sin(time * 1.3);
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 38%, #1b2a2c 0%, #0b1214 55%, #05080a 100%)', color: 'white', fontFamily: 'Arial, sans-serif', overflow: 'hidden'}}>
    {/* Foco de luz cálido detrás del objeto. */}
    <AbsoluteFill style={{background: `radial-gradient(circle at 48% 40%, ${glow}55 0%, ${glow}18 22%, transparent 48%)`, opacity: pulse}}/>
    <AbsoluteFill style={{opacity: endFade}}>
      {images.map((src, i) => <Scene key={src + i} src={src} index={i} start={i * slot} end={(i + 1) * slot} time={time} last={i === images.length - 1}/>)}
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, ${glow}22 0%, transparent 40%)`, mixBlendMode: 'screen', opacity: pulse}}/>
      {Array.from({length: 36}, (_, i) => <div key={i} style={{position: 'absolute', left: `${(i * 37.17) % 100}%`, top: `${(i * 13.91 - time * (i % 3 + 1) * .6 + 200) % 100}%`, width: i % 6 === 0 ? 5 : 3, height: i % 6 === 0 ? 5 : 3, borderRadius: '50%', background: '#fff6dc', filter: 'blur(1px)', opacity: .08 + .22 * Math.sin(i + time * .5) ** 2}}/>)}
      {/* Viñeta y degradado inferior para que los subtítulos se lean siempre. */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,.65) 100%)'}}/>
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, transparent 14%, transparent 62%, rgba(0,0,0,.8) 100%)'}}/>
      {props.brand && <div style={{position: 'absolute', top: 90, left: 70, display: 'flex', alignItems: 'center', gap: 18, fontSize: 34, fontWeight: 800, textShadow: '0 2px 10px #000'}}>
        <span style={{width: 58, height: 58, borderRadius: 16, background: highlightColor[props.accent], color: '#0b1214', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900}}>{props.brand.trim()[0]?.toUpperCase()}</span>
        {props.brand}
      </div>}
      {props.showTitle && <div style={{position: 'absolute', top: props.brand ? 190 : 120, left: 70, right: 70, fontSize: 62, lineHeight: 1.08, fontWeight: 900, letterSpacing: -1.5, textShadow: '0 4px 20px #000', opacity: props.hook ? interpolate(time, [3.2, 3.7], [0, 1], clamp) : interpolate(time, [0, .6], [0, 1], clamp)}}>{props.title}</div>}
      {props.hook && time < 3.2 && <Hook text={props.hook} time={time} color={highlightColor[props.accent]}/>}
      <PopCaptions captions={props.captions} time={time} highlight={highlightColor[props.accent]} top={1430}/>
      <div style={{position: 'absolute', bottom: 0, left: 0, height: 6, width: `${frame / (durationInFrames - 1) * 100}%`, background: highlightColor[props.accent], opacity: .85}}/>
      {props.demo && <div style={{position: 'absolute', bottom: 40, right: 60, color: '#ffffff66', fontSize: 22, letterSpacing: 3}}>DEMO · SIN VOZ</div>}
    </AbsoluteFill>
  </AbsoluteFill>;
};
