import React from 'react';
import {interpolate} from 'remotion';
import type {SceneProps} from './types';
import {clamp, easeOut, prog, window01} from './helpers';
import {beats, Stage, Chip, Mark, Shot, rnd, RED, GREEN, YELLOW, CYAN} from './common';

const GROUND = 1000;
const ORANGE = '#ff8a3d', BIKE = '#e8322b';

/** Pista: asfalto con pianos rojo/blanco que se desplazan (sensación de velocidad). */
const Track: React.FC<{t: number; speed?: number}> = ({t, speed = 600}) => <g>
  <rect x={0} y={GROUND} width={1080} height={300} fill="#2b2f36"/>
  {Array.from({length: 14}, (_, i) => {
    const x = ((i * 120 - t * speed) % 1680 + 1680) % 1680 - 300;
    return <rect key={i} x={x} y={GROUND} width={60} height={26} fill={i % 2 ? '#fff' : RED}/>;
  })}
  {Array.from({length: 8}, (_, i) => {
    const x = ((i * 260 - t * speed * 1.4) % 2080 + 2080) % 2080 - 500;
    return <rect key={`l${i}`} x={x} y={GROUND + 120 + (i % 3) * 40} width={140} height={6} rx={3} fill="#fff" opacity=".15"/>;
  })}
</g>;

/** Moto de frente con piloto, apoyada en el punto de contacto (0,0). La rodilla (-175,-322) toca el piso a ~62°. */
export const KNEE = {x: -175, y: -322};
const BikeFront: React.FC = () => <g stroke="#0b1424" strokeWidth="4" strokeLinejoin="round">
  <rect x={-34} y={-300} width={68} height={300} rx={34} fill="#15171b"/>
  <rect x={-20} y={-280} width={40} height={250} rx={20} fill="#3b434c"/>
  <path d="M -120 -330 Q -130 -190 -60 -150 L 60 -150 Q 130 -190 120 -330 Q 0 -380 -120 -330 Z" fill={BIKE}/>
  <rect x={-110} y={-250} width={220} height={22} fill="#fff"/>
  <path d="M -70 -340 Q 0 -420 70 -340 Z" fill="#9fd3ff"/>
  {/* piloto con traje claro para que destaque */}
  <path d="M -95 -372 Q -150 -470 -60 -525 L 60 -525 Q 150 -470 95 -372 Z" fill="#eef2f6"/>
  <path d="M -20 -525 L 20 -525 L 30 -372 L -30 -372 Z" fill={YELLOW}/>
  {/* pierna interior estirada hacia la curva, con el deslizador de la rodilla */}
  <path d="M -95 -390 L -185 -340 L -165 -300 L -70 -350 Z" fill="#eef2f6"/>
  <rect x={-200} y={-344} width={46} height={34} rx={9} fill="#8c96a0" transform="rotate(-28 -177 -327)"/>
  {/* brazos al manubrio */}
  <path d="M -80 -470 L -125 -350 L -100 -340 L -55 -455 Z M 80 -470 L 125 -350 L 100 -340 L 55 -455 Z" fill="#eef2f6"/>
  <circle cx={0} cy={-580} r={64} fill="#fff"/>
  <path d="M -50 -592 H 50 Q 52 -556 0 -553 Q -52 -556 -50 -592 Z" fill="#111"/>
  <rect x={-60} y={-626} width={120} height={14} rx={7} fill={YELLOW}/>
</g>;

/** Corte de la llanta: banda de rodadura curva; costados de goma blanda (naranja), centro dura (gris). */
const TireSection: React.FC = () => {
  const R = 150;
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => `${Math.sin(a * Math.PI / 180) * R} ${-R + Math.cos(a * Math.PI / 180) * R}`;
    return `M ${p(a0)} A ${R} ${R} 0 0 ${a0 < a1 ? 0 : 1} ${p(a1)}`;
  };
  return <g>
    <path d={`M ${-R} ${-R - 230} L ${-R} ${-R} A ${R} ${R} 0 0 0 ${R} ${-R} L ${R} ${-R - 230} Z`} fill="#2b2f36" stroke="#15171b" strokeWidth="6"/>
    <rect x={-R - 20} y={-R - 270} width={(R + 20) * 2} height={50} rx={10} fill="#8c96a0"/>
    <path d={arc(-28, 28)} fill="none" stroke="#7d858e" strokeWidth="26"/>
    <path d={arc(32, 82)} fill="none" stroke={ORANGE} strokeWidth="26"/>
    <path d={arc(-32, -82)} fill="none" stroke={ORANGE} strokeWidth="26"/>
  </g>;
};

/** Llanta de lado (círculo) con dibujo opcional y calor. */
const TireSide: React.FC<{r: number; tread?: boolean; heat?: number; spin?: number}> = ({r, tread = false, heat = 0, spin = 0}) => {
  const col = `rgb(${43 + 200 * heat},${47 + 80 * heat},${54 - 20 * heat})`;
  return <g>
    {heat > .3 && <circle r={r + 40} fill={ORANGE} opacity={.25 * heat} filter="url(#soft)"/>}
    <circle r={r} fill={col}/>
    {tread && Array.from({length: 24}, (_, i) => <path key={i} d={`M 0 ${-r} l 14 22`} stroke="#0d0f12" strokeWidth="10" transform={`rotate(${i * 15 + spin})`}/>)}
    <circle r={r * .62} fill="#8c96a0"/>
    {Array.from({length: 5}, (_, i) => <rect key={`s${i}`} x={-6} y={-r * .58} width={12} height={r * .5} rx={6} fill="#5c6670" transform={`rotate(${i * 72 + spin})`}/>)}
    <circle r={r * .14} fill="#3b434c"/>
  </g>;
};

export const MotoGPLlantas: React.FC<SceneProps> = ({time: t, captions, duration}) => {
  const B = beats(captions, duration);
  const T = {secreto: B('secreto', .12), lisas: B('lisas', .18), redondas: B('redondas', .3), costado: B('costado', .38), equilibra: B('equilibra', .52),
    calor: B('calor', .66), chicle: B('chicle', .8), cobijas: B('cobijas', .92)};
  const lean = interpolate(t, [.2, 2.4], [0, 62], {...clamp, easing: easeOut});
  const tireLean = interpolate(t, [T.redondas, T.costado + .6], [0, 58], {...clamp, easing: easeOut});
  const heat = prog(t, T.calor, T.chicle + .4);
  const temp = Math.round(interpolate(heat, [0, 1], [25, 100]));

  return <Stage t={t} top="#1a2a44" mid="#0b1424">
    {/* 1. Inclinada a más de 60°: chispas del deslizador de la rodilla */}
    <Shot t={t} from={-1} to={T.lisas} cy={760}>
      <Track t={t}/>
      <g transform={`translate(780 ${GROUND}) rotate(${-lean}) scale(1.2)`}><BikeFront/></g>
      {lean > 55 && Array.from({length: 14}, (_, i) => {
        const p = (t * 2.5 + i / 14) % 1;
        const r = -lean * Math.PI / 180; // misma rotación que la moto: la rodilla en coordenadas del lienzo
        const kx = 780 + 1.2 * (KNEE.x * Math.cos(r) - KNEE.y * Math.sin(r)), ky = GROUND - 6;
        return <circle key={i} cx={kx + p * (200 + rnd(i) * 180)} cy={ky - p * 90 * rnd(i + 4) + p * p * 120} r={5} fill={i % 3 ? YELLOW : ORANGE} opacity={1 - p}/>;
      })}
      {lean > 5 && <g>
        <path d={`M 780 ${GROUND - 260} A 260 260 0 0 0 ${780 - Math.sin(lean * Math.PI / 180) * 260} ${GROUND - Math.cos(lean * Math.PI / 180) * 260}`} fill="none" stroke={YELLOW} strokeWidth="8" strokeDasharray="16 10"/>
        <text x={820} y={GROUND - 330} fontSize="120" fontWeight="900" fill={YELLOW} fontFamily="Arial Black, Arial">{Math.round(lean)}°</text>
      </g>}
    </Shot>
    {/* 2. Lisas: toda la goma toca el piso */}
    <Shot t={t} from={T.lisas - .2} to={T.redondas} cy={760}>
      <g transform="translate(290 700)"><TireSide r={190} tread spin={-t * 120}/></g>
      <g transform="translate(790 700)"><TireSide r={190} spin={-t * 120}/></g>
      {[290, 790].map((x, i) => <g key={x} transform={`translate(${x} 960)`}>
        <rect x={-120} y={0} width={240} height={70} rx={14} fill={i ? GREEN : '#5c6670'} opacity=".9"/>
        {i === 0 && Array.from({length: 6}, (_, k) => <rect key={k} x={-110 + k * 40} y={6} width={18} height={58} fill="#0b1424"/>)}
      </g>)}
      <text x={290} y={1100} textAnchor="middle" fontSize="38" fontWeight="900" fill="#c9ced3" fontFamily="Arial Black, Arial">CALLE</text>
      <text x={790} y={1100} textAnchor="middle" fontSize="38" fontWeight="900" fill={GREEN} fontFamily="Arial Black, Arial">CARRERAS</text>
      <Mark ok x={930} y={500} t={t} at={T.lisas + .8} until={T.redondas}/>
    </Shot>
    {/* 3. Redondas de lado: al inclinarse, apoya el costado (goma blanda) */}
    <Shot t={t} from={T.redondas - .2} to={T.equilibra} cy={760}>
      <rect x={0} y={GROUND} width={1080} height={300} fill="#2b2f36"/>
      <g transform={`translate(540 ${GROUND - 195}) rotate(${-tireLean}) scale(1.3) translate(0 150)`}><TireSection/></g>
      <ellipse cx={540} cy={GROUND} rx={70} ry={14} fill={YELLOW} opacity={.9}/>
      <circle cx={540} cy={GROUND} r={60 + 8 * Math.sin(t * 6)} fill="url(#spot)"/>
      {window01(t, T.costado, T.equilibra) > 0 && <g opacity={window01(t, T.costado, T.equilibra)}>
        <rect x={140} y={520} width={34} height={34} rx={6} fill={ORANGE}/><text x={190} y={549} fontSize="34" fontWeight="900" fill="#fff" fontFamily="Arial Black, Arial">GOMA BLANDA</text>
        <rect x={140} y={580} width={34} height={34} rx={6} fill="#7d858e"/><text x={190} y={609} fontSize="34" fontWeight="900" fill="#fff" fontFamily="Arial Black, Arial">GOMA DURA</text>
      </g>}
    </Shot>
    {/* 4. Las fuerzas: la inclinación hace que todo pase por el punto de apoyo */}
    <Shot t={t} from={T.equilibra - .2} to={T.calor} cy={760}>
      <Track t={t} speed={300}/>
      <g transform={`translate(760 ${GROUND}) rotate(-50) scale(1.15)`}><BikeFront/></g>
      {(() => {
        const a = 50 * Math.PI / 180, d = 460;
        const cx = 760 - Math.sin(a) * d, cy = GROUND - Math.cos(a) * d, L = 230;
        const k1 = prog(t, T.equilibra, T.equilibra + .5), k2 = prog(t, T.equilibra + .5, T.equilibra + 1), k3 = prog(t, T.equilibra + 1.1, T.equilibra + 1.7);
        const arrow = (x2: number, y2: number, c: string, k: number, w = 14) => {
          if (k <= 0) return null;
          const ex = cx + (x2 - cx) * k, ey = cy + (y2 - cy) * k, ang = Math.atan2(y2 - cy, x2 - cx) * 180 / Math.PI;
          return <g><line x1={cx} y1={cy} x2={ex} y2={ey} stroke={c} strokeWidth={w} strokeLinecap="round"/>
            <path d="M 0 -22 L 34 0 L 0 22 Z" fill={c} transform={`translate(${ex} ${ey}) rotate(${ang})`}/></g>;
        };
        return <g>
          <circle cx={cx} cy={cy} r={16} fill="#fff"/>
          {arrow(cx, cy + L, YELLOW, k1)}
          {arrow(cx - L * Math.tan(a) * -1, cy, RED, k2)}
          {arrow(760, GROUND, GREEN, k3, 18)}
          <text x={cx - 30} y={cy + L / 2} textAnchor="end" fontSize="34" fontWeight="900" fill={YELLOW} opacity={k1} fontFamily="Arial Black, Arial">PESO</text>
          <text x={cx + L * Math.tan(a) + 20} y={cy - 30} textAnchor="end" fontSize="34" fontWeight="900" fill={RED} opacity={k2} fontFamily="Arial Black, Arial">HACIA AFUERA</text>
        </g>;
      })()}
      <Mark ok x={880} y={560} t={t} at={T.equilibra + 1.8} until={T.calor}/>
    </Shot>
    {/* 5. El calor: a 100° la goma se pega como chicle */}
    <Shot t={t} from={T.calor - .2} to={T.cobijas} cy={760}>
      <rect x={0} y={GROUND} width={1080} height={300} fill="#2b2f36"/>
      <g transform={`translate(470 ${GROUND - 230})`}><TireSide r={230} heat={heat} spin={-t * 40}/></g>
      {t > T.chicle && [-60, -20, 20, 60].map((x, i) => <path key={i} d={`M ${470 + x} ${GROUND} q ${8 + i * 3} ${40 + 20 * Math.sin(t * 4 + i)} ${-4} ${70}`} stroke={ORANGE} strokeWidth="6" fill="none" opacity={prog(t, T.chicle, T.chicle + .4)}/>)}
      <g transform="translate(900 560)">
        <rect x={-30} y={-20} width={60} height={420} rx={30} fill="#1d2733" stroke="#c9ced3" strokeWidth="5"/>
        <rect x={-16} y={380 - 380 * heat} width={32} height={380 * heat} rx={16} fill={heat > .7 ? RED : ORANGE}/>
        <circle cx={0} cy={420} r={50} fill={heat > .7 ? RED : ORANGE}/>
        <text x={0} y={-50} textAnchor="middle" fontSize="64" fontWeight="900" fill="#fff" fontFamily="Arial Black, Arial">{temp}°</text>
      </g>
    </Shot>
    {/* 6. Cobijas eléctricas antes de salir */}
    <Shot t={t} from={T.cobijas - .2} to={duration + 1} cy={760}>
      <g transform="translate(540 760)">
        <circle r={260} fill={RED}/>
        {Array.from({length: 12}, (_, i) => <path key={i} d="M 0 -260 Q 30 -210 0 -160" stroke="#a51d17" strokeWidth="10" fill="none" transform={`rotate(${i * 30})`}/>)}
        <circle r={120} fill="#8c96a0"/><circle r={30} fill="#3b434c"/>
        <path d="M 230 120 Q 330 220 420 200" stroke="#111" strokeWidth="14" fill="none"/>
        <rect x={410} y={176} width={60} height={46} rx={8} fill="#c9ced3"/>
        {[-120, 0, 120].map((x, i) => <path key={i} d={`M ${x} -300 q 20 -30 0 -60 q -20 -30 0 -60`} stroke={ORANGE} strokeWidth="9" fill="none" strokeLinecap="round"
          strokeDasharray="26 18" strokeDashoffset={-t * 80} opacity={.8}/>)}
      </g>
      <Mark ok x={880} y={540} t={t} at={T.cobijas + .8}/>
    </Shot>

    <Chip text="EL SECRETO: LAS LLANTAS" y={330} t={t} at={T.secreto} until={T.lisas} color={YELLOW}/>
    <Chip text="LISAS: MÁS GOMA EN EL PISO" y={330} t={t} at={T.lisas} until={T.redondas} color={GREEN} size={36}/>
    <Chip text="SE APOYA EN EL COSTADO" y={330} t={t} at={T.costado - .3} until={T.equilibra} color={ORANGE}/>
    <Chip text="LA INCLINACIÓN EQUILIBRA LA FUERZA" y={330} t={t} at={T.equilibra} until={T.calor} color="#ffffff" size={32}/>
    <Chip text="A 100° SE PEGA COMO CHICLE" y={330} t={t} at={T.chicle - .4} until={T.cobijas} color={ORANGE} size={36}/>
    <Chip text="CALENTADORES ANTES DE SALIR" y={330} t={t} at={T.cobijas} color={CYAN} size={36}/>
  </Stage>;
};
