import { ComponentKey } from '../api/api.types';

export type { ComponentKey, DxyTrend, ReportComponents, ScoreSnapshot } from '../api/api.types';


export interface ComponentMeta {
  label: string;
  weight: number;
  tag: string;
  description: string;
  /** true = contrarian signal (high value comes from "bad" market conditions). */
  contrarian: boolean;
}

export interface ReportComponent {
  key: ComponentKey;
  label: string;
  value: number;
  weight: number;
  tag: string;
  description: string;
  contrarian: boolean;
}

export const COMPONENT_META: Readonly<Record<ComponentKey, ComponentMeta>> = {
  google_trends: {
    label: 'Google Trends',
    weight: 0.6,
    tag: 'Contrarian',
    description: 'Interés de búsqueda BAJO = mejor (contrarian). Es la señal más fuerte.',
    contrarian: true,
  },
  macd: {
    label: 'MACD (histograma)',
    weight: 0.16,
    tag: 'Momentum',
    description: 'Momentum alcista del histograma MACD.',
    contrarian: false,
  },
  dxy: {
    label: 'DXY (índice dólar)',
    weight: 0.1,
    tag: 'Dólar débil',
    description: 'Dólar débil (bearish) = mejor para activos de riesgo.',
    contrarian: true,
  },
  m2: {
    label: 'M2 YoY',
    weight: 0.05,
    tag: 'Liquidez',
    description: 'Crecimiento alto del M2 interanual = más liquidez en el mercado.',
    contrarian: false,
  },
  ema_200: {
    label: 'EMA-200',
    weight: 0.04,
    tag: 'Valoración',
    description: 'Precio por debajo de la EMA-200 = más barato.',
    contrarian: true,
  },
  fear_greed: {
    label: 'Fear & Greed',
    weight: 0.03,
    tag: 'Contrarian',
    description: 'Miedo extremo = mejor (contrarian).',
    contrarian: true,
  },
  rsi: {
    label: 'RSI-14',
    weight: 0.02,
    tag: 'Sobreventa',
    description: 'Sobreventa (RSI bajo) = mejor para acumular.',
    contrarian: true,
  },
};