import React from 'react';
import type {VideoProps} from './types';
export const AnimatedObject: React.FC<{kind: VideoProps['object']; color: string; time: number}> = ({kind, color, time}) => {
  const spin = time * 12;
  return <svg viewBox="0 0 600 600" width="660" height="660" style={{overflow: 'visible', filter: `drop-shadow(0 0 35px ${color}55)`}}>
    <defs>
      <radialGradient id="sphere" cx="32%" cy="25%"><stop stopColor="#ffffff"/><stop offset=".23" stopColor={color}/><stop offset=".7" stopColor="#16354d"/><stop offset="1" stopColor="#060b18"/></radialGradient>
      <linearGradient id="glass" x2="1" y2="1"><stop stopColor="#ffffff" stopOpacity=".9"/><stop offset=".45" stopColor={color} stopOpacity=".6"/><stop offset="1" stopColor="#122038"/></linearGradient>
    </defs>
    {kind === 'planet' && <g transform={`rotate(-18 300 300)`}>
      <ellipse cx="300" cy="300" rx="265" ry="85" fill="none" stroke={color} strokeWidth="22" opacity=".25"/>
      <circle cx="300" cy="300" r="165" fill="url(#sphere)"/>
      <ellipse cx="300" cy="300" rx="265" ry="85" fill="none" stroke={color} strokeWidth="6" strokeDasharray="820 840" strokeDashoffset={spin * 2}/>
      <path d="M145 270 Q300 350 451 260 M147 340 Q300 415 446 338" fill="none" stroke={color} strokeWidth="8" opacity=".2"/>
    </g>}
    {kind === 'atom' && <g transform={`rotate(${spin} 300 300)`}>
      {[0, 60, 120].map((angle, i) => <g key={angle} transform={`rotate(${angle} 300 300)`}>
        <ellipse cx="300" cy="300" rx="240" ry="85" fill="none" stroke={color} strokeWidth="5" opacity=".6"/>
        <circle cx={300 + 240 * Math.cos(time * 1.7 + i * 2)} cy={300 + 85 * Math.sin(time * 1.7 + i * 2)} r="14" fill="white"/>
      </g>)}<circle cx="300" cy="300" r="62" fill="url(#sphere)"/>
    </g>}
    {kind === 'bulb' && <g>
      <path d="M230 385 C230 330 165 305 165 220 A135 135 0 0 1 435 220 C435 305 370 330 370 385Z" fill="url(#glass)" stroke={color} strokeWidth="7"/>
      <path d="M270 385 L255 240 L300 275 L345 240 L330 385 M235 410 H365 M245 440 H355 M268 470 H332" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round"/>
      {Array.from({length: 8}, (_, i) => <path key={i} d="M300 30 V65" stroke={color} strokeWidth="8" transform={`rotate(${i * 45} 300 235)`} opacity={.4 + .4 * Math.sin(time * 2 + i)}/>)}
    </g>}
    {kind === 'brain' && <g fill="url(#glass)" stroke={color} strokeWidth="6" strokeLinecap="round">
      <path d="M294 145 C240 98 173 140 180 190 C110 195 95 270 136 312 C105 385 178 435 222 420 C243 475 294 441 294 400Z"/>
      <path d="M306 145 C360 98 427 140 420 190 C490 195 505 270 464 312 C495 385 422 435 378 420 C357 475 306 441 306 400Z"/>
      <path d="M175 230 Q260 205 245 285 M160 325 Q230 290 260 355 M425 230 Q340 205 355 285 M440 325 Q370 290 340 355" fill="none" stroke="#fff" opacity=".6"/>
    </g>}
    {kind === 'crystal' && <g transform={`rotate(${Math.sin(time * .5) * 12} 300 300)`} stroke={color} strokeWidth="5">
      <path d="M300 60 L455 205 L410 430 L300 535 L190 430 L145 205Z" fill="url(#glass)"/>
      <path d="M300 60 L250 230 L300 535 L350 230Z M145 205 L250 230 L190 430 M455 205 L350 230 L410 430 M250 230 H350" fill="none"/>
    </g>}
    {kind === 'ocean' && <g>
      <circle cx="300" cy="300" r="210" fill="url(#sphere)"/>
      {[0, 1, 2, 3].map(i => <path key={i} d={`M110 ${230 + i * 45} Q205 ${170 + i * 45 + Math.sin(time + i) * 20} 300 ${230 + i * 45} T490 ${230 + i * 45}`} fill="none" stroke={i === 0 ? '#fff' : color} strokeWidth="12" opacity={.8 - i * .15}/>)}
    </g>}
  </svg>;
};
