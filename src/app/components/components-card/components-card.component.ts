import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, TooltipItem } from 'chart.js';

import { BtcReport, ReportComponent } from '../../models/btc-report.model';
import { orderComponents, topComponents } from '../../core/accumulation-logic';

@Component({
  selector: 'app-components-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatChipsModule, MatIconModule, BaseChartDirective],
  template: `
    <mat-card class="components-card">
      <mat-card-header>
        <mat-card-title-group>
          <mat-card-title>
            <mat-icon inline>monitoring</mat-icon>
            Señales por componente
          </mat-card-title>
          <mat-card-subtitle>Valor 0-100 — mayor = más atractivo para acumular</mat-card-subtitle>
        </mat-card-title-group>
      </mat-card-header>

      <mat-card-content>
        <div class="top-3">
          <span class="top-label">
            <mat-icon inline>bolt</mat-icon>
            Señales más fuertes
          </span>
          <mat-chip-set aria-label="Señales más fuertes">
            @for (c of top(); track c.key) {
              <mat-chip [class]="'rank-' + $index" highlighted>
                <mat-icon matChipIcon inline>{{ icon($index) }}</mat-icon>
                {{ c.label }} · {{ c.value.toFixed(0) }}
              </mat-chip>
            }
          </mat-chip-set>
        </div>

        <div class="chart-wrap">
          <canvas baseChart type="bar" [data]="chartData()" [options]="chartOptions"></canvas>
        </div>

        <div class="list">
          @for (c of components(); track c.key) {
            <div class="row" [class.strong]="$index < 3" [attr.title]="c.description">
              <span class="dot" [style.background]="barColor($index)"></span>
              <span class="name">
                {{ c.label }}
                <span class="tag">{{ c.tag }}</span>
              </span>
              <div class="mini-bar" aria-hidden="true">
                <span class="mini-fill" [style.width.%]="c.value" [style.background]="barColor($index)"></span>
              </div>
              <span class="value num">{{ c.value.toFixed(0) }}</span>
              <span class="weight">peso {{ (c.weight * 100).toFixed(0) }}%</span>
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
    .top-3 {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 4px 0 12px;
    }
    .top-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .chart-wrap {
      height: 240px;
      margin-bottom: 18px;
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .row {
      display: grid;
      grid-template-columns: auto 1fr minmax(70px, 140px) 34px auto;
      gap: 10px;
      align-items: center;
      padding: 7px 10px;
      border-radius: 10px;
      background: rgba(148, 163, 184, 0.05);
      border-left: 2px solid transparent;
    }
    .row.strong {
      background: rgba(148, 163, 184, 0.09);
      border-left-color: var(--zone-high);
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .name {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.92rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tag {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(247, 147, 26, 0.14);
      color: var(--btc-orange);
      white-space: nowrap;
    }
    .mini-bar {
      height: 8px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.15);
      overflow: hidden;
    }
    .mini-fill {
      display: block;
      height: 100%;
      border-radius: 999px;
      transition: width 0.5s ease;
    }
    .value {
      text-align: right;
      font-weight: 600;
    }
    .weight {
      color: var(--text-secondary);
      font-size: 0.78rem;
      white-space: nowrap;
    }
    @media (max-width: 560px) {
      .row {
        grid-template-columns: auto 1fr 34px;
      }
      .mini-bar,
      .weight {
        display: none;
      }
    }
  `,
})
export class ComponentsCardComponent {
  readonly report = input.required<BtcReport>();

  readonly components = computed<ReportComponent[]>(() =>
    orderComponents(this.report().components),
  );

  readonly top = computed<ReportComponent[]>(() => topComponents(this.report().components, 3));

  readonly chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const items = this.components();
    return {
      labels: items.map((c) => c.label),
      datasets: [
        {
          data: items.map((c) => c.value),
          backgroundColor: items.map((_, i) => this.barColor(i)),
          borderColor: 'transparent',
          borderRadius: 6,
          barThickness: 16,
          maxBarThickness: 18,
        },
      ],
    };
  });

  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(7, 11, 20, 0.92)',
        borderColor: 'rgba(148, 163, 184, 0.25)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => {
            const item = this.components()[ctx.dataIndex];
            return ` ${item.value.toFixed(1)} / 100 · peso ${(item.weight * 100).toFixed(0)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#94a3b8' },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#cbd5e1', font: { size: 12 } },
      },
    },
  };

  barColor(index: number): string {
    return index === 0 ? '#22c55e' : index === 1 ? '#4ade80' : index === 2 ? '#86efac' : '#334155';
  }

  icon(index: number): string {
    return index === 0 ? 'military_tech' : index === 1 ? 'trending_up' : 'local_fire_department';
  }
}