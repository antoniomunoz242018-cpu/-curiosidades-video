import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {clamp, easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

/** Paracaidista (vista de frente/abajo). `open` 0..1 despliega el paracaídas arriba. */
const Diver: React.FC<{open: number; t: number}> = ({open, t}) => <g>
  {open > 0 && <g transform={`translate(0 -330) scale(${open} ${.6 + .4 * open})`}>
    <path d="M -300 0 Q -300 -220 0 -230 Q 300 -220 300 0 Q 225 -30 150 0 Q 75 -30 0 0 Q -75 -30 -150 0 Q -225 -30 -300 0 Z" fill="#ff6a3d" stroke="#c4472a" strokeWidth="5"/>
    <path d="M -150 0 Q -150 -200 0 -228 Q 150 -200 150 0" fill="none" stroke="#fff" strokeWidth="6" opacity=".6"/>
    {[-290, -150, 0, 150, 290].map(x => <line key={x} x1={x} y1={0} x2={0} y2={300} stroke="#e8eef4" strokeWidth="3"/>)}
  </g>}
  <circle cx={0} cy={-40} r={32} fill="#ffd84d"/>
  <path d="M -40 -6 L 40 -6 L 34 90 L -34 90 Z" fill="#2f7fd8"/>
  <path d={`M -40 0 L -110 ${open > .5 ? -40 : 40} M 40 0 L 110 ${open > .5 ? -40 : 40}`} stroke="#2f7fd8" strokeWidth="22" strokeLinecap="round"/>
  <path d="M -24 90 L -50 190 M 24 90 L 50 190" stroke="#1d3550" strokeWidth="24" strokeLinecap="round"/>
</g>;

const Speedo: React.FC<{v: number}> = ({v}) => <g>
  <path d="M -150 0 A 150 150 0 0 1 150 0" fill="none" stroke="#1d3550" strokeWidth="26" strokeLinecap="round"/>
  <path d="M -150 0 A 150 150 0 0 1 150 0" fill="none" stroke={v > 100 ? RED : GREEN} strokeWidth="26" strokeLinecap="round" strokeDasharray={`${471 * v / 220} 600`}/>
  <Label x={0} y={-20} text={`${Math.round(v)}`} size={84}/>
  <Label x={0} y={40} text="KM/H" size={32} o={.8}/>
</g>;

export const Paracaidas: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {doscientos: B('doscientos', .12), tamano: B('tamano', .22), grande: B('grande', .3), abierto: B('abierto', .46),
    resistencia: B('resistencia', .56), igualar: B('igualar', .62), constante: B('constante', .74), veinte: B('veinte', .8), barda: B('barda', .92)};
  const open = prog(t, T.abierto - .2, T.abierto + .6, easeOut);
  const v = t < T.abierto ? interpolate(t, [.2, T.doscientos + .6], [60, 200], clamp) : interpolate(t, [T.abierto, T.veinte], [200, 20], clamp);
  const lines = (speed: number, o = .5) => Array.from({length: 10}, (_, i) =>
    <line key={i} x1={180 + i * 80} y1={((i * 190 - t * speed) % 1300 + 1300) % 1300 - 100} x2={180 + i * 80} y2={((i * 190 - t * speed) % 1300 + 1300) % 1300 + 40} stroke="#fff" strokeWidth="4" opacity={o}/>);

  return <Stage t={t} top="#3d7fc1" mid="#1d4f80">
    {/* 1. Caída libre a 200 km/h */}
    <Shot t={t} from={-1} to={T.tamano} cy={760}>
      {lines(1600)}
      <g transform={`translate(400 ${720 + Math.sin(t * 9) * 6}) scale(1.3)`}><Diver open={0} t={t}/></g>
      <g transform="translate(830 820)"><Speedo v={v}/></g>
    </Shot>
    {/* 2. Más grande = más aire que empujar */}
    <Shot t={t} from={T.tamano - .2} to={T.abierto} cy={760}>
      {[[300, 50], [760, 190]].map(([x, w], i) => <g key={i} transform={`translate(${x} ${640 + (i ? 60 : 300) * prog(t, T.tamano, T.abierto)})`}>
        <rect x={-w} y={-30} width={w * 2} height={60} rx={14} fill={i ? YELLOW : '#8c96a0'}/>
        {Array.from({length: i ? 7 : 2}, (_, k) => <g key={k} transform={`translate(${-w + 20 + k * ((w * 2 - 40) / Math.max(1, (i ? 6 : 1)))} 60)`}>
          <line x1={0} y1={110} x2={0} y2={10} stroke={CYAN} strokeWidth="8"/><path d="M -12 16 L 0 -4 L 12 16 Z" fill={CYAN}/>
        </g>)}
      </g>)}
      <Label x={300} y={540} text="PEQUEÑO" size={36}/><Label x={760} y={540} text="GRANDE" color={YELLOW} size={36}/>
    </Shot>
    {/* 3. Se abre: la resistencia iguala el peso */}
    <Shot t={t} from={T.abierto - .2} to={T.barda} cy={760}>
      {lines(1600 * (1 - .85 * open) + 100, .3)}
      <g transform="translate(400 880) scale(1.05)"><Diver open={open} t={t}/></g>
      <g transform="translate(830 960)"><Speedo v={v}/></g>
      {window01(t, T.igualar - .2, T.barda) > 0 && <g opacity={window01(t, T.igualar - .2, T.barda)}>
        <line x1={400} y1={540} x2={400} y2={420} stroke={GREEN} strokeWidth="16"/><path d="M 378 430 L 400 396 L 422 430 Z" fill={GREEN}/>
        <line x1={400} y1={1090} x2={400} y2={1210} stroke={RED} strokeWidth="16"/><path d="M 378 1200 L 400 1234 L 422 1200 Z" fill={RED}/>
        <Label x={470} y={460} text="AIRE" color={GREEN} size={34} anchor="start"/>
        <Label x={470} y={1200} text="PESO" color={RED} size={34} anchor="start"/>
      </g>}
    </Shot>
    {/* 4. Como saltar de una barda */}
    <Shot t={t} from={T.barda - .2} to={duration + 1} cy={760}>
      <rect x={140} y={760} width={240} height={340} fill="#a8724a" stroke="#7a4f30" strokeWidth="6"/>
      {Array.from({length: 4}, (_, i) => <line key={i} x1={140} y1={790 + i * 80} x2={380} y2={790 + i * 80} stroke="#7a4f30" strokeWidth="5"/>)}
      <rect x={0} y={1100} width={1080} height={60} fill="#3b4a3a"/>
      {(() => {
        const k = prog(t, T.barda + .2, T.barda + 1.2);
        return <g transform={`translate(${300 + 260 * k} ${700 + 330 * k * k}) scale(.7)`}><Diver open={0} t={t}/></g>;
      })()}
      <BigText text="20 KM/H" y={560} t={t} at={T.barda - .1} size={130} color={GREEN}/>
      <Mark ok x={880} y={860} t={t} at={T.barda + 1.3}/>
    </Shot>

    <Chip text="CAÍDA LIBRE: 200 KM/H" y={330} t={t} at={T.doscientos} until={T.tamano} color={RED} ink="#fff"/>
    <Chip text="MÁS GRANDE = MÁS AIRE QUE EMPUJAR" y={330} t={t} at={T.tamano} until={T.abierto} color={CYAN} size={32}/>
    <Chip text="ATRAPA MUCHÍSIMO AIRE" y={330} t={t} at={T.abierto} until={T.igualar} color={YELLOW}/>
    <Chip text="EL AIRE IGUALA TU PESO" y={330} t={t} at={T.igualar} until={T.constante} color={GREEN}/>
    <Chip text="YA NO ACELERA: 20 KM/H" y={330} t={t} at={T.constante} until={T.barda} color={GREEN}/>
    <Chip text="COMO SALTAR DE UNA BARDA" y={330} t={t} at={T.barda} color="#ffffff" size={36}/>
  </Stage>;
};
