import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AnimatedObject} from './Object';
import {PhotoLayout} from './PhotoLayout';
import type {VideoProps} from './types';
const palette = {cyan: '#67e8f9', violet: '#c4a0ff', amber: '#fcd879'};
export const Video: React.FC<VideoProps> = (props) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const time = frame / fps;
  const color = palette[props.accent];
  const entrance = spring({frame, fps, config: {damping: 18, stiffness: 70}});
  const endFade = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const caption = props.captions.find(c => time >= c.start && time < c.end);
  if (props.layout === 'foto' && props.images?.length) {
    return <AbsoluteFill>
      {props.audioSrc && <Audio src={staticFile(props.audioSrc)}/>}
      <PhotoLayout {...props}/>
    </AbsoluteFill>;
  }
  return <AbsoluteFill style={{background: '#070b16', color: 'white', fontFamily: 'Arial, sans-serif', overflow: 'hidden'}}>
    {props.audioSrc && <Audio src={staticFile(props.audioSrc)}/>}
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 43%, ${color}1c, transparent 56%)`}}/>
    {Array.from({length: 48}, (_, i) => <div key={i} style={{position: 'absolute', left: `${(i * 37.17) % 100}%`, top: `${(i * 13.91 + time * (i % 3 + 1) * .25) % 100}%`, width: i % 5 === 0 ? 4 : 2, height: i % 5 === 0 ? 4 : 2, borderRadius: '50%', background: color, opacity: .15 + .35 * Math.sin(i + time * .4) ** 2}}/>)}
    <AbsoluteFill style={{opacity: endFade}}>
      <div style={{position: 'absolute', left: 88, top: 112, display: 'flex', alignItems: 'center', gap: 18, color, fontSize: 23, letterSpacing: 7, fontWeight: 700}}>
        <span style={{width: 10, height: 10, background: color, borderRadius: '50%'}}/> EN 40 SEGUNDOS
      </div>
      {props.showTitle !== false && <div style={{position: 'absolute', top: 190, left: 88, right: 88, fontSize: 68, lineHeight: 1.08, fontWeight: 800, letterSpacing: -2, opacity: entrance, transform: `translateY(${(1 - entrance) * 25}px)`}}>{props.title}</div>}
      <div style={{position: 'absolute', top: 520, left: 210, width: 660, height: 660, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${Math.sin(time * 1.4) * 22}px) scale(${entrance * (1 + Math.sin(time * .8) * .025)})`}}>
        <AnimatedObject kind={props.object} color={color} time={time}/>
      </div>
      <div style={{position: 'absolute', top: 1250, left: 92, right: 92, width: 896, height: 3, background: '#ffffff15'}}><div style={{height: '100%', width: `${frame / (durationInFrames - 1) * 100}%`, background: color}}/></div>
      <div style={{position: 'absolute', top: 1350, left: 85, right: 85, minHeight: 245, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {caption && <div style={{textAlign: 'center', fontSize: 70, lineHeight: 1.22, fontWeight: 800, textShadow: '0 4px 16px #000', letterSpacing: -1}}>
          {caption.words.map((w, i) => <React.Fragment key={i}><span style={{color: time >= w.start && time < w.end ? color : '#fff'}}>{w.text}</span>{' '}</React.Fragment>)}
        </div>}
      </div>
      <div style={{position: 'absolute', bottom: 145, left: 88, right: 88, display: 'flex', justifyContent: 'space-between', color: '#8392a8', fontSize: 23, letterSpacing: 3}}><span>CURIOSIDADES</span><span>{props.demo ? 'DEMO · SIN VOZ' : 'ESPAÑOL'}</span></div>
    </AbsoluteFill>
  </AbsoluteFill>;
};
