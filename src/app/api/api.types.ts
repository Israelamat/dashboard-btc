/**
 * Contrato TypeScript de la API local (FastAPI en http://127.0.0.1:8000).
 * Derivado de la especificación de endpoints; si hay duda sobre un campo,
 * GET /openapi.json es la fuente de verdad (los response_model validan la salida).
 */

/** Las 4 zonas exactas del server. Úsalas como claves de i18n/colores. */
export type Zone =
  | 'High accumulation zone'
  | 'Moderate accumulation zone'
  | 'Neutral zone'
  | 'Selling zone';

/** Tendencia del índice dólar (DXY): bearish = dólar débil. */
export type DxyTrend = 'bearish' | 'bullish' | 'neutral';

/** Claves de los sub-scores (siempre las 7 en `components` y en `weights`). */
export type ComponentKey =
  | 'google_trends'
  | 'macd'
  | 'dxy'
  | 'm2'
  | 'ema_200'
  | 'fear_greed'
  | 'rsi';

/** Mapa de sub-scores 0-100 (y también de pesos, que suman 1). */
export type ReportComponents = Record<ComponentKey, number>;

/** Metadatos de zona histórica del score (null si no hay historia suficiente). */
export interface ZoneHistoryStats {
  n: number;
  mean: number;
  win: number;
}

/** Fallbacks aplicados por POST /api/refresh. true = se usó valor neutral. */
export interface RefreshFallbacks {
  google_trends_fallback: boolean;
  stored_indicators: boolean;
  sp500: boolean;
  nasdaq: boolean;
  m2: boolean;
}

/** Snapshot de score del día. Es el `report` del dashboard y la respuesta de /refresh. */
export interface ScoreSnapshot {
  date: string;
  btc_price: number;
  ema_200: number;
  rsi_14: number;
  /** int 0-100 */
  fear_greed: number;
  /** % interanual */
  m2_yoy: number;
  sp500: number | null;
  nasdaq: number | null;
  dxy: DxyTrend;
  macd_hist: number;
  /** 0-100 */
  google_trends: number;
  /** int 0-100 */
  total_score: number;
  zone: Zone;
  /** Sub-scores 0-100, las 7 claves siempre presentes. */
  components: ReportComponents;
  /** Texto de acción del server, p. ej. "COMPRA NORMAL (DCA)". */
  action: string;
  /** 0-1, fracción del aporte mensual a desplegar. */
  ratio: number;
  zone_history: ZoneHistoryStats | null;
  /** "stored" en dashboard; "stored" | "live" en refresh. */
  source: 'stored' | 'live';
  /** Solo en refresh. */
  latest_candle_date: string | null;
  /** Solo en refresh (null en dashboard). */
  fallbacks: RefreshFallbacks | null;
}

export interface ScoreTrend {
  current: number;
  change_7d: number | null;
  change_30d: number | null;
  min_90d: number | null;
  max_90d: number | null;
}

export interface ZoneCurrent {
  date: string;
  zone: Zone;
  score: number;
  action: string;
  ratio: number;
  streak_days: number;
  streak_start: string;
  zone_history: ZoneHistoryStats | null;
  score_trend: ScoreTrend;
}

/** Racha de zona anterior (null si todavía no cambió de zona). */
export interface PreviousZoneRun {
  zone: Zone;
  start: string;
  end: string;
  days: number;
  score: number;
}

export interface ThresholdNeighbor {
  zone: Zone;
  min_score?: number;
  below_score?: number;
  points_needed?: number;
  headroom?: number;
}

/** Distancia a las zonas vecinas; up/down null en los extremos (High / Selling). */
export interface ZoneThresholds {
  score: number;
  zone: Zone;
  up: ThresholdNeighbor | null;
  down: ThresholdNeighbor | null;
}

export interface PriceContext {
  price: number;
  as_of: string;
  vs_ema_200_pct: number;
  ath: number;
  ath_date: string;
  /** Negativo. */
  drawdown_from_ath_pct: number;
  percentile_365d: number;
  change_7d_pct: number;
  change_30d_pct: number;
  change_90d_pct: number;
}

export interface ZoneDistributionRow {
  zone: Zone;
  days: number;
  share_pct: number;
  episodes: number;
  mean_episode_days: number | null;
  median_episode_days: number | null;
  first_seen: string | null;
  last_seen: string | null;
}

export interface ZoneTransition {
  date: string;
  from_zone: Zone;
  to_zone: Zone;
  direction: 'up' | 'down';
  days_in_previous: number;
  previous_end: string | null;
}

export interface ZoneSample {
  start: string;
  end: string;
  days: number;
  episodes: number;
}

/** Bloque `zone` del dashboard (o null). */
export interface ZoneContext {
  current: ZoneCurrent;
  previous: PreviousZoneRun | null;
  thresholds: ZoneThresholds;
  price_context: PriceContext | null;
  /** Las 4 zonas siempre, aunque estén vacías. */
  distribution: ZoneDistributionRow[];
  /** Últimos 8 cambios de zona, cronológicos. */
  transitions: ZoneTransition[];
  sample: ZoneSample;
}

/** Bloque `macro` del dashboard. Cada fuente trae su propio as_of. */
export interface MacroBlock {
  as_of: string;
  fear_greed: { value: number; classification: string; history_start: string };
  m2: { series_id: string; yoy: number; level: number; as_of: string };
  stocks: {
    sp500: number | null;
    nasdaq: number | null;
    dxy_trend: DxyTrend;
    dxy_level: number | null;
  };
  google_trends: { keyword: string; value: number; as_of: string };
}

export interface ZoneRule {
  zone: Zone;
  /** null en "Selling zone" (bucket -inf). */
  min_score: number | null;
  action: string;
  ratio: number;
}

export interface ComponentConfig {
  key: ComponentKey;
  weight: number;
  tag: string;
  description: string;
  /** true = valor alto = señal a favor de comprar. */
  contrarian: boolean;
}

/** Bloque `config` del dashboard (= GET /api/config). */
export interface ApiConfig {
  weights: ReportComponents;
  /** Orden: High ≥70, Moderate ≥50, Neutral ≥30, Selling. */
  zones: ZoneRule[];
  actions: Record<Zone, { action: string; ratio: number }>;
  components: ComponentConfig[];
}

export type BacktestHorizon = '7d' | '30d' | '90d' | '180d' | '365d';

export interface BacktestZoneRow {
  zone: Zone;
  n: number;
  horizon: BacktestHorizon;
  /** % */
  mean: number;
  /** % */
  median: number;
  /** % */
  win_rate: number;
}

export interface DayRangeSample {
  start: string;
  end: string;
  days: number;
}

/** Bloque `backtest` del dashboard (TTL 5 min server-side). */
export interface Backtest {
  zones: BacktestZoneRow[];
  correlation: number;
  correlation_horizon_days: number;
  sample: DayRangeSample;
}

export type CalibrationVerdict = 'positive' | 'negative' | 'noise' | 'no_data';

export interface CalibrationQuartile {
  quartile: number;
  n: number;
  mean: number;
}

export interface CalibrationComponent {
  key: ComponentKey;
  weight: number;
  pearson: number | null;
  verdict: CalibrationVerdict;
  tag: string;
  description: string;
  contrarian: boolean;
  quartiles: CalibrationQuartile[];
}

export interface ScoreBin {
  bin: string;
  n: number;
  mean: number;
  median: number;
  win_rate: number;
}

/** Bloque `calibration` del dashboard (TTL 5 min server-side). */
export interface Calibration {
  horizon_days: number;
  sample: DayRangeSample;
  /** Ordenado por correlación (mejor predictor primero). */
  components: CalibrationComponent[];
  score_bins: ScoreBin[];
  total_score_pearson: number | null;
  note: string | null;
}

/** Bloque `health` del dashboard. status degraded = sin ningún score almacenado. */
export interface Health {
  status: 'ok' | 'degraded';
  database: string;
  db_path: string;
  tables: Record<string, number>;
  latest_score_date: string | null;
  latest_score: number | null;
  server_time: string;
}

export interface DashboardHistoryRow {
  date: string;
  total_score: number;
  zone: Zone;
  /** Puede ser null si falta vela ese día. */
  close: number | null;
}

/** Bloque `history` del dashboard. */
export interface DashboardHistory {
  days: number;
  count: number;
  rows: DashboardHistoryRow[];
}

/** Respuesta de GET /api/dashboard (9 bloques). */
export interface DashboardResponse {
  report: ScoreSnapshot | null;
  zone: ZoneContext | null;
  macro: MacroBlock | null;
  config: ApiConfig;
  backtest: Backtest;
  calibration: Calibration;
  health: Health;
  history: DashboardHistory;
  /** "YYYY-MM-DD HH:MM:SS" del servidor. */
  generated_at: string;
}

/**
 * Error estándar de la API: {detail: string} (503/500).
 * Ojo: las validaciones de query de FastAPI (422) devuelven
 * detail como array de ítems {loc, msg, type}.
 */
export interface ApiErrorItem {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

export interface ApiErrorBody {
  detail: string | ApiErrorItem[];
}

/** Índice GET / → rutas agrupadas por tag. */
export interface ApiIndex {
  name: string;
  version: string;
  docs: string;
  endpoints: Record<string, { path: string; methods: string[]; summary: string }[]>;
}

/* ------------------------------------------------------------------ */
/* Los 7 endpoints de tablas (mismo contrato: limit/date/start/end).   */
/* Filas de más antigua a más reciente, fecha YYYY-MM-DD.              */
/* `total` = filas de la ventana antes del limit → paginar con ?end=   */
/* ------------------------------------------------------------------ */

export type TableSource =
  | 'scores'
  | 'klines'
  | 'indicators'
  | 'fear-greed'
  | 'fred'
  | 'stocks'
  | 'google-trends';

export interface TableQuery {
  /** 1-365, defecto 20. */
  limit?: number;
  /** YYYY-MM-DD (excluye start/end). */
  date?: string;
  /** YYYY-MM-DD. */
  start?: string;
  /** YYYY-MM-DD. */
  end?: string;
}

export interface TableResponse<S extends TableSource = TableSource> {
  source: S;
  table: string;
  date: string | null;
  start: string | null;
  end: string | null;
  limit: number;
  /** Filas devueltas. */
  count: number;
  /** Filas de la ventana antes del limit. */
  total: number;
  rows: TableRow<S>[];
}

export interface ScoresRow {
  date: string;
  btc_price: number;
  ema_200: number;
  rsi_14: number;
  fear_greed: number;
  m2_yoy: number;
  sp500: number | null;
  nasdaq: number | null;
  dxy: number;
  macd_hist: number;
  google_trends: number;
  total_score: number;
  zone: Zone;
}

export interface KlinesRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorsRow {
  date: string;
  ema_200: number;
  rsi_14: number;
  macd: number;
  macd_signal: number;
  macd_hist: number;
}

export interface FearGreedRow {
  date: string;
  value: number;
  classification: string;
}

export interface FredRow {
  date: string;
  value: number;
  /** Siempre "M2SL". */
  series_id: string;
}

export interface StocksRow {
  date: string;
  sp500: number;
  nasdaq: number;
  /** Nivel (el trend está en metrics). */
  dxy: number;
}

export interface GoogleTrendsRow {
  date: string;
  value: number;
  /** Siempre "bitcoin". */
  keyword: string;
}

/** Mapa fuente → fila, para tipar las respuestas de tabla. */
export interface TableRowMap {
  scores: ScoresRow;
  klines: KlinesRow;
  indicators: IndicatorsRow;
  'fear-greed': FearGreedRow;
  fred: FredRow;
  stocks: StocksRow;
  'google-trends': GoogleTrendsRow;
}

export type TableRow<S extends TableSource> = TableRowMap[S];

/** Unión discriminada por `source` (para manejar todas las tablas juntas). */
export type AnyTableResponse = { [S in TableSource]: TableResponse<S> }[TableSource];
