/**
 * Modelo de datos del reporte de acumulación de BTC.
 * Contrato de la futura API REST (GET /api/financial-data).
 * Mientras no exista backend, se carga el JSON estático de
 * src/assets/mock-data.json.
 */

/** Tendencia del índice dólar (DXY): dólar débil = mejor para acumular. */
export type DxyTrend = 'bearish' | 'bullish' | 'neutral';

/** Claves posibles del mapa `components` (siempre presentes en el JSON). */
export type ComponentKey =
  | 'google_trends'
  | 'macd'
  | 'dxy'
  | 'm2'
  | 'ema_200'
  | 'fear_greed'
  | 'rsi';

/** Mapa de scores por componente, tal y como llega en el JSON. */
export interface ReportComponents {
  google_trends: number;
  macd: number;
  dxy: number;
  m2: number;
  ema_200: number;
  fear_greed: number;
  rsi: number;
}

/** Reporte completo del análisis. */
export interface BtcReport {
  date: string;
  btc_price: number;
  ema_200: number;
  rsi_14: number;
  fear_greed: number;
  m2_yoy: number;
  sp500: number;
  nasdaq: number;
  dxy: DxyTrend;
  macd_hist: number;
  google_trends: number;
  total_score: number;
  zone: string;
  components: ReportComponents;
}

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