import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {clamp, easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW, CYAN} from './common';

/** Cabina en perspectiva: filas de asientos, luces de techo y del pasillo. */
const Cabin: React.FC<{t: number; light: number; floor: number; exit: number}> = ({t, light, floor, exit}) => {
  const rows = 7;
  return <g>
    <rect x={-540} y={-700} width={1080} height={1400} fill="#0a1220"/>
    <path d="M -540 -700 L -120 -120 L 120 -120 L 540 -700 Z" fill={`rgba(255,240,210,${.08 + .3 * light})`}/>
    <path d="M -540 700 L -120 -40 L 120 -40 L 540 700 Z" fill="#141c28"/>
    <rect x={-120} y={-120} width={240} height={80} fill="#0f1826"/>
    {Array.from({length: rows}, (_, i) => {
      const k = 1 - i / rows, s = .25 + .75 * k * k;
      const y = -40 + 740 * k * k, spread = 120 + 380 * k * k;
      return <g key={i}>
        {[-1, 1].map(side => <g key={side} transform={`translate(${side * (spread * .62)} ${y - 60 * s}) scale(${s})`}>
          <rect x={-150} y={-150} width={300} height={190} rx={40} fill={`rgb(${40 + 60 * light},${60 + 60 * light},${100 + 50 * light})`}/>
          <rect x={-150} y={20} width={300} height={60} rx={16} fill={`rgb(${30 + 50 * light},${45 + 50 * light},${80 + 40 * light})`}/>
        </g>)}
        <circle cx={0} cy={-120 - 560 * k * k} r={14 * s + 4} fill="#fff4d6" opacity={.15 + .85 * light}/>
        {floor > 0 && [-1, 1].map(side => <circle key={`f${side}`} cx={side * 50 * (1 + 4 * k * k)} cy={y + 30 * s} r={9 * s + 3} fill="#ffd27a" opacity={floor * (.7 + .3 * Math.sin(t * 4 + i))}/>)}
      </g>;
    })}
    {exit > 0 && <g opacity={exit} transform="translate(0 -88)">
      <rect x={-56} y={-26} width={112} height={52} rx={8} fill="#10c060"/>
      <text x={0} y={12} textAnchor="middle" fontSize="30" fontWeight="900" fill="#fff" fontFamily="Arial Black, Arial">EXIT</text>
      <circle r={90} fill="url(#good)" opacity={.6}/>
    </g>}
  </g>;
};

/** Ojo con pupila que se dilata para adaptarse a la oscuridad. */
const Eye: React.FC<{pupil: number}> = ({pupil}) => <g>
  <path d="M -260 0 Q 0 -190 260 0 Q 0 190 -260 0 Z" fill="#f4f6f8"/>
  <circle r={110} fill="#4c8fd1"/>
  <circle r={30 + 62 * pupil} fill="#0b1214"/>
  <circle cx={-34} cy={-36} r={18} fill="#fff" opacity=".8"/>
</g>;

export const LucesAvion: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {seguridad: B('seguridad', .12), momentos: B('momentos', .18), emergencia: B('emergencia', .3), ojos: B('ojos', .38),
    bajar: B('bajar', .48), pasillo: B('pasillo', .58), persiana: B('persiana', .7), tripulacion: B('tripulacion', .78), nada: B('nada', .92)};
  const light = 1 - prog(t, .4, 2.2);
  const pathK = prog(t, T.momentos, T.momentos + 2.2);

  return <Stage t={t}>
    <Shot t={t} from={-1} to={T.momentos}>
      <g transform="translate(540 880) scale(.9)"><Cabin t={t} light={light} floor={prog(t, 1.6, 2.4)} exit={0}/></g>
    </Shot>
    {/* Despegue y aterrizaje: los momentos críticos */}
    <Shot t={t} from={T.momentos - .2} to={T.emergencia}>
      <g transform="translate(540 900)">
        <line x1={-460} y1={260} x2={460} y2={260} stroke="#5c6f84" strokeWidth="10"/>
        <path d="M -420 250 C -250 250 -260 -150 0 -160 C 260 -150 250 250 420 250" fill="none" stroke="#9fd3ff" strokeWidth="8" strokeDasharray="1300" strokeDashoffset={1300 * (1 - pathK)}/>
        {[-1, 1].map(s => <circle key={s} cx={s * 330} cy={140} r={(70 + 10 * Math.sin(t * 6)) * prog(t, T.momentos + .6 + (s + 1) * .5, T.momentos + 1.2 + (s + 1) * .5)} fill="url(#hot)"/>)}
        <g transform={`translate(${interpolate(pathK, [0, 1], [-420, 420])} ${pathK < .5 ? interpolate(pathK, [0, .5], [250, -160]) : interpolate(pathK, [.5, 1], [-160, 250])})`}>
          <path d="M -50 -6 H 40 Q 60 0 40 6 H -50 Z M -10 0 L -30 -40 H -16 L 12 0 Z M -10 0 L -30 40 H -16 L 12 0 Z M -50 -4 L -60 -22 H -50 L -40 -4 Z" fill="#f4f8fb"/>
        </g>
      </g>
      <Chip text="DESPEGUE" x={260} y={1240} t={t} at={T.momentos + .6} until={T.emergencia} color={RED} ink="#fff" size={32}/>
      <Chip text="ATERRIZAJE" x={820} y={1240} t={t} at={T.momentos + 1.6} until={T.emergencia} color={RED} ink="#fff" size={32}/>
    </Shot>
    {/* Los ojos tardan en adaptarse */}
    <Shot t={t} from={T.emergencia - .2} to={T.pasillo}>
      <g transform="translate(540 880)"><Eye pupil={t < T.bajar ? .15 + .1 * prog(t, T.ojos, T.ojos + 3) : .25 + .75 * prog(t, T.bajar, T.bajar + 1.4, easeOut)}/></g>
      {t < T.bajar && <g opacity={window01(t, T.ojos, T.bajar)}>
        <circle cx={540} cy={1160} r={70} fill="none" stroke="#5c6f84" strokeWidth="12"/>
        <path d={`M 540 1160 L ${540 + 55 * Math.sin(t * 2)} ${1160 - 55 * Math.cos(t * 2)}`} stroke={YELLOW} strokeWidth="10" strokeLinecap="round"/>
      </g>}
      <Mark ok x={820} y={1130} t={t} at={T.bajar + 1} until={T.pasillo}/>
    </Shot>
    {/* Ya ves el pasillo y las salidas */}
    <Shot t={t} from={T.pasillo - .2} to={T.persiana}>
      <g transform="translate(540 880) scale(.9)"><Cabin t={t} light={0} floor={1} exit={prog(t, T.pasillo + .3, T.pasillo + .9)}/></g>
    </Shot>
    {/* Persiana arriba: ver afuera */}
    <Shot t={t} from={T.persiana - .2} to={T.nada}>
      <g transform="translate(540 880)">
        <rect x={-260} y={-360} width={520} height={720} rx={250} fill="#d9dee4"/>
        <clipPath id="win"><rect x={-200} y={-300} width={400} height={600} rx={195}/></clipPath>
        <g clipPath="url(#win)">
          <rect x={-200} y={-300} width={400} height={600} fill="#0d2238"/>
          <rect x={-200} y={140} width={400} height={160} fill="#1d2a36"/>
          {Array.from({length: 6}, (_, i) => <rect key={i} x={-200 + ((i * 90 - t * 160) % 480 + 480) % 480} y={210} width={50} height={10} fill={YELLOW}/>)}
          <rect x={-200} y={-300} width={400} height={600 * (1 - prog(t, T.persiana + .2, T.persiana + 1.2, easeOut))} fill="#c9d3dc"/>
        </g>
      </g>
      <Chip text="LA TRIPULACIÓN VE AFUERA" y={1310} t={t} at={T.tripulacion} until={T.nada} color={CYAN} size={34}/>
    </Shot>
    <Shot t={t} from={T.nada - .2} to={duration + 1}>
      <g transform="translate(540 880) scale(.9)"><Cabin t={t} light={.15} floor={1} exit={1}/></g>
    </Shot>

    <Chip text="¿POR QUÉ LAS APAGAN?" y={330} t={t} at={.5} until={T.seguridad} color={YELLOW}/>
    <Chip text="ES POR SEGURIDAD" y={330} t={t} at={T.seguridad} until={T.momentos} color={GREEN}/>
    <Chip text="LOS MOMENTOS MÁS DELICADOS" y={330} t={t} at={T.momentos + .2} until={T.emergencia} color={RED} ink="#fff" size={36}/>
    <Chip text="TUS OJOS TARDAN EN ADAPTARSE" y={330} t={t} at={T.ojos} until={T.bajar} color="#ffffff" size={34}/>
    <Chip text="YA ESTÁN ADAPTADOS" y={330} t={t} at={T.bajar + .3} until={T.pasillo} color={GREEN}/>
    <Chip text="VES EL PASILLO Y LAS SALIDAS" y={330} t={t} at={T.pasillo} until={T.persiana} color={YELLOW} size={36}/>
    <Chip text="SUBE LA PERSIANA" y={330} t={t} at={T.persiana} until={T.nada} color="#ffffff"/>
    <Chip text="NADA ES CASUALIDAD" y={330} t={t} at={T.nada} color={YELLOW} size={46}/>
  </Stage>;
};
