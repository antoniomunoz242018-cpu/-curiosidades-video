import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {clamp, easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, RED, GREEN, YELLOW, CYAN} from './common';
import {Label} from './shapes';

const GROUND = 1040, R = 150;
/** Bici de lado; (0,0) = punto de contacto de la rueda trasera. */
const BikeSide: React.FC<{t: number; trail?: number; spin?: number}> = ({t, trail = 0, spin = 1}) => {
  const rx = 0, fx = 520, cy = -R;
  const head = {x: fx - 70, y: cy - 230};
  const wheel = (x: number) => <g transform={`translate(${x} ${cy})`}>
    <circle r={R} fill="none" stroke="#15171b" strokeWidth="18"/>
    {Array.from({length: 8}, (_, i) => <line key={i} x1={0} y1={0} x2={0} y2={-R + 10} stroke="#8c96a0" strokeWidth="3" transform={`rotate(${i * 45 + t * 400 * spin})`}/>)}
    <circle r={14} fill="#5c6670"/>
  </g>;
  return <g>
    {wheel(rx)}{wheel(fx)}
    <path d={`M ${rx} ${cy} L 200 ${cy} L ${head.x - 20} ${head.y + 60} L 160 ${cy - 200} Z M 200 ${cy} L 160 ${cy - 200}`} fill="none" stroke="#2f7fd8" strokeWidth="16" strokeLinejoin="round"/>
    <path d={`M ${head.x} ${head.y} L ${fx} ${cy}`} stroke={trail > 0 ? YELLOW : '#2f7fd8'} strokeWidth="14" strokeLinecap="round"/>
    <path d={`M ${head.x} ${head.y} L ${head.x - 20} ${head.y - 50} L ${head.x + 40} ${head.y - 60}`} fill="none" stroke="#3b434c" strokeWidth="12" strokeLinecap="round"/>
    <rect x={130} y={cy - 240} width={80} height={18} rx={9} fill="#3b434c"/>
    {trail > 0 && <g opacity={trail}>
      {(() => { const dx = fx - head.x, dy = cy - head.y, k = (0 - head.y) / dy; const gx = head.x + dx * k;
        return <g><line x1={head.x - dx * .3} y1={head.y - dy * .3} x2={gx} y2={0} stroke={YELLOW} strokeWidth="5" strokeDasharray="14 10"/>
          <circle cx={gx} cy={0} r={12} fill={YELLOW}/><circle cx={fx} cy={0} r={12} fill={CYAN}/>
          <line x1={fx} y1={30} x2={gx} y2={30} stroke="#fff" strokeWidth="6"/></g>; })()}
    </g>}
  </g>;
};

/** Bici vista desde arriba: cuadro, rueda delantera girada `steer` grados. */
const BikeTop: React.FC<{steer: number}> = ({steer}) => <g>
  <rect x={-12} y={-30} width={24} height={300} rx={10} fill="#15171b"/>
  <line x1={0} y1={0} x2={0} y2={-360} stroke="#2f7fd8" strokeWidth="16"/>
  <g transform={`translate(0 -360) rotate(${steer})`}>
    <rect x={-12} y={-150} width={24} height={300} rx={10} fill="#15171b"/>
    <line x1={-90} y1={-40} x2={90} y2={-40} stroke="#3b434c" strokeWidth="14" strokeLinecap="round"/>
  </g>
</g>;

export const BicicletaEquilibrio: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {movimiento: B('movimiento', .08), trompo: B('trompo', .16), pequeno: B('pequeno', .24), direccion: B('direccion', .3), inclina: B('inclina', .36),
    gira: B('gira', .42), tenedor: B('tenedor', .5), curva: B('curva', .58), endereza: B('endereza', .66), manubrio: B('manubrio', .76), rapido: B('rapido', .9)};
  const fall = prog(t, .3, 1.6, (p) => p * p);
  const lean = Math.sin(t * 1.4) * 12;
  const steerPh = prog(t, T.gira - .2, T.gira + .6, easeOut);

  return <Stage t={t}>
    {/* 1. Parada se cae; en movimiento no */}
    <Shot t={t} from={-1} to={T.trompo} cy={760}>
      <rect x={0} y={GROUND} width={1080} height={120} fill="#2b2f36"/>
      <g transform={`translate(300 ${GROUND}) rotate(${-80 * fall})`}>
        <rect x={-10} y={-300} width={20} height={300} fill="#2f7fd8"/><rect x={-12} y={-300} width={24} height={300} rx={10} fill="#15171b" opacity=".9"/>
        <line x1={-70} y1={-300} x2={70} y2={-300} stroke="#3b434c" strokeWidth="14" strokeLinecap="round"/>
      </g>
      <g transform={`translate(760 ${GROUND}) rotate(${Math.sin(t * 3) * 3})`}>
        <rect x={-12} y={-300} width={24} height={300} rx={10} fill="#15171b"/>
        <line x1={-70} y1={-300} x2={70} y2={-300} stroke="#3b434c" strokeWidth="14" strokeLinecap="round"/>
      </g>
      {Array.from({length: 4}, (_, i) => <line key={i} x1={860} y1={GROUND - 260 + i * 60} x2={980} y2={GROUND - 260 + i * 60} stroke="#fff" strokeWidth="5" opacity=".4"
        strokeDasharray="30 20" strokeDashoffset={t * 200}/>)}
      <Label x={300} y={GROUND + 90} text="PARADA" color={RED} size={40}/><Label x={760} y={GROUND + 90} text="EN MOVIMIENTO" color={GREEN} size={40}/>
    </Shot>
    {/* 2. El efecto trompo es pequeño */}
    <Shot t={t} from={T.trompo - .2} to={T.direccion} cy={760}>
      <g transform="translate(540 760)">
        <ellipse rx={220} ry={60} fill="none" stroke="#15171b" strokeWidth="26"/>
        <ellipse rx={220} ry={60} fill="none" stroke={CYAN} strokeWidth="6" strokeDasharray="30 20" strokeDashoffset={-t * 300}/>
        <line x1={0} y1={-200} x2={0} y2={200} stroke="#8c96a0" strokeWidth="10"/>
      </g>
      <Label x={540} y={1060} text="EFECTO TROMPO: PEQUEÑO" color={YELLOW} size={44} o={prog(t, T.pequeno, T.pequeno + .4)}/>
    </Shot>
    {/* 3. Se inclina → la rueda gira hacia ese lado → curva que la endereza */}
    <Shot t={t} from={T.direccion - .2} to={T.tenedor} cy={760}>
      <g transform={`translate(540 ${960}) rotate(${-90})`}>
        <path d={`M 0 0 Q ${380} ${-140 * steerPh} 760 ${-60 * steerPh}`} fill="none" stroke={GREEN} strokeWidth="8" strokeDasharray="20 14" opacity={steerPh}/>
      </g>
      <g transform={`translate(540 1000)`}><BikeTop steer={-30 * steerPh}/></g>
      <path d="M 300 560 A 240 240 0 0 0 300 900" fill="none" stroke={YELLOW} strokeWidth="10" opacity={prog(t, T.inclina, T.inclina + .4)}/>
      <Label x={200} y={520} text="SE INCLINA" color={YELLOW} size={38} o={prog(t, T.inclina, T.inclina + .4)}/>
      <Label x={800} y={520} text="LA RUEDA GIRA SOLA" color={GREEN} size={38} o={steerPh}/>
    </Shot>
    {/* 4. Gracias a la inclinación del tenedor */}
    <Shot t={t} from={T.tenedor - .2} to={T.manubrio} cy={760}>
      <rect x={0} y={GROUND} width={1080} height={120} fill="#2b2f36"/>
      <g transform={`translate(230 ${GROUND})`}><BikeSide t={t} trail={prog(t, T.tenedor, T.tenedor + .6)}/></g>
      <Label x={540} y={560} text="EL TENEDOR VA INCLINADO" color={YELLOW} size={44} o={prog(t, T.tenedor + .3, T.tenedor + .7)}/>
      <Mark ok x={880} y={460} t={t} at={T.endereza} until={T.manubrio}/>
    </Shot>
    {/* 5. Más rápido, más fácil */}
    <Shot t={t} from={T.manubrio - .2} to={duration + 1} cy={760}>
      <rect x={0} y={GROUND} width={1080} height={120} fill="#2b2f36"/>
      {Array.from({length: 6}, (_, i) => <line key={i} x1={((i * 220 - t * 900) % 1300 + 1300) % 1300 - 100} y1={GROUND + 60} x2={((i * 220 - t * 900) % 1300 + 1300) % 1300 + 20} y2={GROUND + 60} stroke="#fff" strokeWidth="6" opacity=".5"/>)}
      <g transform={`translate(230 ${GROUND}) rotate(${lean * .2} 260 0)`}><BikeSide t={t} spin={2}/></g>
      <Label x={540} y={560} text="MÁS RÁPIDO = MÁS ESTABLE" color={GREEN} size={46} o={prog(t, T.rapido, T.rapido + .4)}/>
      <Mark ok x={880} y={460} t={t} at={T.rapido + .5}/>
    </Shot>

    <Chip text="PARADA SE CAE, ANDANDO NO" y={330} t={t} at={T.movimiento} until={T.trompo} color="#ffffff" size={36}/>
    <Chip text="NO ES EL EFECTO TROMPO" y={330} t={t} at={T.trompo} until={T.direccion} color={RED} ink="#fff"/>
    <Chip text="LA CLAVE ES LA DIRECCIÓN" y={330} t={t} at={T.direccion} until={T.tenedor} color={YELLOW}/>
    <Chip text="CURVA QUE TE ENDEREZA" y={330} t={t} at={T.curva} until={T.manubrio} color={GREEN}/>
    <Chip text="Y TÚ AYUDAS CON EL MANUBRIO" y={330} t={t} at={T.manubrio} until={T.rapido} color={CYAN} size={36}/>
    <Chip text="MÁS RÁPIDO, MÁS EQUILIBRIO" y={330} t={t} at={T.rapido} color={GREEN} size={36}/>
  </Stage>;
};
