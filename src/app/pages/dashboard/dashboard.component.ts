import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { catchError, EMPTY } from 'rxjs';

import { BtcReport } from '../../models/btc-report.model';
import { FinancialDataService } from '../../services/financial-data.service';
import { resolveZone, ZoneInfo } from '../../core/accumulation-logic';
import { ScoreGaugeComponent } from '../../components/score-gauge/score-gauge.component';
import { BuyPanelComponent } from '../../components/buy-panel/buy-panel.component';
import { ComponentsCardComponent } from '../../components/components-card/components-card.component';
import { MetricsGridComponent } from '../../components/metrics-grid/metrics-grid.component';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: BtcReport };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  const index = Number(month) - 1;
  const label = MONTHS[index] ?? iso;
  return `${label} ${Number(day)}, ${year}`;
}

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    ScoreGaugeComponent,
    BuyPanelComponent,
    ComponentsCardComponent,
    MetricsGridComponent,
  ],
  template: `
    <div class="page">
      @if (isLoading()) {
        <mat-card class="state">
          <mat-spinner diameter="46"></mat-spinner>
          <p>Analizando señales de mercado…</p>
        </mat-card>
      } @else if (errorMessage()) {
        <mat-card class="state error">
          <mat-icon color="warn">error_outline</mat-icon>
          <p>{{ errorMessage() }}</p>
          <button mat-flat-button color="primary" (click)="retry()">
            <mat-icon inline>refresh</mat-icon>
            Reintentar
          </button>
        </mat-card>
      } @else if (report(); as r) {
        <div class="summary-row">
          <mat-card class="summary">
            <div class="summary-head">
              <div class="summary-left">
                <span class="kicker">Análisis del mercado · {{ formatDate(r.date) }}</span>
                <div class="price-block">
                  <span class="price num">{{ USD.format(r.btc_price) }}</span>
                  <span class="ticker">BTC/USD</span>
                </div>
                <span class="ema-note">EMA-200: {{ USD.format(r.ema_200) }}</span>
              </div>
              <span class="zone-badge" [style.color]="zoneInfo().color">
                {{ zoneInfo().label }}
              </span>
            </div>

            <app-score-gauge [score]="r.total_score" [color]="zoneInfo().color" />

            <p class="zone-summary">
              <mat-icon inline>info</mat-icon>
              {{ zoneInfo().summary }}
            </p>
          </mat-card>

          <app-buy-panel [zone]="zoneInfo()" />
        </div>

        <app-components-card [report]="r" />
        <app-metrics-grid [report]="r" />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .page {
      max-width: 1180px;
      margin-inline: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .state {
      padding: 44px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
      color: var(--text-secondary);
    }
    .state p {
      margin: 0;
    }
    .state.error mat-icon {
      font-size: 44px;
      width: 44px;
      height: 44px;
    }
    .summary-row {
      display: grid;
      grid-template-columns: minmax(0, 5fr) minmax(0, 4fr);
      gap: 20px;
      align-items: stretch;
    }
    .summary {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-bottom: 20px;
    }
    .summary-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .kicker {
      color: var(--text-secondary);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .price-block {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-top: 6px;
    }
    .price {
      font-size: clamp(1.9rem, 5vw, 2.7rem);
      font-weight: 800;
      letter-spacing: -0.04em;
      color: var(--btc-orange);
    }
    .ticker {
      color: var(--text-secondary);
      font-weight: 600;
    }
    .ema-note {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    .zone-badge {
      font-size: 0.8rem;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid currentColor;
      background: color-mix(in srgb, currentColor 12%, transparent);
      white-space: nowrap;
    }
    .zone-summary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: var(--text-secondary);
      font-size: 0.92rem;
      margin: -4px 0 0;
      text-align: center;
    }
    .zone-summary mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    @media (max-width: 900px) {
      .summary-row {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 480px) {
      .page {
        padding: 16px;
      }
    }
  `,
})
export class DashboardComponent {
  private readonly service = inject(FinancialDataService);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<LoadState>({ status: 'loading' });

  readonly isLoading = computed(() => this.state().status === 'loading');

  readonly errorMessage = computed(() => {
    const s = this.state();
    return s.status === 'error' ? s.message : '';
  });

  readonly report = computed<BtcReport | null>(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.data : null;
  });

  readonly zoneInfo = computed<ZoneInfo>(() =>
    resolveZone(this.report()?.total_score ?? 0),
  );

  constructor() {
    this.load();
  }

  load(): void {
    // Único lugar que toca el servicio: aquí se verá la latencia simulada
    // y el error real cuando exista el backend.
    this.state.set({ status: 'loading' });
    const sub = this.service
      .getFinancialData()
      .pipe(
        catchError((err: { message?: string }) => {
          this.state.set({
            status: 'error',
            message:
              err?.message ?? 'No se pudo cargar el reporte. Verificá la conexión e intentá de nuevo.',
          });
          return EMPTY;
        }),
      )
      .subscribe((data) => this.state.set({ status: 'loaded', data }));
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  retry(): void {
    this.load();
  }

  protected readonly formatDate = formatDate;
  protected readonly USD = USD;
}