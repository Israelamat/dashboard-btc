/**
 * Metadatos de UI de las señales que componen el score.
 * El contrato de datos vive en src/app/api/api.types.ts (derivado de
 * GET /openapi.json); acá sólo quedan label/tag/description para la vista.
 */

import { ComponentKey } from '../api/api.types';

export type { ComponentKey, DxyTrend, ReportComponents, ScoreSnapshot } from '../api/api.types';


/** Metadatos por componente (semántica de cada señal para la UI). */
export interface ComponentMeta {
  label: string;
  /** Peso en el score total. */
  weight: number;
  /** Etiqueta corta de la señal. */
  tag: string;
  /** Descripción de qué significa el valor alto. */
  description: string;
  /** true = señal contrarian (valores altos vienen de condiciones "malas" para el mercado). */
  contrarian: boolean;
}

/**
 * Entrada enriquecida de un componente: clave + valor del reporte + metadatos.
 * Resultado de mapear `ReportComponents` contra `COMPONENT_META`.
 */
export interface ReportComponent {
  key: ComponentKey;
  label: string;
  value: number;
  weight: number;
  tag: string;
  description: string;
  contrarian: boolean;
}

/** Metadatos estáticos de las 7 señales que componen el score. */
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