export type Word = {text: string; start: number; end: number};
export type Caption = {start: number; end: number; words: Word[]};
export type VideoProps = {
  title: string;
  narration: string;
  object: 'planet' | 'atom' | 'bulb' | 'brain' | 'crystal' | 'ocean';
  accent: 'cyan' | 'violet' | 'amber';
  /** 'foto': imágenes realistas a pantalla completa (estilo curiosidades de objetos). 'clasico': ilustración SVG. */
  layout?: 'foto' | 'clasico';
  /** Rutas relativas a public/ (p. ej. jobs/ID/scene-0.png), mostradas en orden repartidas en el tiempo. */
  images?: string[];
  /** Marca opcional en la esquina superior (nombre de la página). */
  brand?: string;
  showTitle?: boolean;
  audioSrc?: string;
  captions: Caption[];
  demo: boolean;
};
