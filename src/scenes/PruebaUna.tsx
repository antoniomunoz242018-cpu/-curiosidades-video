import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW, CYAN} from './common';

/** Dedo de perfil apuntando a la derecha (la uña en la punta). `mirror`: reflejado. */
const Finger: React.FC<{x: number; y: number; mirror?: boolean; faded?: boolean}> = ({x, y, mirror = false, faded = false}) =>
  <g transform={`translate(${x} ${y}) scale(${mirror ? -1 : 1} 1)`} opacity={faded ? .55 : 1}>
    <path d="M -320 -40 H -20 Q 20 -40 20 0 Q 20 40 -20 40 H -320 Z" fill="#f2b98a"/>
    <path d="M -46 -40 H -14 Q 16 -36 16 -6 L -46 -6 Z" fill="#ffe3cc" stroke="#d99a6c" strokeWidth="3"/>
    <line x1={-140} y1={-36} x2={-140} y2={36} stroke="#d99a6c" strokeWidth="4"/>
  </g>;

/** Corte del espejo: vidrio de grosor G con la capa reflejante detrás o al frente. Devuelve el plano del reflejo. */
const MirrorSection: React.FC<{x: number; front: boolean; y?: number; h?: number}> = ({x, front, y = 520, h = 520}) => {
  const G = 70;
  return <g>
    <rect x={x} y={y} width={G} height={h} fill="#9fd3ff" opacity=".35" stroke="#cfe8ff" strokeWidth="3"/>
    <rect x={front ? x - 8 : x + G} y={y} width={10} height={h} fill="#e8eef4"/>
  </g>;
};

export const PruebaUna: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {sirve: B('sirve', .06), idea: B('idea', .12), espacio: B('espacio', .2), capa: B('capa', .32), detras: B('detras', .38), frente: B('frente', .42),
    normal: B('normal', .5), luz: B('luz', .64), oscuro: B('oscuro', .72), linterna: B('linterna', .8), cuarto: B('cuarto', .9)};
  const touch = prog(t, .2, 1.2, easeOut);
  const MX = 560; // superficie del vidrio en el corte

  return <Stage t={t}>
    {/* La prueba: la uña toca el espejo */}
    <Shot t={t} from={-1} to={T.capa} cy={760}>
      <rect x={MX} y={470} width={460} height={620} rx={10} fill="#9fd3ff" opacity=".18" stroke="#cfe8ff" strokeWidth="6"/>
      <Finger x={MX - 30 - 120 * (1 - touch)} y={780}/>
      <Finger x={MX + 30 + 120 * (1 - touch)} y={780} mirror faded/>
      {window01(t, T.espacio, T.capa) > 0 && <g opacity={window01(t, T.espacio, T.capa)}>
        <path d={`M ${MX - 10} 720 V 690 H ${MX + 10} V 720`} fill="none" stroke={YELLOW} strokeWidth="6"/>
        <text x={MX} y={660} textAnchor="middle" fontSize="40" fontWeight="900" fill={YELLOW} fontFamily="Arial Black, Arial">¿HAY ESPACIO?</text>
      </g>}
      <Mark ok={false} x={880} y={560} t={t} at={T.sirve} until={T.idea + .6}/>
    </Shot>
    {/* Corte: el espacio depende de dónde está la capa */}
    <Shot t={t} from={T.capa - .2} to={T.luz} cy={760}>
      {[{y: 460, front: false, at: T.detras, label: 'CAPA DETRÁS: HAY ESPACIO', c: YELLOW},
        {y: 820, front: true, at: T.frente, label: 'CAPA AL FRENTE: SIN ESPACIO', c: CYAN}].map(({y, front, at, label, c}) => {
        const o = prog(t, at - .3, at + .2);
        const plane = front ? MX - 8 : MX + 70;
        return <g key={label} opacity={Math.max(.25, o)} transform={`translate(0 ${y - 520}) `}>
          <MirrorSection x={MX} front={front} y={520} h={260}/>
          <g transform="translate(0 0) scale(1)">
            <Finger x={MX - 2} y={650}/>
            <Finger x={2 * plane - (MX - 2)} y={650} mirror faded/>
          </g>
          {!front && <path d={`M ${MX} 720 V 740 H ${2 * plane - MX} V 720`} fill="none" stroke={c} strokeWidth="6"/>}
          <text x={540} y={830} textAnchor="middle" fontSize="38" fontWeight="900" fill={c} fontFamily="Arial Black, Arial" opacity={o}>{label}</text>
        </g>;
      })}
      {window01(t, T.normal, T.luz) > 0 && <g opacity={window01(t, T.normal, T.luz)}>
        <rect x={60} y={1090} width={960} height={90} rx={20} fill="#0b1214" opacity=".85"/>
        <text x={540} y={1150} textAnchor="middle" fontSize="40" fontWeight="900" fill="#fff" fontFamily="Arial Black, Arial">NORMAL O FALSO: PUEDE SER IGUAL</text>
      </g>}
    </Shot>
    {/* La luz es lo que delata al espejo falso */}
    <Shot t={t} from={T.luz - .2} to={duration + 1} cy={760}>
      <rect x={40} y={440} width={500} height={700} fill="#f6e7b8" opacity=".9"/>
      <rect x={540} y={440} width={500} height={700} fill={t > T.linterna + .4 ? '#2a3a4a' : '#05080d'}/>
      <rect x={530} y={440} width={20} height={700} fill="#cfe8ff"/>
      {/* persona del lado oscuro */}
      <g opacity={t > T.linterna + .4 ? 1 : .12} transform="translate(800 820)">
        <circle cy={-130} r={60} fill="#7d8b98"/><path d="M -110 160 Q -110 -40 0 -50 Q 110 -40 110 160 Z" fill="#7d8b98"/>
        <circle cx={-20} cy={-135} r={8} fill="#fff"/><circle cx={20} cy={-135} r={8} fill="#fff"/>
      </g>
      {/* celular con linterna pegado al vidrio */}
      {t > T.linterna && <g>
        <rect x={400} y={720} width={120} height={230} rx={22} fill="#1d2733" stroke="#8c99a6" strokeWidth="5"/>
        <path d="M 540 800 L 1040 600 L 1040 1080 Z" fill="#fff6c8" opacity={.35 * prog(t, T.linterna + .2, T.linterna + .6)}/>
      </g>}
      <Mark ok x={880} y={560} t={t} at={T.cuarto + .2}/>
    </Shot>

    <Chip text="ESTA PRUEBA NO SIRVE" y={330} t={t} at={T.sirve} until={T.espacio} color={RED} ink="#fff"/>
    <Chip text="DEPENDE DE LA CAPA QUE REFLEJA" y={330} t={t} at={T.capa} until={T.normal} color="#ffffff" size={34}/>
    <Chip text="LO QUE LO DELATA ES LA LUZ" y={330} t={t} at={T.luz} until={T.linterna} color={YELLOW}/>
    <Chip text="PEGA LA LINTERNA AL VIDRIO" y={330} t={t} at={T.linterna} until={T.cuarto} color={GREEN} size={36}/>
    <Chip text="SI HAY UN CUARTO, LO VERÁS" y={330} t={t} at={T.cuarto} color={GREEN} size={36}/>
  </Stage>;
};
