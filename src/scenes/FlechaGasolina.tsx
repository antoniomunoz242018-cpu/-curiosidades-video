import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {clamp, easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW} from './common';

/** Auto visto desde arriba. `door` = -1 izquierda, 1 derecha, 0 ninguna resaltada. */
const CarTop: React.FC<{door: number; glow: number; question?: number}> = ({door, glow, question = 0}) => <g>
  <rect x={-130} y={-250} width={260} height={500} rx={90} fill="#e84a3c"/>
  <rect x={-105} y={-150} width={210} height={120} rx={30} fill="#1d2f45"/>
  <rect x={-105} y={70} width={210} height={90} rx={26} fill="#1d2f45"/>
  <rect x={-110} y={-20} width={220} height={80} rx={14} fill="#c43b2f"/>
  {[[-140, -170], [140, -170], [-140, 150], [140, 150]].map(([x, y]) => <rect key={`${x}${y}`} x={x - 16} y={y - 40} width={32} height={80} rx={10} fill="#111"/>)}
  {[-1, 1].map(s => <g key={s}>
    <rect x={s * 130 - 14} y={60} width={28} height={44} rx={8} fill={door === s ? YELLOW : '#a8352a'} stroke="#7a241c" strokeWidth="3"/>
    {door === s && glow > 0 && <circle cx={s * 150} cy={82} r={70 * glow} fill="url(#spot)"/>}
  </g>)}
  {question > 0 && [-1, 1].map(s => <text key={`q${s}`} x={s * 220} y={110} textAnchor="middle" fontSize="110" fontWeight="900" fill="#fff" opacity={question}
    fontFamily="Arial Black, Arial">?</text>)}
</g>;

const PumpIcon: React.FC<{color: string; hoseColor?: string}> = ({color, hoseColor}) => <g>
  <rect x={-40} y={-60} width={70} height={120} rx={8} fill={color}/>
  <rect x={-28} y={-46} width={46} height={34} rx={4} fill="#081420"/>
  <rect x={-52} y={56} width={94} height={14} rx={4} fill={color}/>
  <path d="M 30 -30 H 52 Q 62 -30 62 -20 V 40 Q 62 52 50 52 Q 40 52 40 40 V 10" fill="none" stroke={hoseColor || color} strokeWidth="10" strokeLinecap="round"/>
</g>;

/** Tablero con indicador de gasolina, icono de la bomba y la flechita. */
const Dash: React.FC<{t: number; arrowDir: number; arrowGlow: number; hoseBad: number; level: number}> = ({t, arrowDir, arrowGlow, hoseBad, level}) => {
  const needle = interpolate(level, [0, 1], [-60, 60]);
  return <g>
    <rect x={-450} y={-300} width={900} height={600} rx={300} fill="#0b1520" stroke="#2c4660" strokeWidth="10"/>
    <path d="M -300 120 A 330 330 0 0 1 300 120" fill="none" stroke="#1d3550" strokeWidth="26" strokeLinecap="round"/>
    <path d="M -300 120 A 330 330 0 0 1 -230 -90" fill="none" stroke={RED} strokeWidth="26" strokeLinecap="round" opacity=".8"/>
    <text x={-330} y={190} fontSize="60" fontWeight="900" fill="#cfe8ff" fontFamily="Arial Black, Arial">E</text>
    <text x={295} y={190} fontSize="60" fontWeight="900" fill="#cfe8ff" fontFamily="Arial Black, Arial">F</text>
    <g transform={`translate(0 220) rotate(${needle})`}><path d="M -10 0 L 0 -300 L 10 0 Z" fill="#ff8a3d"/><circle r={26} fill="#2c4660"/></g>
    <g transform="translate(-30 -70) scale(1.15)"><PumpIcon color="#ffb347" hoseColor={hoseBad > 0 ? RED : undefined}/></g>
    <g transform={`translate(${arrowDir < 0 ? -115 : 105} -70) scale(${arrowDir < 0 ? -1 : 1} 1)`}>
      {arrowGlow > 0 && <circle r={70 + 10 * Math.sin(t * 6)} fill="url(#spot)" opacity={arrowGlow}/>}
      <path d="M -18 -28 L 26 0 L -18 28 Z" fill={YELLOW}/>
    </g>
  </g>;
};

export const FlechaGasolina: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {tablero: B('tablero', .14), triangulo: B('triangulo', .26), apunta: B('apunta', .34), izq: B('izquierda', .44),
    der: B('derecha', .52), manguera: B('manguera', .64), asi: B('asi', .8)};
  const izqEnd = T.der;
  const dir = t < T.der ? -1 : 1;
  const arrowGlow = prog(t, T.triangulo, T.triangulo + .4);
  const level = interpolate(t, [T.tablero, T.tablero + 1.5], [.7, .12], {...clamp, easing: easeOut});
  const drive = prog(t, T.asi, T.asi + 1.6, easeOut);

  return <Stage t={t}>
    {/* 1. ¿De qué lado está? */}
    <Shot t={t} from={-1} to={T.tablero}>
      {[-1, 1].map(s => <g key={s} transform={`translate(${540 + s * 360} 900)`}><g transform="scale(1.6)"><PumpIcon color="#5c6f84"/></g></g>)}
      <g transform="translate(540 900)"><CarTop door={0} glow={0} question={window01(t, .3, T.tablero, .3)}/></g>
    </Shot>
    {/* 2. El tablero y la flechita */}
    <Shot t={t} from={T.tablero - .2} to={T.apunta}>
      <g transform="translate(540 880) scale(1.05)"><Dash t={t} arrowDir={-1} arrowGlow={arrowGlow} hoseBad={0} level={level}/></g>
    </Shot>
    {/* 3. La flecha apunta al lado de la tapa */}
    <Shot t={t} from={T.apunta - .2} to={T.manguera}>
      <g transform="translate(540 600) scale(.62)"><Dash t={t} arrowDir={dir} arrowGlow={1} hoseBad={0} level={.12}/></g>
      <g transform={`translate(540 1130) rotate(${dir < 0 ? 0 : 0})`}><CarTop door={t >= T.izq - .1 ? dir : 0} glow={.6 + .4 * Math.sin(t * 6)}/></g>
      {t >= T.izq - .1 && <g>
        <path d={dir < 0 ? 'M 390 1190 H 270' : 'M 690 1190 H 810'} stroke={YELLOW} strokeWidth="14" strokeLinecap="round"/>
        <path d={dir < 0 ? 'M 270 1165 L 230 1190 L 270 1215 Z' : 'M 810 1165 L 850 1190 L 810 1215 Z'} fill={YELLOW}/>
      </g>}
    </Shot>
    {/* 4. La manguera no siempre sirve */}
    <Shot t={t} from={T.manguera - .2} to={T.asi}>
      <g transform="translate(540 880) scale(1.05)"><Dash t={t} arrowDir={-1} arrowGlow={1} hoseBad={1} level={.12}/></g>
      <Mark ok={false} x={640} y={700} t={t} at={T.manguera + .2} until={T.asi}/>
      <Mark ok x={380} y={700} t={t} at={T.manguera + 1.6} until={T.asi}/>
    </Shot>
    {/* 5. Directo al lado correcto */}
    <Shot t={t} from={T.asi - .2} to={duration + 1}>
      <g transform="translate(300 900) scale(1.6)"><PumpIcon color="#5c6f84"/></g>
      <g transform={`translate(${540 + 0 * drive} ${1500 - 600 * drive})`}><CarTop door={-1} glow={drive}/></g>
      <Mark ok x={760} y={600} t={t} at={T.asi + 1.7}/>
    </Shot>

    <Chip text="¿DE QUÉ LADO ESTÁ?" y={330} t={t} at={.4} until={T.tablero} color="#ffffff"/>
    <Chip text="MIRA ESTA FLECHITA" y={330} t={t} at={T.triangulo} until={T.apunta} color={YELLOW}/>
    <Chip text="◀ TAPA A LA IZQUIERDA" y={330} t={t} at={T.izq} until={izqEnd} color={YELLOW}/>
    <Chip text="TAPA A LA DERECHA ▶" y={330} t={t} at={T.der} until={T.manguera} color={YELLOW}/>
    <Chip text="LA MANGUERA NO SIEMPRE" y={330} t={t} at={T.manguera + .1} until={T.manguera + 1.5} color={RED} ink="#fff"/>
    <Chip text="LA FLECHA SÍ" y={330} t={t} at={T.manguera + 1.5} until={T.asi} color={GREEN}/>
  </Stage>;
};
