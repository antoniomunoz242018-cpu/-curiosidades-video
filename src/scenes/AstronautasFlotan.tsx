import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {clamp, easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, rnd, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

const Earth: React.FC<{r: number}> = ({r}) => <g>
  <circle r={r + 14} fill="#5fb0ff" opacity=".25"/>
  <circle r={r} fill="#1f6fb0"/>
  {[[-.3, -.2, .35], [.25, .15, .3], [-.1, .45, .22], [.4, -.4, .18]].map(([x, y, s], i) => <ellipse key={i} cx={x * r} cy={y * r} rx={s * r} ry={s * r * .6} fill="#3ea05a" transform={`rotate(${i * 40} ${x * r} ${y * r})`}/>)}
</g>;
const ISS: React.FC<{s?: number}> = ({s = 1}) => <g transform={`scale(${s})`}>
  <rect x={-14} y={-60} width={28} height={120} fill="#c9ced3"/>
  {[-1, 1].map(k => <g key={k}><rect x={k * 30 - (k < 0 ? 70 : 0)} y={-50} width={70} height={30} fill="#2f5fa8" stroke="#c9ced3" strokeWidth="2"/><rect x={k * 30 - (k < 0 ? 70 : 0)} y={20} width={70} height={30} fill="#2f5fa8" stroke="#c9ced3" strokeWidth="2"/></g>)}
  <rect x={-40} y={-10} width={80} height={20} fill="#e8eef4"/>
</g>;
const Astronaut: React.FC<{t: number}> = ({t}) => <g transform={`rotate(${Math.sin(t) * 20})`}>
  <rect x={-40} y={-20} width={80} height={110} rx={30} fill="#f4f4f4" stroke="#8c96a0" strokeWidth="4"/>
  <circle cx={0} cy={-60} r={50} fill="#f4f4f4" stroke="#8c96a0" strokeWidth="4"/><ellipse cx={0} cy={-60} rx={34} ry={26} fill="#1d3550"/>
  <path d={`M -40 10 L -90 ${-10 + Math.sin(t * 2) * 20} M 40 10 L 90 ${-20 - Math.sin(t * 2) * 20} M -20 90 L -40 160 M 20 90 L 50 150`} stroke="#f4f4f4" strokeWidth="26" strokeLinecap="round"/>
</g>;

export const AstronautasFlotan: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {noventa: B('noventa', .1), cayendo: B('cayendo', .2), veintiocho: B('veintiocho', .28), curva: B('curva', .38), suelo: B('suelo', .44),
    libre: B('libre', .52), hora: B('hora', .6), misma: B('misma', .7), elevador: B('elevador', .84)};
  const ER = 220, EC = [540, 840] as const;

  return <Stage t={t} top="#0d1530" mid="#05070f">
    {Array.from({length: 60}, (_, i) => <circle key={i} cx={rnd(i) * 1080} cy={400 + rnd(i + 3) * 800} r={rnd(i + 7) * 2.5 + .5} fill="#fff" opacity={.3 + .5 * rnd(i + 9)}/>)}
    {/* 1. Flota dentro de la estación */}
    <Shot t={t} from={-1} to={T.noventa} cy={760}>
      <rect x={140} y={500} width={800} height={560} rx={80} fill="#c9ced3" opacity=".18" stroke="#c9ced3" strokeWidth="6"/>
      <g transform={`translate(540 ${760 + Math.sin(t * 1.2) * 30})`}><Astronaut t={t}/></g>
    </Shot>
    {/* 2. Sí hay gravedad: 90% */}
    <Shot t={t} from={T.noventa - .2} to={T.cayendo} cy={760}>
      <g transform={`translate(${EC[0]} ${EC[1]})`}><Earth r={ER}/></g>
      <g transform={`translate(540 ${EC[1] - ER - 140})`}><ISS s={.8}/></g>
      <path d={`M 540 ${EC[1] - ER - 90} V ${EC[1] - ER - 20}`} stroke={YELLOW} strokeWidth="12"/><path d={`M 522 ${EC[1] - ER - 30} L 540 ${EC[1] - ER} L 558 ${EC[1] - ER - 30} Z`} fill={YELLOW}/>
      <BigText text="90%" y={520} t={t} at={T.noventa} until={T.cayendo} size={160} color={YELLOW}/>
    </Shot>
    {/* 3. Va tan rápido que la Tierra se curva y nunca llega */}
    <Shot t={t} from={T.cayendo - .2} to={T.misma} cy={760}>
      <g transform={`translate(${EC[0]} ${EC[1]})`}>
        <Earth r={ER}/>
        <circle r={ER + 120} fill="none" stroke={CYAN} strokeWidth="4" strokeDasharray="16 12" opacity={prog(t, T.curva, T.curva + .5)}/>
        {(() => {
          const a = -90 + (t > T.veintiocho ? (t - T.veintiocho) * (t > T.hora ? 150 : 60) : 0);
          const r = ER + 120;
          return <g transform={`rotate(${a}) translate(${r} 0) rotate(90)`}><ISS s={.6}/></g>;
        })()}
        {/* caída de objetos lentos: llegan al suelo */}
        {t > T.cayendo && t < T.curva && [.3, .6].map((v, i) => {
          const k = prog(t, T.cayendo + i * .3, T.cayendo + i * .3 + 1);
          return <circle key={i} cx={120 * v * k * (1 + i)} cy={-(ER + 120) + 120 * k * k} r={12} fill={RED}/>;
        })}
      </g>
      <Label x={540} y={530} text={t > T.hora ? 'UNA VUELTA = 90 MIN' : '28 000 KM/H'} color={t > T.hora ? CYAN : YELLOW} size={64} o={prog(t, T.veintiocho, T.veintiocho + .4)}/>
    </Shot>
    {/* 4. Como un elevador que cae y nunca llega */}
    <Shot t={t} from={T.misma - .2} to={duration + 1} cy={760}>
      <rect x={340} y={420} width={20} height={760} fill="#3b434c"/><rect x={720} y={420} width={20} height={760} fill="#3b434c"/>
      <g transform={`translate(540 ${700 + 40 * Math.sin(t * 2)})`}>
        <rect x={-170} y={-230} width={340} height={460} rx={10} fill="#1d2733" stroke="#8c96a0" strokeWidth="6"/>
        <g transform={`translate(0 ${-20 + 20 * Math.sin(t * 1.5)}) scale(.75)`}><Astronaut t={t}/></g>
        {Array.from({length: 5}, (_, i) => <line key={i} x1={-150 + i * 75} y1={-300} x2={-150 + i * 75} y2={-250} stroke="#fff" strokeWidth="4" opacity=".5"
          strokeDasharray="20 20" strokeDashoffset={t * 300}/>)}
      </g>
      <Mark ok x={880} y={560} t={t} at={T.elevador + .8}/>
    </Shot>

    <Chip text="SÍ HAY GRAVEDAD" y={330} t={t} at={.5} until={T.cayendo} color={YELLOW}/>
    <Chip text="FLOTAN PORQUE VAN CAYENDO" y={330} t={t} at={T.cayendo} until={T.curva} color={RED} ink="#fff" size={36}/>
    <Chip text="LA TIERRA SE CURVA: NUNCA LLEGA" y={330} t={t} at={T.curva} until={T.libre} color={CYAN} size={34}/>
    <Chip text="CAÍDA LIBRE PERMANENTE" y={330} t={t} at={T.libre} until={T.misma} color={GREEN}/>
    <Chip text="CAEN JUNTO CON LA ESTACIÓN" y={330} t={t} at={T.misma} until={T.elevador} color="#ffffff" size={36}/>
    <Chip text="UN ELEVADOR QUE NUNCA LLEGA" y={330} t={t} at={T.elevador} color={YELLOW} size={36}/>
  </Stage>;
};
