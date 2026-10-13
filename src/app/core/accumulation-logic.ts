import { ComponentView } from '../models/btc-report.model';
import {
  ComponentConfig,
  ComponentKey,
  ReportComponents,
  ScoreSnapshot,
} from '../api/api.types';

/**
 * Display names per component. The API does not send a human label
 * (only `key`, `tag`, `description`, `contrarian` and `weight`), so these
 * stay local; unknown keys fall back to a prettified key.
 */
const COMPONENT_LABELS: Record<ComponentKey, string> = {
  google_trends: 'Google Trends',
  macd: 'MACD (histograma)',
  dxy: 'DXY (índice dólar)',
  m2: 'M2 YoY',
  ema_200: 'EMA-200',
  fear_greed: 'Fear & Greed',
  rsi: 'RSI-14',
  proxy_mvrv: 'MVRV (proxy)',
  proxy_nupl: 'NUPL (proxy)',
};

export function componentLabel(key: string): string {
  return (
    COMPONENT_LABELS[key as ComponentKey] ??
    key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export type ZoneKey = 'HIGH' | 'MODERATE' | 'NEUTRAL' | 'SELLING';

export interface ZoneInfo {
  key: ZoneKey;
  label: string;
  action: string;
  ratio: number;
  color: string;
  summary: string;
}

const ZONES: ReadonlyArray<ZoneInfo> = [
  {
    key: 'HIGH',
    label: 'Zona de alta acumulación',
    action: 'Acumulación fuerte',
    ratio: 1,
    color: 'var(--zone-high)',
    summary: 'Condiciones muy favorables: invertí el monto completo ahora.',
  },
  {
    key: 'MODERATE',
    label: 'Zona de acumulación moderada',
    action: 'Acumulación moderada',
    ratio: 0.5,
    color: 'var(--zone-moderate)',
    summary: 'Buenas condiciones: acumulación moderada, DCA recomendado.',
  },
  {
    key: 'NEUTRAL',
    label: 'Zona neutral',
    action: 'Compra ligera',
    ratio: 0.25,
    color: 'var(--zone-neutral)',
    summary: 'Sin señales claras: inversión conservadora, revisar más seguido.',
  },
  {
    key: 'SELLING',
    label: 'Zona de venta',
    action: 'Pausar acumulación',
    ratio: 0,
    color: 'var(--zone-selling)',
    summary: 'Precio sobrecalentado: no conviene acumular ahora.',
  },
];

/** Maps the exact zone strings sent by the server to local zone keys. */
const SERVER_ZONE_TO_KEY: Record<string, ZoneKey> = {
  'High accumulation zone': 'HIGH',
  'Moderate accumulation zone': 'MODERATE',
  'Neutral zone': 'NEUTRAL',
  'Selling zone': 'SELLING',
};

export function resolveZone(score: number): ZoneInfo {
  if (score >= 70) return ZONES[0];
  if (score >= 50) return ZONES[1];
  if (score >= 30) return ZONES[2];
  return ZONES[3];
}

export function zoneInfoFor(report: ScoreSnapshot): ZoneInfo {
  const key = SERVER_ZONE_TO_KEY[report.zone];
  const base = ZONES.find((z) => z.key === key) ?? resolveZone(report.total_score);
  return {
    ...base,
    action: report.action?.trim() ? report.action : base.action,
    ratio: Number.isFinite(report.ratio) ? report.ratio : base.ratio,
  };
}

/**
 * Merges the API component metadata with the day's sub-scores. Weights, tags,
 * descriptions and `contrarian` come from `config.components`; the score from
 * `report.components`. Components without a value are kept (value `null`).
 */
export function buildComponents(
  config: ComponentConfig[],
  values: ReportComponents,
): ComponentView[] {
  return config.map((c) => ({
    key: c.key,
    label: componentLabel(c.key),
    value: values[c.key] ?? null,
    weight: c.weight,
    tag: c.tag,
    description: c.description,
    contrarian: c.contrarian,
  }));
}

/** Strongest sub-scores first; components without a value sink to the end. */
export function orderComponents(components: ComponentView[]): ComponentView[] {
  return [...components].sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
}

/** Top `n` components that actually have a value. */
export function topComponents(components: ComponentView[], n = 3): ComponentView[] {
  return orderComponents(components.filter((c) => c.value != null)).slice(0, n);
}