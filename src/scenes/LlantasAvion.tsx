import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, rnd, RED, GREEN, YELLOW, CYAN} from './common';
import {AirlinerSide, Label} from './shapes';

export const LlantasAvion: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {trucos: B('trucos', .1), solas: B('solas', .16), veinte: B('veinte', .22), infladas: B('infladas', .32), seis: B('seis', .38),
    nitrogeno: B('nitrogeno', .44), guardan: B('guardan', .6), kilo: B('kilo', .7), aterrizajes: B('aterrizajes', .82)};
  const retract = prog(t, T.guardan, T.guardan + 1.2);

  return <Stage t={t} top="#1d3f66" mid="#0d2038">
    {/* 1. Parecen de juguete */}
    <Shot t={t} from={-1} to={T.solas} cy={760}>
      <rect x={0} y={1000} width={1080} height={160} fill="#3b434c"/>
      <g transform="translate(540 870) scale(1.2)"><AirlinerSide gear={1}/></g>
      {[[474, 977], [845, 973]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={46 + 6 * Math.sin(t * 6)} fill="none" stroke={YELLOW} strokeWidth="6" opacity={prog(t, .6, 1.2)}/>)}
    </Shot>
    {/* 2. Más de 20 llantas repartiendo el peso */}
    <Shot t={t} from={T.solas - .2} to={T.infladas} cy={760}>
      {Array.from({length: 22}, (_, i) => {
        const k = prog(t, T.veinte - .5 + i * .05, T.veinte - .2 + i * .05, easeOut);
        const col = i % 6, row = Math.floor(i / 6);
        return <g key={i} transform={`translate(${190 + col * 140} ${520 + row * 150}) scale(${k})`}>
          <circle r={52} fill="#15171b"/><circle r={26} fill="#8c96a0"/>
        </g>;
      })}
      <BigText text="22" y={1180} t={t} at={T.veinte + .6} until={T.infladas} size={120} color={YELLOW}/>
    </Shot>
    {/* 3. 200 libras de presión y nitrógeno */}
    <Shot t={t} from={T.infladas - .2} to={T.guardan} cy={760}>
      {[['AUTO', 32, '#8c96a0'], ['AVIÓN', 200, YELLOW]].map(([l, v, c], i) => {
        const k = prog(t, T.infladas + i * .4, T.infladas + i * .4 + 1, easeOut);
        return <g key={l as string} transform={`translate(${310 + i * 460} 860)`}>
          <rect x={-70} y={-380} width={140} height={380} rx={20} fill="#1d3550"/>
          <rect x={-70} y={-380 * (v as number) / 200 * k} width={140} height={380 * (v as number) / 200 * k} rx={20} fill={c as string}/>
          <Label x={0} y={60} text={l as string} size={40}/>
          <Label x={0} y={-460 * (v as number) / 200 * k - 20} text={`${Math.round((v as number) * k)} PSI`} size={38} color={c as string}/>
        </g>;
      })}
      {t > T.nitrogeno && <g opacity={prog(t, T.nitrogeno, T.nitrogeno + .5)}>
        {Array.from({length: 8}, (_, i) => <g key={i} transform={`translate(${130 + rnd(i) * 820} ${1000 + rnd(i + 3) * 120 + Math.sin(t * 2 + i) * 10})`}>
          <circle cx={-14} r={16} fill={CYAN}/><circle cx={14} r={16} fill={CYAN}/>
        </g>)}
        <Label x={540} y={1180} text="NITRÓGENO (N₂)" color={CYAN} size={44}/>
      </g>}
    </Shot>
    {/* 4. Se guardan dentro del avión */}
    <Shot t={t} from={T.guardan - .2} to={T.aterrizajes} cy={760}>
      <g transform={`translate(540 ${760 - 80 * retract}) scale(1.2)`}><AirlinerSide gear={1 - retract}/></g>
      {t > T.kilo && <Label x={540} y={1040} text="CADA KILO = MÁS COMBUSTIBLE" color={RED} size={40} o={prog(t, T.kilo, T.kilo + .4)}/>}
    </Shot>
    {/* 5. Aterrizajes a más de 250 km/h */}
    <Shot t={t} from={T.aterrizajes - .2} to={duration + 1} cy={760}>
      <rect x={0} y={960} width={1080} height={200} fill="#3b434c"/>
      {Array.from({length: 8}, (_, i) => <rect key={i} x={((i * 160 - t * 900) % 1280 + 1280) % 1280 - 100} y={1050} width={90} height={12} fill="#fff" opacity=".6"/>)}
      <g transform={`translate(540 ${840 + 30 * (1 - prog(t, T.aterrizajes, T.aterrizajes + .8))}) rotate(-3) scale(1.1)`}><AirlinerSide gear={1}/></g>
      {t > T.aterrizajes + .8 && Array.from({length: 10}, (_, i) => {
        const p = (t * 1.5 + i / 10) % 1;
        return <circle key={i} cx={470 - p * 300} cy={950 - p * 60} r={20 + p * 40} fill="#c9ced3" opacity={.5 * (1 - p)}/>;
      })}
      <BigText text="+250 KM/H" y={650} t={t} at={T.aterrizajes + .3} size={110} color={YELLOW}/>
      <Mark ok x={880} y={1100} t={t} at={T.aterrizajes + 1.2}/>
    </Shot>

    <Chip text="ESCONDEN TRES TRUCOS" y={330} t={t} at={T.trucos} until={T.solas} color={YELLOW}/>
    <Chip text="1. NO TRABAJAN SOLAS" y={330} t={t} at={T.solas} until={T.infladas} color="#ffffff"/>
    <Chip text="2. 6 VECES MÁS PRESIÓN" y={330} t={t} at={T.infladas} until={T.guardan} color={YELLOW}/>
    <Chip text="3. SE GUARDAN EN VUELO" y={330} t={t} at={T.guardan} until={T.aterrizajes} color={GREEN}/>
    <Chip text="AGUANTAN ATERRIZAJES" y={330} t={t} at={T.aterrizajes} color={YELLOW}/>
  </Stage>;
};
