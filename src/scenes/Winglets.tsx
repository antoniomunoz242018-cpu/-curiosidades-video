import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, RED, GREEN, YELLOW, CYAN} from './common';
import {AirlinerFront, Label} from './shapes';

/** Remolino de punta de ala: espiral que gira. */
const Vortex: React.FC<{x: number; y: number; size: number; t: number; color?: string}> = ({x, y, size, t, color = '#9fd3ff'}) => {
  const pts = Array.from({length: 60}, (_, i) => {
    const a = i * .32 + t * 6, r = size * (1 - i / 60);
    return `${x + Math.cos(a) * r},${y + Math.sin(a) * r * .8}`;
  }).join(' ');
  return <polyline points={pts} fill="none" stroke={color} strokeWidth={Math.max(3, size / 14)} strokeLinecap="round" opacity=".85"/>;
};

export const Winglets: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {combustible: B('combustible', .12), presion: B('presion', .2), punta: B('punta', .3, B('presion', .2)), remolino: B('remolino', .36), barrera: B('barrera', .5),
    cinco: B('cinco', .66), litros: B('litros', .88)};
  const raise = prog(t, T.barrera, T.barrera + 1, easeOut);
  const vSize = 150 - 100 * raise;

  return <Stage t={t} top="#1d3f66" mid="#0d2038">
    <Shot t={t} from={-1} to={T.presion} cy={760}>
      <g transform="translate(540 760) scale(1)"><AirlinerFront winglet={1} glowTip={prog(t, .3, 1)}/></g>
      <Label x={540} y={1010} text="WINGLETS" color={YELLOW} size={64} o={prog(t, .8, 1.4)}/>
    </Shot>
    {/* Presión: más abajo, menos arriba; en la punta el aire se escapa y gira */}
    <Shot t={t} from={T.presion - .2} to={T.cinco} cy={760}>
      <g transform="translate(330 760)">
        <path d={`M -360 -6 L 400 -14 L 400 ${-4 - 0} L -360 14 Z`} fill="#dfe6ec" stroke="#9aa7b3" strokeWidth="4"/>
        <g transform={`translate(400 -12) rotate(${-75 * raise})`}><path d="M 0 -6 L 90 -4 L 90 8 L 0 10 Z" fill={raise > 0 ? YELLOW : '#dfe6ec'} stroke="#9aa7b3" strokeWidth="3"/></g>
        {window01(t, T.presion, T.barrera, .3) > 0 && <g opacity={window01(t, T.presion, T.barrera, .3)}>
          {[-260, -120, 20, 160, 300].map(x => <g key={x}>
            <path d={`M ${x} 140 V 40`} stroke={RED} strokeWidth="10" strokeLinecap="round"/><path d={`M ${x - 16} 50 L ${x} 24 L ${x + 16} 50 Z`} fill={RED}/>
          </g>)}
          <Label x={-200} y={210} text="+ PRESIÓN" color={RED} size={40}/>
          <Label x={-200} y={-110} text="− PRESIÓN" color={CYAN} size={40}/>
        </g>}
        {t > T.punta - .2 && <path d={`M 380 90 Q 470 60 450 -20 Q 430 -80 360 -60`} fill="none" stroke={CYAN} strokeWidth="8" strokeDasharray="16 10" strokeDashoffset={-t * 120}
          opacity={prog(t, T.punta - .2, T.punta + .3) * (1 - raise)}/>}
        {t > T.remolino - .2 && <Vortex x={560} y={0} size={vSize} t={t} color={raise > .5 ? GREEN : CYAN}/>}
      </g>
      {t > T.remolino && t < T.barrera && <Label x={820} y={980} text="FRENA AL AVIÓN" color={RED} size={36}/>}
      {t > T.barrera + .8 && <Label x={820} y={980} text="REMOLINO MÁS CHICO" color={GREEN} size={34}/>}
    </Shot>
    {/* Ahorro */}
    <Shot t={t} from={T.cinco - .2} to={duration + 1} cy={760}>
      <BigText text="−5%" y={760} t={t} at={T.cinco} size={240} color={GREEN}/>
      <Label x={540} y={860} text="DE COMBUSTIBLE" size={52} o={prog(t, T.cinco + .3, T.cinco + .7)}/>
      {Array.from({length: 12}, (_, i) => {
        const k = prog(t, T.litros + i * .08, T.litros + i * .08 + .4, easeOut);
        return <path key={i} d="M 0 -26 C 14 -6 18 4 18 12 A 18 18 0 0 1 -18 12 C -18 4 -14 -6 0 -26 Z" fill="#ffb347" opacity={k}
          transform={`translate(${200 + (i % 6) * 136} ${1000 + Math.floor(i / 6) * 80}) scale(${1.4 * k})`}/>;
      })}
      <Mark ok x={880} y={540} t={t} at={T.cinco + .6}/>
    </Shot>

    <Chip text="AHORRAN COMBUSTIBLE" y={330} t={t} at={T.combustible} until={T.presion} color={GREEN}/>
    <Chip text="ABAJO EMPUJA MÁS EL AIRE" y={330} t={t} at={T.presion} until={T.punta} color={RED} ink="#fff" size={36}/>
    <Chip text="EN LA PUNTA SE FORMA UN REMOLINO" y={330} t={t} at={T.punta} until={T.barrera} color={CYAN} size={32}/>
    <Chip text="EL WINGLET LO FRENA" y={330} t={t} at={T.barrera} until={T.cinco} color={YELLOW}/>
    <Chip text="CIENTOS DE MILES DE LITROS AL AÑO" y={330} t={t} at={T.litros} color={GREEN} size={32}/>
  </Stage>;
};
