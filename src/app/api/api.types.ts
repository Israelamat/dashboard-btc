/** The 4 exact server zone strings. Use as i18n/color keys. */
export type Zone =
  | 'High accumulation zone'
  | 'Moderate accumulation zone'
  | 'Neutral zone'
  | 'Selling zone';

/** DXY trend: bearish = weak dollar. */
export type DxyTrend = 'bearish' | 'bullish' | 'neutral';

/** Sub-score keys (always all 7 in `components` and `weights`). */
export type ComponentKey =
  | 'google_trends'
  | 'macd'
  | 'dxy'
  | 'm2'
  | 'ema_200'
  | 'fear_greed'
  | 'rsi';

/** Sub-score map (0-100, and also weights, which sum to 1). */
export type ReportComponents = Record<ComponentKey, number>;

export interface ZoneHistoryStats {
  n: number;
  mean: number;
  win: number;
}

/** Fallbacks applied by POST /api/refresh. true = a neutral value was used. */
export interface RefreshFallbacks {
  google_trends_fallback: boolean;
  stored_indicators: boolean;
  sp500: boolean;
  nasdaq: boolean;
  m2: boolean;
}

export interface ScoreSnapshot {
  date: string;
  btc_price: number;
  ema_200: number;
  rsi_14: number;
  fear_greed: number;
  m2_yoy: number;
  sp500: number | null;
  nasdaq: number | null;
  dxy: DxyTrend;
  macd_hist: number;
  google_trends: number;
  total_score: number;
  zone: Zone;
  components: ReportComponents;
  action: string;
  /** 0-1 fraction of the monthly contribution to deploy. */
  ratio: number;
  zone_history: ZoneHistoryStats | null;
  /** "stored" in dashboard; "stored" | "live" in refresh. */
  source: 'stored' | 'live';
  latest_candle_date: string | null;
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

/** Distance to neighbor zones; up/down are null at the extremes (High / Selling). */
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

export interface ZoneContext {
  current: ZoneCurrent;
  previous: PreviousZoneRun | null;
  thresholds: ZoneThresholds;
  price_context: PriceContext | null;
  distribution: ZoneDistributionRow[];
  transitions: ZoneTransition[];
  sample: ZoneSample;
}

/** Every source carries its own as_of. */
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
  /** null in "Selling zone" (bucket -inf). */
  min_score: number | null;
  action: string;
  ratio: number;
}

export interface ComponentConfig {
  key: ComponentKey;
  weight: number;
  tag: string;
  description: string;
  contrarian: boolean;
}

export interface ApiConfig {
  weights: ReportComponents;
  /** Order: High >=70, Moderate >=50, Neutral >=30, Selling. */
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

/** Server-side TTL 5 min. */
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

/** Server-side TTL 5 min. */
export interface Calibration {
  horizon_days: number;
  sample: DayRangeSample;
  /** Sorted by correlation (best predictor first). */
  components: CalibrationComponent[];
  score_bins: ScoreBin[];
  total_score_pearson: number | null;
  note: string | null;
}

/** status degraded = no stored score at all. */
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
  /** Can be null if the candle is missing that day. */
  close: number | null;
}

export interface DashboardHistory {
  days: number;
  count: number;
  rows: DashboardHistoryRow[];
}

/** Response of GET /api/dashboard (9 blocks). */
export interface DashboardResponse {
  report: ScoreSnapshot | null;
  zone: ZoneContext | null;
  macro: MacroBlock | null;
  config: ApiConfig;
  backtest: Backtest;
  calibration: Calibration;
  health: Health;
  history: DashboardHistory;
  /** "YYYY-MM-DD HH:MM:SS" from the server. */
  generated_at: string;
}

/**
 * Standard API error: {detail: string} (503/500).
 * Note: FastAPI query validation (422) returns
 * detail as an array of items {loc, msg, type}.
 */
export interface ApiErrorItem {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

export interface ApiErrorBody {
  detail: string | ApiErrorItem[];
}

export interface ApiIndex {
  name: string;
  version: string;
  docs: string;
  endpoints: Record<string, { path: string; methods: string[]; summary: string }[]>;
}

/* ------------------------------------------------------------------ */
/* The 7 table endpoints (same contract: limit/date/start/end).         */
/* Rows from oldest to newest, date YYYY-MM-DD.                         */
/* `total` = rows in the window before the limit -> paginate with ?end= */
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
  /** 1-365, default 20. */
  limit?: number;
  /** YYYY-MM-DD (excludes start/end). */
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
  count: number;
  /** Rows in the window before the limit. */
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
  /** Always "M2SL". */
  series_id: string;
}

export interface StocksRow {
  date: string;
  sp500: number;
  nasdaq: number;
  /** Level (the trend lives in metrics). */
  dxy: number;
}

export interface GoogleTrendsRow {
  date: string;
  value: number;
  /** Always "bitcoin". */
  keyword: string;
}

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

export type AnyTableResponse = { [S in TableSource]: TableResponse<S> }[TableSource];
