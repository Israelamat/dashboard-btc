import { ComponentKey } from '../api/api.types';

export type { ComponentKey, DxyTrend, ReportComponents, ScoreSnapshot } from '../api/api.types';

/** One score component, merging API metadata (`config.components`) with its value. */
export interface ComponentView {
  key: ComponentKey;
  label: string;
  /** null when the component's source was unavailable that day. */
  value: number | null;
  weight: number;
  tag: string;
  description: string;
  /** true = contrarian signal (high value comes from "bad" market conditions). */
  contrarian: boolean;
}
