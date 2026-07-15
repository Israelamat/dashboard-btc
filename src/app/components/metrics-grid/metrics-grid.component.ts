import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { BtcReport, DxyTrend } from '../../models/btc-report.model';

interface MetricTile {
  label: string;
  value: string;
  detail?: string;
  chipText?: string;
  chipColor?: string;
  icon?: string;
}

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUM = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function rsiNote(rsi: number): string {
  if (rsi >= 70) return 'Sobrecompra (malo para acumular)';
  if (rsi <= 30) return 'Sobreventa (mejor para acumular)';
  return 'Rango neutral';
}

function fearGreedLabel(v: number): string {
  if (v <= 24) return 'Extreme Fear';
  if (v <= 44) return 'Fear';
  if (v <= 54) return 'Neutral';
  if (v <= 74) return 'Greed';
  return 'Extreme Greed';
}

function fearGreedColor(v: number): string {
  if (v <= 44) return 'var(--zone-high)';
  if (v <= 54) return 'var(--zone-neutral)';
  return 'var(--zone-selling)';
}

function dxyLabel(trend: DxyTrend): string {
  return trend === 'bearish' ? 'Bearish (dólar débil)' : trend === 'bullish' ? 'Bullish (dólar fuerte)' : 'Neutral';
}

function dxyColor(trend: DxyTrend): string {
  return trend === 'bearish' ? 'var(--zone-high)' : trend === 'bullish' ? 'var(--zone-selling)' : 'var(--zone-neutral)';
}

@Component({
  selector: 'app-metrics-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule],
  template: `
    <mat-card class="metrics-card">
      <mat-card-header>
        <mat-card-title-group>
          <mat-card-title>
            <mat-icon inline>query_stats</mat-icon>
            Métricas secundarias
          </mat-card-title>
          <mat-card-subtitle>Contexto macro y técnico del mercado</mat-card-subtitle>
        </mat-card-title-group>
      </mat-card-header>

      <mat-card-content>
        <div class="grid">
          @for (m of tiles(); track m.label) {
            <div class="tile">
              <span class="label">
                @if (m.icon) {
                  <mat-icon inline>{{ m.icon }}</mat-icon>
                }
                {{ m.label }}
              </span>
              <span class="value num">{{ m.value }}</span>
              @if (m.chipText) {
                <span class="chip" [style.color]="m.chipColor">
                  {{ m.chipText }}
                </span>
              }
              @if (m.detail && !m.chipText) {
                <span class="detail">{{ m.detail }}</span>
              }
            </div>
          }
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
    }
    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .tile {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 14px;
      border-radius: 12px;
      background: rgba(148, 163, 184, 0.05);
      border: 1px solid var(--border);
    }
    .label {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .label mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--btc-orange);
    }
    .value {
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .chip {
      align-self: flex-start;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 999px;
      background: color-mix(in srgb, currentColor 14%, transparent);
    }
    .detail {
      color: var(--text-secondary);
      font-size: 0.8rem;
    }
    @media (max-width: 900px) {
      .grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 480px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class MetricsGridComponent {
  readonly report = input.required<BtcReport>();

  readonly tiles = computed<MetricTile[]>(() => {
    const r = this.report();
    const belowEma = r.btc_price < r.ema_200;
    const emaPct = ((r.btc_price / r.ema_200 - 1) * 100).toFixed(1);
    return [
      { label: 'S&P 500', value: USD.format(r.sp500), icon: 'show_chart' },
      { label: 'NASDAQ', value: USD.format(r.nasdaq), icon: 'show_chart' },
      {
        label: 'RSI-14',
        value: NUM.format(r.rsi_14),
        detail: rsiNote(r.rsi_14),
        icon: 'speed',
      },
      { label: 'MACD histograma', value: NUM.format(r.macd_hist), icon: 'bar_chart' },
      {
        label: 'M2 YoY',
        value: `${r.m2_yoy >= 0 ? '+' : ''}${r.m2_yoy.toFixed(1)}%`,
        detail: 'Liquidez global',
        icon: 'monetization_on',
      },
      {
        label: 'Fear & Greed',
        value: `${r.fear_greed}`,
        chipText: NUM.format(r.fear_greed) + ' · ' + fearGreedLabel(r.fear_greed),
        chipColor: fearGreedColor(r.fear_greed),
        icon: 'sentiment_very_satisfied',
      },
      {
        label: 'Google Trends',
        value: `${NUM.format(r.google_trends)}`,
        detail: 'Menor interés = mejor (contrarian)',
        icon: 'travel_explore',
      },
      {
        label: 'EMA-200',
        value: USD.format(r.ema_200),
        chipText: belowEma ? `BTC ${emaPct}% bajo EMA` : `BTC ${emaPct}% sobre EMA`,
        chipColor: belowEma ? 'var(--zone-high)' : 'var(--zone-selling)',
        icon: 'trending_flat',
      },
      {
        label: 'Tendencia DXY',
        value: r.dxy.toUpperCase(),
        chipText: dxyLabel(r.dxy),
        chipColor: dxyColor(r.dxy),
        icon: 'currency_exchange',
      },
    ];
  });
}