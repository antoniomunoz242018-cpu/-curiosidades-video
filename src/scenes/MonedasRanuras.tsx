import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, rnd, RED, GREEN, YELLOW} from './common';

/** Moneda de frente. `reeded`: rayitas en el canto; `shaved`: tramo del borde limado (0..1). */
const Coin: React.FC<{r: number; gold?: boolean; reeded?: boolean; shaved?: number; spin?: number}> = ({r, gold = true, reeded = false, shaved = 0, spin = 1}) => {
  const base = gold ? '#e8b931' : '#c7ccd2', dark = gold ? '#a87a12' : '#7d858e', light = gold ? '#ffe28a' : '#eef1f4';
  const ticks = reeded ? 64 : 0;
  return <g transform={`scale(${spin} 1)`}>
    <circle r={r} fill={dark}/>
    {Array.from({length: ticks}, (_, i) => {
      const a = i / ticks * Math.PI * 2;
      const gone = shaved > 0 && a > 0.2 && a < 0.2 + shaved * 1.4;
      return gone ? null : <line key={i} x1={Math.cos(a) * (r - 2)} y1={Math.sin(a) * (r - 2)} x2={Math.cos(a) * (r - 20)} y2={Math.sin(a) * (r - 20)} stroke={light} strokeWidth="8" strokeLinecap="round"/>;
    })}
    {shaved > 0 && reeded && <path d={`M ${Math.cos(.2) * r} ${Math.sin(.2) * r} A ${r} ${r} 0 0 1 ${Math.cos(.2 + shaved * 1.4) * r} ${Math.sin(.2 + shaved * 1.4) * r}`}
      fill="none" stroke={RED} strokeWidth="12" strokeLinecap="round"/>}
    <circle r={r - 18} fill={base}/>
    <circle r={r - 34} fill="none" stroke={dark} strokeWidth="5"/>
    <path d={`M ${-r * .32} ${r * .12} L ${-r * .36} ${-r * .2} L ${-r * .16} ${-r * .04} L 0 ${-r * .3} L ${r * .16} ${-r * .04} L ${r * .36} ${-r * .2} L ${r * .32} ${r * .12} Z`} fill={dark}/>
    <rect x={-r * .34} y={r * .16} width={r * .68} height={r * .1} rx={4} fill={dark}/>
    <ellipse cx={-r * .35} cy={-r * .45} rx={r * .22} ry={r * .1} fill="#fff" opacity=".25" transform="rotate(-30)"/>
  </g>;
};

const File: React.FC<{x: number; y: number}> = ({x, y}) => <g transform={`translate(${x} ${y}) rotate(-25)`}>
  <rect x={-20} y={-10} width={330} height={44} rx={8} fill="#8c96a0"/>
  {Array.from({length: 18}, (_, i) => <line key={i} x1={-10 + i * 17} y1={-10} x2={4 + i * 17} y2={34} stroke="#5c6670" strokeWidth="3"/>)}
  <rect x={300} y={-4} width={160} height={32} rx={12} fill="#7a4d24"/>
</g>;

export const MonedasRanuras: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {siglos: B('siglos', .1), oro: B('oro', .14), limaban: B('limaban', .24), juntaban: B('juntaban', .32), valian: B('valian', .4),
    solucion: B('solucion', .5), robo: B('robo', .66), hoy: B('hoy', .74), tocarlas: B('tocarlas', .92)};
  const filing = t > T.limaban && t < T.solucion;
  const shrink = prog(t, T.limaban, T.valian + 1);
  const rasp = filing ? Math.sin(t * 16) * 50 : 0;
  const shaved = prog(t, T.robo - .6, T.robo + .4);

  return <Stage t={t} top="#3a2a10" mid="#1a1408">
    <Shot t={t} from={-1} to={T.limaban} cy={760}>
      <g transform="translate(540 720)"><Coin r={230} spin={Math.cos(t * 2.2)}/></g>
      {window01(t, T.oro, T.limaban) > 0 && <g opacity={window01(t, T.oro, T.limaban)}>
        <g transform="translate(300 1050)"><Coin r={90}/></g><g transform="translate(780 1050)"><Coin r={90} gold={false}/></g>
      </g>}
    </Shot>
    {/* La lima quita metal del borde; el polvo se junta */}
    <Shot t={t} from={T.limaban - .2} to={T.solucion} cy={760}>
      <g transform="translate(540 680)"><Coin r={230 - 40 * shrink}/></g>
      {filing && <File x={600 + rasp} y={480}/>}
      {Array.from({length: 26}, (_, i) => {
        const p = ((t * .8 + i / 26) % 1);
        return filing ? <circle key={i} cx={760 + (rnd(i) - .5) * 60} cy={560 + p * 470} r={5} fill={YELLOW} opacity={1 - p * .5}/> : null;
      })}
      <path d={`M ${700 - 110 * shrink} 1080 Q 760 ${1080 - 90 * prog(t, T.limaban, T.juntaban + 1.5)} ${820 + 110 * shrink} 1080 Z`} fill={YELLOW}/>
      {window01(t, T.valian, T.solucion) > 0 && <g opacity={window01(t, T.valian, T.solucion)}>
        <text x={300} y={1040} textAnchor="middle" fontSize="130" fontWeight="900" fill={RED} fontFamily="Arial Black, Arial">− $</text>
      </g>}
    </Shot>
    {/* Rayitas en el canto: si limas, se nota */}
    <Shot t={t} from={T.solucion - .2} to={T.hoy} cy={760}>
      <g transform="translate(540 720)"><Coin r={250} reeded shaved={shaved}/></g>
      {t > T.robo - .8 && t < T.robo + .5 && <File x={760 + Math.sin(t * 16) * 40} y={720}/>}
      <Mark ok={false} x={860} y={1060} t={t} at={T.robo + .4} until={T.hoy}/>
    </Shot>
    {/* Hoy: monedas comunes, se distinguen al tacto */}
    <Shot t={t} from={T.hoy - .2} to={duration + 1} cy={760}>
      <g transform="translate(330 720)"><Coin r={170} gold={false} reeded/></g>
      <g transform="translate(760 760)"><Coin r={130} gold={false}/></g>
      {window01(t, T.tocarlas, duration + 1) > 0 && <g transform={`translate(${330 + 175} ${720 - 40})`} opacity={prog(t, T.tocarlas, T.tocarlas + .4)}>
        <ellipse cx={60} cy={0} rx={70} ry={42} fill="#f2b98a"/><ellipse cx={20} cy={-6} rx={22} ry={16} fill="#ffd9b8"/>
      </g>}
      <Mark ok x={760} y={1060} t={t} at={T.tocarlas + .3}/>
    </Shot>

    <Chip text="HACE SIGLOS" y={330} t={t} at={T.siglos} until={T.oro} color="#ffffff"/>
    <Chip text="ERAN DE ORO Y PLATA" y={330} t={t} at={T.oro} until={T.limaban} color={YELLOW}/>
    <Chip text="LIMABAN EL BORDE" y={330} t={t} at={T.limaban} until={T.valian} color={RED} ink="#fff"/>
    <Chip text="VALÍAN CADA VEZ MENOS" y={330} t={t} at={T.valian} until={T.solucion} color={RED} ink="#fff"/>
    <Chip text="SOLUCIÓN: RAYITAS EN EL CANTO" y={330} t={t} at={T.solucion} until={T.robo} color={GREEN} size={36}/>
    <Chip text="SI LIMAS, SE NOTA" y={330} t={t} at={T.robo} until={T.hoy} color={YELLOW}/>
    <Chip text="HOY: LAS DISTINGUES AL TACTO" y={330} t={t} at={T.hoy + .3} color="#ffffff" size={36}/>
  </Stage>;
};
