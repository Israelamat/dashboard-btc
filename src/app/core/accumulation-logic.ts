import { ComponentKey, COMPONENT_META, ReportComponent, ReportComponents } from '../models/btc-report.model';

/**
 * Lógica de zona/acción/ratio. Funciones puras y tipadas, sin dependencia
 * de Angular: mismo output sirve para template, pipes o tests unitarios.
 */

export type ZoneKey = 'HIGH' | 'MODERATE' | 'NEUTRAL' | 'SELLING';

export interface ZoneInfo {
  key: ZoneKey;
  label: string;
  action: string;
  /** Fracción (0..1) del monto mensual a invertir "ahora". */
  ratio: number;
  /** Color CSS de la zona (variable del tema). */
  color: string;
  summary: string;
}

const ZONES: ReadonlyArray<ZoneInfo> = [
  {
    key: 'HIGH',
    label: 'High accumulation zone',
    action: 'Acumulación fuerte',
    ratio: 1,
    color: 'var(--zone-high)',
    summary: 'Condiciones muy favorables: invertí el monto completo ahora.',
  },
  {
    key: 'MODERATE',
    label: 'Moderate accumulation zone',
    action: 'Acumulación moderada',
    ratio: 0.5,
    color: 'var(--zone-moderate)',
    summary: 'Buenas condiciones: acumulación moderada, DCA recomendado.',
  },
  {
    key: 'NEUTRAL',
    label: 'Neutral zone',
    action: 'Compra ligera',
    ratio: 0.25,
    color: 'var(--zone-neutral)',
    summary: 'Sin señales claras: inversión conservadora, revisar más seguido.',
  },
  {
    key: 'SELLING',
    label: 'Selling zone',
    action: 'Pausar acumulación',
    ratio: 0,
    color: 'var(--zone-selling)',
    summary: 'Precio sobrecalentado: no conviene acumular ahora.',
  },
];

/** Resuelve zona/acción/ratio a partir del score total (0-100). */
export function resolveZone(score: number): ZoneInfo {
  if (score >= 70) return ZONES[0];
  if (score >= 50) return ZONES[1];
  if (score >= 30) return ZONES[2];
  return ZONES[3];
}

/**
 * Convierte el mapa `components` del reporte en una lista de
 * componentes enriquecidos, ordenada por valor descendente.
 */
export function orderComponents(components: ReportComponents): ReportComponent[] {
  return (Object.keys(COMPONENT_META) as ComponentKey[])
    .map((key) => ({
      key,
      value: components[key],
      label: COMPONENT_META[key].label,
      weight: COMPONENT_META[key].weight,
      tag: COMPONENT_META[key].tag,
      description: COMPONENT_META[key].description,
      contrarian: COMPONENT_META[key].contrarian,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Top N señales más fuertes (mayor valor), por defecto 3. */
export function topComponents(components: ReportComponents, n = 3): ReportComponent[] {
  return orderComponents(components).slice(0, n);
}