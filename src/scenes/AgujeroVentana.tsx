import React from 'react';
import type {SceneProps} from './types';
import {easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, rnd, RED, GREEN, YELLOW, CYAN} from './common';

/** Ventana ovalada vista desde dentro, con el agujerito abajo. */
const WindowFront: React.FC<{t: number; glow: number; fog: number}> = ({t, glow, fog}) => <g>
  <rect x={-260} y={-360} width={520} height={720} rx={250} fill="#d9dee4"/>
  <clipPath id="wf-glass"><rect x={-200} y={-300} width={400} height={600} rx={195}/></clipPath>
  <g clipPath="url(#wf-glass)">
    <rect x={-200} y={-300} width={400} height={600} fill="#3d7fc1"/>
    <rect x={-200} y={-300} width={400} height={600} fill="#ffffff" opacity={.12}/>
    {Array.from({length: 4}, (_, i) => <ellipse key={i} cx={-300 + ((t * 30 + i * 160) % 640)} cy={-120 + i * 80} rx={90} ry={22} fill="#fff" opacity=".5"/>)}
    {fog > 0 && <rect x={-200} y={-300} width={400} height={600} fill="#e8eef4" opacity={.8 * fog}/>}
  </g>
  <circle cx={0} cy={240} r={8} fill="#24313f"/>
  {glow > 0 && <circle cx={0} cy={240} r={(44 + 8 * Math.sin(t * 6)) * glow} fill="url(#spot)"/>}
</g>;

/** Corte de las tres capas: interior (fina), media (con agujero) y exterior (gruesa). */
const Layers: React.FC<{t: number; air: number; push: number; crackOuter: number; holdMiddle: number; moisture: number}> = ({t, air, push, crackOuter, holdMiddle, moisture}) => {
  const xs = {inner: -170, middle: 0, outer: 190};
  return <g>
    <rect x={-470} y={-420} width={260} height={840} fill="#f2c27a" opacity=".12"/>
    <rect x={260} y={-420} width={210} height={840} fill="#5fb0ff" opacity=".12"/>
    <text x={-340} y={-450} textAnchor="middle" fontSize="38" fontWeight="900" fill="#f2c27a" fontFamily="Arial Black, Arial">CABINA</text>
    <text x={365} y={-450} textAnchor="middle" fontSize="38" fontWeight="900" fill="#9fd3ff" fontFamily="Arial Black, Arial">AFUERA</text>
    <rect x={xs.inner - 6} y={-380} width={12} height={760} rx={6} fill="#cfe0f0" opacity=".7"/>
    <rect x={xs.middle - 14} y={-380} width={28} height={760} rx={10} fill={holdMiddle > 0 ? GREEN : '#9fd3ff'} opacity=".85"/>
    <rect x={xs.middle - 16} y={250} width={32} height={22} fill="#0a1a2e"/>
    <circle cx={xs.middle} cy={261} r={22 + 6 * Math.sin(t * 6)} fill="url(#spot)"/>
    <rect x={xs.outer - 24} y={-380} width={48} height={760} rx={12} fill={crackOuter > 0 ? '#ff9a9a' : '#7fc1ff'}/>
    {crackOuter > 0 && <polyline points={`${xs.outer},-300 ${xs.outer - 14},-180 ${xs.outer + 12},-60 ${xs.outer - 10},60 ${xs.outer + 14},200`} fill="none" stroke={RED} strokeWidth="8"
      strokeDasharray="560" strokeDashoffset={560 * (1 - crackOuter)}/>}
    {/* aire de la cabina que pasa por el agujero hacia la cámara entre capas */}
    {air > 0 && Array.from({length: 14}, (_, i) => {
      const p = (t * .6 + i / 14) % 1;
      const x = p < .5 ? -150 + p * 2 * 150 : 0 + (p - .5) * 2 * 150;
      const y = p < .5 ? 261 + (rnd(i) - .5) * 260 * (1 - p * 2) : 261 - (p - .5) * 2 * (100 + rnd(i + 5) * 500);
      return <circle key={i} cx={x} cy={y} r={9} fill="#ffe7b0" opacity={air * .9}/>;
    })}
    {/* presión empujando sobre el cristal exterior */}
    {push > 0 && [-280, -140, 0, 140, 280].map(y => <g key={y} opacity={push} transform={`translate(${110 + 12 * Math.sin(t * 5)} ${y})`}>
      <path d="M -40 0 H 20" stroke={YELLOW} strokeWidth="12" strokeLinecap="round"/><path d="M 18 -18 L 44 0 L 18 18 Z" fill={YELLOW}/>
    </g>)}
    {/* humedad que sale por el agujero */}
    {moisture > 0 && Array.from({length: 10}, (_, i) => {
      const p = (t * .5 + i / 10) % 1;
      return <path key={`m${i}`} d="M 0 -14 C 8 -3 11 3 11 8 A 11 11 0 0 1 -11 8 C -11 3 -8 -3 0 -14 Z" fill={CYAN} opacity={moisture * (1 - p)}
        transform={`translate(${90 - p * 260} ${120 + (rnd(i) - .5) * 400 + p * 140})`}/>;
    })}
  </g>;
};

export const AgujeroVentana: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {proposito: B('proposito', .08), capas: B('capas', .16), orificio: B('orificio', .22), aire: B('aire', .3), presion: B('presion', .36),
    fallara: B('fallara', .46), aguantaria: B('aguantaria', .52), humedad: B('humedad', .6), empana: B('empana', .68), diminuto: B('diminuto', .86)};
  const zoomHole = prog(t, .2, 2.4, easeOut);

  return <Stage t={t}>
    <Shot t={t} from={-1} to={T.capas}>
      <g transform={`translate(540 ${900 - 200 * zoomHole}) scale(${1 + .5 * zoomHole})`}><WindowFront t={t} glow={prog(t, .8, 1.4)} fog={0}/></g>
    </Shot>
    <Shot t={t} from={T.capas - .2} to={T.humedad}>
      <g transform="translate(540 900) scale(1.05)">
        <Layers t={t} air={window01(t, T.aire, T.fallara + .3)} push={window01(t, T.presion, T.fallara + .3)}
          crackOuter={prog(t, T.fallara, T.fallara + 1)} holdMiddle={prog(t, T.aguantaria, T.aguantaria + .3)} moisture={0}/>
      </g>
      <Chip text="INTERIOR" x={190} y={1420} t={t} at={T.capas + .2} until={T.aire} color="#cfe0f0" size={30}/>
      <Chip text="MEDIO" x={540} y={1420} t={t} at={T.capas + .5} until={T.aire} color="#9fd3ff" size={30}/>
      <Chip text="EXTERIOR" x={890} y={1420} t={t} at={T.capas + .8} until={T.aire} color="#7fc1ff" size={30}/>
    </Shot>
    <Shot t={t} from={T.humedad - .2} to={T.diminuto}>
      <g transform="translate(300 900) scale(.62)"><WindowFront t={t} glow={0} fog={prog(t, T.empana, T.empana + 1)}/></g>
      <g transform="translate(780 900) scale(.62)"><WindowFront t={t} glow={1} fog={0}/></g>
      <Chip text="SIN AGUJERO" x={300} y={1210} t={t} at={T.empana} until={T.diminuto} color={RED} ink="#fff" size={32}/>
      <Chip text="CON AGUJERO" x={780} y={1210} t={t} at={T.empana} until={T.diminuto} color={GREEN} size={32}/>
      {/* gotitas de humedad que salen por el agujero de la ventana de la derecha */}
      {Array.from({length: 8}, (_, i) => {
        const p = (t * .55 + i / 8) % 1;
        return <path key={i} d="M 0 -14 C 8 -3 11 3 11 8 A 11 11 0 0 1 -11 8 C -11 3 -8 -3 0 -14 Z" fill={CYAN}
          opacity={window01(t, T.humedad, T.diminuto) * (1 - p)} transform={`translate(${780 + (rnd(i) - .5) * 80 * p} ${1049 + p * 120})`}/>;
      })}
    </Shot>
    <Shot t={t} from={T.diminuto - .2} to={duration + 1}>
      <g transform={`translate(540 ${700 + 0}) scale(${1.6 - .4 * prog(t, T.diminuto, T.diminuto + 1.5)})`}><WindowFront t={t} glow={1} fog={0}/></g>
    </Shot>

    <Chip text="NO ESTÁ ROTO" y={330} t={t} at={T.proposito} until={T.capas} color={YELLOW}/>
    <Chip text="TRES CAPAS DE CRISTAL" y={330} t={t} at={T.capas} until={T.aire} color="#ffffff"/>
    <Chip text="EL AIRE PASA ENTRE CAPAS" y={330} t={t} at={T.aire} until={T.presion} color={YELLOW}/>
    <Chip text="EL EXTERIOR AGUANTA LA PRESIÓN" y={330} t={t} at={T.presion} until={T.fallara} color={CYAN} size={34}/>
    <Chip text="SI FALLA… EL DEL MEDIO AGUANTA" y={330} t={t} at={T.fallara} until={T.humedad} color={GREEN} size={34}/>
    <Chip text="SALE LA HUMEDAD" y={330} t={t} at={T.humedad} until={T.empana} color={CYAN}/>
    <Chip text="NO SE EMPAÑA" y={330} t={t} at={T.empana} until={T.diminuto} color={GREEN}/>
    <Chip text="DIMINUTO PERO VITAL" y={330} t={t} at={T.diminuto} color={YELLOW}/>
    <Mark ok x={890} y={560} t={t} at={T.aguantaria + .3} until={T.humedad}/>
  </Stage>;
};
