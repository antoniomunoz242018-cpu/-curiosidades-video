import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, BigText, YELLOW, GREEN} from './common';

const Diamond: React.FC<{x: number; y: number; s?: number; glow?: number}> = ({x, y, s = 1, glow = 0}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  {glow > 0 && <circle r={40} fill="url(#spot)" opacity={glow}/>}
  <path d="M 0 -18 L 12 0 L 0 18 L -12 0 Z" fill="#111" stroke={YELLOW} strokeWidth="3"/>
</g>;

/** Cinta en pulgadas que se desplaza: 1 pulgada = `px` píxeles, empezando en la pulgada `from`. */
const Blade: React.FC<{y: number; px: number; from: number; glow: number; height?: number}> = ({y, px, from, glow, height = 120}) => {
  const items = [];
  for (let i = Math.floor(from); i <= from + 1080 / px + 1; i++) {
    const x = (i - from) * px;
    items.push(<g key={i}>
      <line x1={x} y1={y} x2={x} y2={y + height * (px > 40 || i % 4 === 0 ? .45 : .2)} stroke="#111" strokeWidth={px > 40 ? 4 : 2}/>
      {px > 40 && [.25, .5, .75].map(f => <line key={f} x1={x + f * px} y1={y} x2={x + f * px} y2={y + height * (f === .5 ? .3 : .18)} stroke="#111" strokeWidth="3"/>)}
      {(px > 40 || i % 16 === 0) && <text x={x + 6} y={y + height * .85} fontSize={height * .38} fontWeight="900" fill={i % 16 === 0 ? '#d4281c' : '#111'} fontFamily="Arial">{i}</text>}
    </g>);
  }
  const diamonds = [];
  for (let k = 1; k <= 5; k++) {
    const x = (k * 19.2 - from) * px;
    if (x > -40 && x < 1120) diamonds.push(<Diamond key={k} x={x} y={y + height * .32} s={height / 75} glow={glow}/>);
  }
  return <g><rect x={0} y={y} width={1080} height={height} fill={YELLOW}/>{items}{diamonds}</g>;
};

export const RomboCinta: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {error: B('error', .1), pulgadas: B('pulgadas', .2), divides: B('divides', .34), cinco: B('cinco', .44),
    carpinteros: B('carpinteros', .6), vigas: B('vigas', .68), matematicas: B('matematicas', .88)};
  const scroll = 12 + 7.2 * prog(t, .2, T.divides, easeOut); // de la pulgada 12 a la 19.2
  const split = prog(t, T.cinco - .2, T.cinco + 1.6);
  const SX = 90, SW = 900; // hoja de madera de 96 pulgadas

  return <Stage t={t}>
    <Shot t={t} from={-1} to={T.divides} cy={760}>
      <Blade y={680} px={110} from={scroll - 4.6} glow={prog(t, .4, 1)}/>
      <BigText text={'19.2"'} y={1080} t={t} at={T.pulgadas} until={T.divides} size={140} color={YELLOW}/>
    </Shot>
    {/* 8 pies divididos en 5 espacios iguales */}
    <Shot t={t} from={T.divides - .2} to={T.carpinteros} cy={760}>
      <rect x={SX} y={600} width={SW} height={150} rx={8} fill="#d9a86c" stroke="#a57437" strokeWidth="6"/>
      {Array.from({length: 7}, (_, i) => <line key={i} x1={SX} y1={620 + i * 18} x2={SX + SW} y2={630 + i * 18 + (i % 2) * 8} stroke="#c2915a" strokeWidth="3"/>)}
      <text x={540} y={560} textAnchor="middle" fontSize="48" fontWeight="900" fill="#fff" fontFamily="Arial Black, Arial">8 PIES = 96"</text>
      {[1, 2, 3, 4].map(k => {
        const o = prog(split, (k - 1) * .2, (k - 1) * .2 + .25);
        return <g key={k} opacity={o}>
          <line x1={SX + SW * k / 5} y1={590} x2={SX + SW * k / 5} y2={760} stroke="#111" strokeWidth="6" strokeDasharray="12 8"/>
          <Diamond x={SX + SW * k / 5} y={800} s={1.6}/>
        </g>;
      })}
      {[0, 1, 2, 3, 4].map(k => <text key={k} x={SX + SW * (k + .5) / 5} y={700} textAnchor="middle" fontSize="38" fontWeight="900" fill="#3b2410"
        opacity={prog(split, k * .18, k * .18 + .3)} fontFamily="Arial Black, Arial">19.2"</text>)}
      <BigText text={'96 ÷ 5 = 19.2'} y={1000} t={t} at={T.cinco + 1} until={T.carpinteros} size={92} color={YELLOW}/>
    </Shot>
    {/* las vigas caen en cada rombo */}
    <Shot t={t} from={T.carpinteros - .2} to={duration + 1} cy={760}>
      <Blade y={980} px={SW / 96} from={-SX / (SW / 96)} glow={1} height={70}/>
      {[0, 1, 2, 3, 4, 5].map(k => {
        const d = prog(t, T.vigas + k * .25, T.vigas + k * .25 + .5, easeOut);
        const x = SX + SW * k / 5;
        return <g key={k} transform={`translate(${x} ${-500 * (1 - d)})`} opacity={d}>
          <rect x={-18} y={480} width={36} height={480} rx={4} fill="#c2874a" stroke="#8a5a2b" strokeWidth="4"/>
        </g>;
      })}
      <Mark ok x={880} y={540} t={t} at={T.matematicas}/>
    </Shot>

    <Chip text="NO ES UN ERROR DE IMPRESIÓN" y={330} t={t} at={T.error} until={T.pulgadas} color="#ffffff" size={36}/>
    <Chip text="CADA 19.2 PULGADAS" y={330} t={t} at={T.pulgadas} until={T.divides} color={YELLOW}/>
    <Chip text="8 PIES EN 5 ESPACIOS IGUALES" y={330} t={t} at={T.divides} until={T.carpinteros} color={YELLOW} size={36}/>
    <Chip text="UNA VIGA EN CADA ROMBO" y={330} t={t} at={T.vigas} until={T.matematicas} color={GREEN}/>
    <Chip text="TU CINTA HIZO LAS CUENTAS" y={330} t={t} at={T.matematicas} color={YELLOW}/>
  </Stage>;
};
