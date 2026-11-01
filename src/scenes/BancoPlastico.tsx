import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, Arrow, rnd, RED, GREEN, YELLOW, CYAN} from './common';

const RED_STOOL = '#e2463a', RED_DARK = '#a92c22';

/** Banco visto en 3/4 con el agujero del asiento. */
const Stool3D: React.FC<{glow: number; t: number}> = ({glow, t}) => <g>
  {[[-150, 1], [150, 1], [-90, 0], [90, 0]].map(([x, front], i) =>
    <path key={i} d={`M ${x * .9} 20 L ${x * 1.25} 330 L ${x * 1.25 + (x < 0 ? 40 : -40)} 330 L ${x * .7} 20 Z`} fill={front ? RED_STOOL : RED_DARK}/>)}
  <ellipse cx={0} cy={30} rx={230} ry={70} fill={RED_DARK}/>
  <ellipse cx={0} cy={0} rx={230} ry={70} fill={RED_STOOL}/>
  <ellipse cx={0} cy={0} rx={46} ry={16} fill="#0a1a2e"/>
  {glow > 0 && <ellipse cx={0} cy={0} rx={70 + 8 * Math.sin(t * 6)} ry={28} fill="url(#spot)" opacity={glow}/>}
</g>;

/** Corte lateral de un banco (asiento + patas) con agujero central. */
const StoolSection: React.FC<{y: number; color?: string}> = ({y, color = RED_STOOL}) => <g transform={`translate(0 ${y})`}>
  <path d="M -250 0 H -26 V 22 H -250 Z M 26 0 H 250 V 22 H 26 Z" fill={color}/>
  <path d="M -250 0 L -310 300 H -280 L -228 22 Z M 250 0 L 310 300 H 280 L 228 22 Z" fill={color}/>
</g>;

export const BancoPlastico: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {trabajos: B('trabajos', .1), apilas: B('apilas', .18), aire: B('aire', .24), ventosa: B('ventosa', .3), escapar: B('escapar', .36),
    fabrica: B('fabrica', .5), molde: B('molde', .56), ahorra: B('ahorra', .7), soluciones: B('soluciones', .9)};
  const stuck = t > T.aire && t < T.escapar;
  const tug = stuck ? Math.abs(Math.sin(t * 9)) * 18 : 0;
  const lift = prog(t, T.escapar + .5, T.escapar + 1.4, easeOut);
  const open = prog(t, T.molde + .4, T.molde + 1.2, easeOut);

  return <Stage t={t}>
    <Shot t={t} from={-1} to={T.apilas} cy={760}>
      <g transform="translate(540 650) scale(1.25)"><Stool3D glow={prog(t, .3, .9)} t={t}/></g>
      {[1, 2, 3].map(k => <g key={k} opacity={prog(t, T.trabajos + k * .25, T.trabajos + k * .25 + .3)} transform={`translate(${200 + k * 170} 1080)`}>
        <circle r={56} fill={YELLOW}/><text y={22} textAnchor="middle" fontSize="64" fontWeight="900" fill="#0b1214" fontFamily="Arial Black, Arial">{k}</text>
      </g>)}
    </Shot>
    {/* 1. Apilados: el aire atrapado los pega como ventosa */}
    <Shot t={t} from={T.apilas - .2} to={T.fabrica} cy={760}>
      <g transform="translate(540 640)">
        <StoolSection y={160}/>
        <StoolSection y={100} color="#c93b31"/>
        <g transform={`translate(0 ${-tug - 260 * lift})`}><StoolSection y={40} color="#e85b4f"/></g>
        {/* bolsa de aire entre asientos */}
        {t < T.escapar + .6 && <g opacity={window01(t, T.aire - .1, T.escapar + .6, .25)}>
          {Array.from({length: 10}, (_, i) => {
            const escaping = prog(t, T.escapar, T.escapar + .8);
            const x = (rnd(i) - .5) * 400 * (1 - escaping);
            const y = 70 + (rnd(i + 9) - .5) * 30 - escaping * 160 * rnd(i + 3);
            return <circle key={i} cx={x} cy={y} r={11} fill={CYAN} opacity={.85}/>;
          })}
        </g>}
      </g>
      <Arrow x1={540} y1={540} x2={540} y2={430} t={t} at={T.aire + .2} until={T.fabrica} color={stuck ? RED : GREEN}/>
      <Mark ok={false} x={880} y={560} t={t} at={T.ventosa} until={T.escapar + .3}/>
      <Mark ok x={880} y={560} t={t} at={T.escapar + 1.2} until={T.fabrica}/>
    </Shot>
    {/* 2. El molde se abre y el banco sale sin deformarse */}
    <Shot t={t} from={T.fabrica - .2} to={T.ahorra} cy={760}>
      <g transform="translate(540 700)">
        <g transform={`translate(0 ${-220 * open})`}>
          <rect x={-380} y={-200} width={760} height={200} rx={16} fill="#8a96a3" stroke="#5c6772" strokeWidth="6"/>
          <rect x={-22} y={-60} width={44} height={82} fill="#5c6772"/>
        </g>
        <g transform={`translate(0 ${-30 * open})`}><StoolSection y={0}/></g>
        <rect x={-380} y={30} width={760} height={330} rx={16} fill="#77838f" stroke="#5c6772" strokeWidth="6" opacity={.95}
          transform={`translate(0 ${120 * open})`}/>
      </g>
      <text x={540} y={1100} textAnchor="middle" fontSize="44" fontWeight="900" fill={CYAN} fontFamily="Arial Black, Arial" opacity={window01(t, T.molde, T.ahorra)}>EL HUECO DEL MOLDE</text>
    </Shot>
    {/* 3. Menos plástico, misma resistencia */}
    <Shot t={t} from={T.ahorra - .2} to={duration + 1} cy={760}>
      <g transform="translate(540 600) scale(.95)"><Stool3D glow={1} t={t}/></g>
      {[['PLÁSTICO', 1 - .2 * prog(t, T.ahorra, T.ahorra + 1), YELLOW], ['RESISTENCIA', 1, GREEN]].map(([label, v, c], i) =>
        <g key={label as string} transform={`translate(160 ${1010 + i * 90})`}>
          <text x={0} y={18} fontSize="38" fontWeight="900" fill="#fff" fontFamily="Arial Black, Arial">{label as string}</text>
          <rect x={330} y={-14} width={420} height={40} rx={20} fill="#1d3550"/>
          <rect x={330} y={-14} width={420 * (v as number)} height={40} rx={20} fill={c as string}/>
        </g>)}
      {[1, 2, 3].map(k => <Mark key={k} ok x={200 + k * 170} y={1240} t={t} at={T.soluciones + k * .2} size={60}/>)}
    </Shot>

    <Chip text="TIENE TRES TRABAJOS" y={330} t={t} at={T.trabajos} until={T.apilas} color={YELLOW}/>
    <Chip text="1. SE PEGAN COMO VENTOSA" y={330} t={t} at={T.apilas} until={T.escapar} color={RED} ink="#fff"/>
    <Chip text="EL AIRE ESCAPA POR EL AGUJERO" y={330} t={t} at={T.escapar} until={T.fabrica} color={GREEN} size={36}/>
    <Chip text="2. SALE DEL MOLDE SIN DEFORMARSE" y={330} t={t} at={T.fabrica} until={T.ahorra} color="#ffffff" size={34}/>
    <Chip text="3. MENOS PLÁSTICO, MISMA FUERZA" y={330} t={t} at={T.ahorra} until={T.soluciones} color={YELLOW} size={34}/>
    <Chip text="UN AGUJERO, TRES SOLUCIONES" y={330} t={t} at={T.soluciones} color={GREEN} size={36}/>
  </Stage>;
};
