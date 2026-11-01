import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, Arrow, RED, GREEN, YELLOW} from './common';

const BY = 760; // altura de la cinta
const GAP = 16; // juego del gancho (= su grosor), exagerado para que se vea

/** Cinta métrica de lado: caja a la derecha, cinta hacia la izquierda, gancho en la punta. `slide` mueve el gancho. */
const Tape: React.FC<{x0: number; slide: number; glowSlot?: number; zero?: 'in' | 'out' | null}> = ({x0, slide, glowSlot = 0, zero = null}) => {
  const len = 700 - x0;
  const hx = x0 - slide; // borde exterior del gancho
  return <g>
    {/* cinta */}
    <rect x={x0} y={BY} width={len + 60} height={46} fill={YELLOW}/>
    {Array.from({length: Math.floor(len / 18)}, (_, i) => <line key={i} x1={x0 + 30 + i * 18} y1={BY} x2={x0 + 30 + i * 18} y2={BY + (i % 5 === 0 ? 24 : 12)} stroke="#1a1a1a" strokeWidth="3"/>)}
    {Array.from({length: Math.floor(len / 90)}, (_, i) => <text key={`n${i}`} x={x0 + 30 + i * 90} y={BY + 42} fontSize="20" fontWeight="900" fill="#1a1a1a" fontFamily="Arial">{i + 1}</text>)}
    {/* caja */}
    <rect x={690} y={BY - 170} width={300} height={300} rx={60} fill="#1c1c1c"/>
    <rect x={690} y={BY - 40} width={300} height={90} fill="#f2c200"/>
    <rect x={800} y={BY - 140} width={90} height={70} rx={14} fill="#b8b8b8"/>
    {/* gancho: placa vertical + lengüeta remachada */}
    <g transform={`translate(${hx} 0)`}>
      <rect x={0} y={BY - 34} width={14} height={140} rx={3} fill="#c9ced3" stroke="#7b848c" strokeWidth="3"/>
      <rect x={0} y={BY - 8} width={92} height={12} rx={3} fill="#c9ced3" stroke="#7b848c" strokeWidth="3"/>
      {[40, 72].map(x => <circle key={x} cx={x} cy={BY - 2} r={6} fill="#7b848c"/>)}
    </g>
    {/* ranuras de los remaches: el hueco libre es el juego */}
    {[x0 + 40, x0 + 72].map(x => <rect key={x} x={x - 6 - (GAP - slide) / 2} y={BY - 10} width={12 + GAP} height={16} rx={6} fill="none" stroke={glowSlot > 0 ? YELLOW : 'none'} strokeWidth="4" opacity={glowSlot}/>)}
    {/* punto cero de la medida */}
    {zero && <g>
      <line x1={zero === 'out' ? hx + 14 : hx} y1={BY - 120} x2={zero === 'out' ? hx + 14 : hx} y2={BY + 200} stroke={GREEN} strokeWidth="6" strokeDasharray="14 10"/>
      <text x={zero === 'out' ? hx + 14 : hx} y={BY + 240} textAnchor="middle" fontSize="44" fontWeight="900" fill={GREEN} fontFamily="Arial Black, Arial">0</text>
    </g>}
  </g>;
};

export const CintaGancho: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {proposito: B('proposito', .1), grosor: B('grosor', .2), fuera: B('fuera', .3), dentro: B('dentro', .5),
    exacta: 0, aprietes: B('aprietes', .85)};
  T.exacta = B('exacta', .7, T.dentro); // «exactamente» aparece antes: buscar después de «dentro»
  const wiggle = Math.sin(t * 7) * GAP / 2 + GAP / 2;
  const pull = prog(t, T.fuera + .3, T.fuera + 1.1, easeOut);
  const push = prog(t, T.dentro + .3, T.dentro + 1.1, easeOut);
  const hammer = prog(t, T.aprietes + .2, T.aprietes + .6);

  return <Stage t={t}>
    {/* 1. El gancho se mueve */}
    <Shot t={t} from={-1} to={T.fuera} cy={760}>
      <g transform={`translate(540 ${BY}) scale(${1.5 + .6 * prog(t, T.grosor - .2, T.grosor + .8)}) translate(-${450 - 166 * prog(t, T.grosor - .2, T.grosor + .8)} -${BY})`}>
        <Tape x0={170} slide={wiggle} glowSlot={prog(t, T.grosor, T.grosor + .5)}/>
      </g>
      {window01(t, T.grosor + .4, T.fuera) > 0 && <g opacity={window01(t, T.grosor + .4, T.fuera)}>
        <text x={540} y={1060} textAnchor="middle" fontSize="54" fontWeight="900" fill={YELLOW} fontFamily="Arial Black, Arial">JUEGO = GROSOR</text>
      </g>}
    </Shot>
    {/* 2. Por fuera: el gancho se engancha en el borde y sale */}
    <Shot t={t} from={T.fuera - .2} to={T.dentro} cy={760}>
      <g transform={`translate(30 ${BY}) scale(1.5) translate(-60 -${BY})`}>
      <rect x={88} y={BY + 60} width={560} height={70} rx={6} fill="#b98a55" stroke="#8a6234" strokeWidth="4"/>
      {/* el gancho queda fijo en el borde de la tabla; al jalar, la cinta se aleja lo que mide su grosor */}
      <Tape x0={74 + GAP * pull} slide={GAP * pull} glowSlot={pull} zero="out"/>
      </g>
      <Arrow x1={760} y1={BY + 230} x2={960} y2={BY + 230} t={t} at={T.fuera + .2} until={T.dentro}/>
      <text x={380} y={BY + 400} textAnchor="middle" fontSize="44" fontWeight="900" fill={GREEN} fontFamily="Arial Black, Arial" opacity={pull}>+ GROSOR</text>
    </Shot>
    {/* 3. Por dentro: empujas contra la pared y entra */}
    <Shot t={t} from={T.dentro - .2} to={T.exacta} cy={760}>
      <g transform={`translate(0 ${BY}) scale(1.5) translate(-20 -${BY})`}>
      <rect x={20} y={420} width={110} height={720} fill="#6d7f92"/>
      {Array.from({length: 9}, (_, i) => <line key={i} x1={20} y1={440 + i * 80} x2={130} y2={480 + i * 80} stroke="#55667a" strokeWidth="6"/>)}
      {/* el gancho queda fijo contra la pared; al empujar, la cinta avanza y el juego se cierra */}
      <Tape x0={130 + GAP * (1 - push)} slide={GAP * (1 - push)} glowSlot={1 - push} zero="in"/>
      </g>
      <Arrow x1={960} y1={BY + 230} x2={760} y2={BY + 230} t={t} at={T.dentro + .2} until={T.exacta}/>
    </Shot>
    {/* 4. Exacta en los dos casos / no lo aprietes */}
    <Shot t={t} from={T.exacta - .2} to={duration + 1} cy={760}>
      <g transform="translate(540 760) scale(1.5) translate(-260 -760)"><Tape x0={170} slide={GAP / 2}/></g>
      {hammer > 0 && <g transform={`translate(${430} ${560 + 120 * hammer}) rotate(${-40 + 40 * hammer})`}>
        <rect x={-14} y={-200} width={28} height={220} rx={10} fill="#8a6234"/>
        <rect x={-70} y={-240} width={140} height={60} rx={10} fill="#5c6670"/>
      </g>}
      <Mark ok x={300} y={540} t={t} at={T.exacta + .1} until={T.aprietes}/>
      <Mark ok x={780} y={540} t={t} at={T.exacta + .4} until={T.aprietes}/>
      <Mark ok={false} x={780} y={540} t={t} at={T.aprietes + .6}/>
    </Shot>

    <Chip text="SE MUEVE A PROPÓSITO" y={330} t={t} at={T.proposito} until={T.grosor} color={YELLOW}/>
    <Chip text="EL JUEGO MIDE LO QUE EL GANCHO" y={330} t={t} at={T.grosor} until={T.fuera} color="#ffffff" size={34}/>
    <Chip text="POR FUERA: EL GANCHO SALE" y={330} t={t} at={T.fuera} until={T.dentro} color={GREEN}/>
    <Chip text="POR DENTRO: EL GANCHO ENTRA" y={330} t={t} at={T.dentro} until={T.exacta} color={GREEN}/>
    <Chip text="EXACTA EN LOS DOS CASOS" y={330} t={t} at={T.exacta} until={T.aprietes} color={YELLOW}/>
    <Chip text="NUNCA LO APRIETES" y={330} t={t} at={T.aprietes} color={RED} ink="#fff"/>
  </Stage>;
};
