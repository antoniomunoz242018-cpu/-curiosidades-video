import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {clamp, easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

/** Carrete visto de frente: corona dentada fija, carrete que gira y dos trinquetes que salen por fuerza centrífuga. */
const Reel: React.FC<{rot: number; out: number; locked: boolean}> = ({rot, out, locked}) => <g>
  <circle r={300} fill="#1d2733" stroke="#5c6f84" strokeWidth="8"/>
  {Array.from({length: 24}, (_, i) => <path key={i} d="M -18 -300 L 0 -262 L 18 -300 Z" fill="#8c96a0" transform={`rotate(${i * 15})`}/>)}
  <g transform={`rotate(${rot})`}>
    <circle r={220} fill="#2f3b4a" stroke="#8c96a0" strokeWidth="6"/>
    <circle r={150} fill="#1d3550"/>
    {Array.from({length: 6}, (_, i) => <circle key={i} r={150 - i * 20} fill="none" stroke="#2f7fd8" strokeWidth="8" opacity=".8"/>)}
    {[0, 180].map(a => <g key={a} transform={`rotate(${a})`}>
      <g transform={`translate(0 ${-200 - 60 * out}) rotate(${-20 * out})`}>
        <rect x={-26} y={-20} width={52} height={40} rx={8} fill={locked ? RED : YELLOW}/>
      </g>
    </g>)}
    <circle r={26} fill="#8c96a0"/>
  </g>
</g>;

export const Cinturon: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {golpe: B('golpe', .08), carrete: B('carrete', .16), suave: B('suave', .26), gira: B('gira', .36, 0), piezas: B('piezas', .4),
    dientes: B('dientes', .46), bolita: B('bolita', .6), frena: B('frena', .7), choque: B('choque', .84)};
  T.gira = B('gira', .36, T.suave + 1);
  // Giro: lento, luego de golpe y trabado
  const fast = t > T.gira;
  const lockAt = T.dientes;
  const rot = t < T.gira ? (t - T.carrete) * 40 : t < lockAt ? (T.gira - T.carrete) * 40 + (t - T.gira) * 400 : (T.gira - T.carrete) * 40 + (lockAt - T.gira) * 400;
  const out = fast ? prog(t, T.gira, T.piezas + .3, easeOut) : 0;
  const brake = prog(t, T.frena, T.frena + .6, easeOut);

  return <Stage t={t}>
    {/* 1. Despacio sale; de golpe se traba */}
    <Shot t={t} from={-1} to={T.carrete} cy={760}>
      {(() => {
        const pull = interpolate(t, [.3, 1.6], [0, 140], clamp);
        const yank = t > 1.8 ? Math.min(30, (t - 1.8) * 300) : 0;
        return <g>
          <rect x={300} y={420} width={480} height={700} rx={60} fill="#3b434c"/>
          <rect x={360} y={360} width={360} height={140} rx={40} fill="#4a525c"/>
          <path d={`M 700 440 L ${420 - pull} ${1060 + yank}`} stroke="#1d2733" strokeWidth="60" strokeLinecap="round"/>
          <path d={`M 700 440 L ${420 - pull} ${1060 + yank}`} stroke="#2f7fd8" strokeWidth="44" strokeLinecap="round"/>
          {t > 1.9 && <circle cx={700} cy={440} r={80} fill="url(#hot)"/>}
        </g>;
      })()}
    </Shot>
    {/* 2. El carrete por dentro */}
    <Shot t={t} from={T.carrete - .2} to={T.bolita} cy={760}>
      <g transform="translate(540 740) scale(1.15)"><Reel rot={rot} out={out} locked={t > lockAt}/></g>
      {t > lockAt && <circle cx={540} cy={740 - 290} r={90} fill="url(#hot)"/>}
      <Label x={540} y={1180} text={t < T.gira ? 'DESPACIO: GIRA Y SUELTA' : t < lockAt ? 'DE GOLPE: SALEN LAS PIEZAS' : '¡TRABADO!'} color={t < T.gira ? GREEN : t < lockAt ? YELLOW : RED} size={44}/>
    </Shot>
    {/* 3. La bolita: si el auto frena fuerte, también bloquea */}
    <Shot t={t} from={T.bolita - .2} to={T.choque} cy={760}>
      <g transform={`translate(${540 + 40 * brake} 680) rotate(${4 * brake})`}>
        <rect x={-380} y={-140} width={760} height={200} rx={60} fill="#2f7fd8"/>
        <path d="M -220 -140 L -140 -260 L 180 -260 L 260 -140 Z" fill="#9fd3ff" opacity=".7"/>
        <circle cx={-230} cy={70} r={60} fill="#111"/><circle cx={230} cy={70} r={60} fill="#111"/>
      </g>
      <g transform="translate(540 1000)">
        <path d="M -140 0 Q 0 60 140 0" fill="none" stroke="#8c96a0" strokeWidth="10"/>
        <circle cx={-10 + 100 * brake} cy={18 - 30 * brake} r={30} fill={YELLOW}/>
        <line x1={60} y1={-10} x2={140} y2={-10 - 60 * brake} stroke={brake > .8 ? RED : '#8c96a0'} strokeWidth="10" strokeLinecap="round"/>
      </g>
      <Label x={540} y={1130} text="FRENÓN = BOLITA AL FRENTE" color={YELLOW} size={40} o={prog(t, T.frena, T.frena + .4)}/>
    </Shot>
    <Shot t={t} from={T.choque - .2} to={duration + 1} cy={760}>
      <BigText text="¡CLIC!" y={780} t={t} at={T.choque} size={200} color={YELLOW}/>
      <Label x={540} y={880} text="FRACCIÓN DE SEGUNDO" size={50} o={prog(t, T.choque + .3, T.choque + .7)}/>
      <Mark ok x={880} y={560} t={t} at={T.choque + .6}/>
    </Shot>

    <Chip text="¿POR QUÉ SE TRABA?" y={330} t={t} at={T.golpe} until={T.carrete} color={YELLOW}/>
    <Chip text="ADENTRO DEL CARRETE…" y={330} t={t} at={T.carrete} until={T.gira} color="#ffffff"/>
    <Chip text="GIRO BRUSCO: SALEN DISPARADAS" y={330} t={t} at={T.gira} until={T.dientes} color={YELLOW} size={34}/>
    <Chip text="SE ATORAN COMO TRINQUETE" y={330} t={t} at={T.dientes} until={T.bolita} color={RED} ink="#fff" size={36}/>
    <Chip text="Y UNA BOLITA DETECTA EL FRENÓN" y={330} t={t} at={T.bolita} until={T.choque} color={CYAN} size={34}/>
    <Chip text="SE TRABA AL INSTANTE" y={330} t={t} at={T.choque} color={GREEN}/>
  </Stage>;
};
