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
import { MatIconModule } from '@angular/material/icon';
import { catchError, EMPTY, finalize } from 'rxjs';

import { DashboardResponse, RefreshFallbacks, ScoreSnapshot } from '../../api/api.types';
import { FinancialDataService } from '../../services/financial-data.service';
import { resolveZone, zoneInfoFor, ZoneInfo } from '../../core/accumulation-logic';
import { ScoreGaugeComponent } from '../../components/score-gauge/score-gauge.component';
import { BuyPanelComponent } from '../../components/buy-panel/buy-panel.component';
import { ComponentsCardComponent } from '../../components/components-card/components-card.component';
import { MetricsGridComponent } from '../../components/metrics-grid/metrics-grid.component';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: DashboardResponse };

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

const FALLBACK_LABELS: Record<keyof RefreshFallbacks, string> = {
  google_trends_fallback: 'Google Trends',
  stored_indicators: 'Indicadores (MACD)',
  sp500: 'S&P 500',
  nasdaq: 'NASDAQ',
  m2: 'M2',
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local timestamp in the same format as the server's generated_at. */
function nowStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ScoreGaugeComponent,
    BuyPanelComponent,
    ComponentsCardComponent,
    MetricsGridComponent,
  ],
  template: `
    <div class="page">
      @if (isLoading()) {
        <div class="skeleton" aria-busy="true" aria-live="polite">
          <div class="sk-row">
            <mat-card class="sk-card sk-hero"></mat-card>
            <mat-card class="sk-card sk-side"></mat-card>
          </div>
          <mat-card class="sk-card sk-block"></mat-card>
          <mat-card class="sk-card sk-block"></mat-card>
        </div>
      } @else if (errorMessage()) {
        <mat-card class="state error">
          <mat-icon color="warn">cloud_off</mat-icon>
          <h2>No se pudo cargar el dashboard</h2>
          <p>{{ errorMessage() }}</p>
          <button mat-flat-button color="primary" (click)="retry()">
            <mat-icon inline>refresh</mat-icon>
            Reintentar
          </button>
        </mat-card>
      } @else if (dashboard(); as d) {
        @if (d.report; as r) {
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
                <div class="summary-right">
                  <span class="zone-badge" [style.color]="zoneInfo().color">
                    {{ zoneInfo().label }}
                  </span>
                  <button
                    mat-stroked-button
                    class="refresh-btn"
                    [disabled]="refreshing()"
                    (click)="refresh()"
                  >
                    <mat-icon inline [class.spinning]="refreshing()">
                      {{ refreshing() ? 'progress_activity' : 'sync' }}
                    </mat-icon>
                    {{ refreshing() ? 'Actualizando… (10-15 s)' : 'Actualizar datos' }}
                  </button>
                </div>
              </div>

              @if (refreshError()) {
                <p class="alert error">
                  <mat-icon inline>warning</mat-icon>
                  {{ refreshError() }}
                </p>
              }
              @if (fallbacks().length) {
                <p class="alert warn">
                  <mat-icon inline>warning_amber</mat-icon>
                  Datos por defecto en: {{ fallbackList() }}. Se reintentarán en la próxima
                  actualización.
                </p>
              }

              <app-score-gauge [score]="r.total_score" [color]="zoneInfo().color" />

              <p class="zone-summary">
                <mat-icon inline>info</mat-icon>
                {{ zoneInfo().summary }}
              </p>
            </mat-card>

            <app-buy-panel [zone]="zoneInfo()" />
          </div>

          <app-components-card [report]="r" [config]="d.config" />
          <app-metrics-grid [report]="r" />

          <p class="generated num">Generado {{ d.generated_at }} · {{ d.health.status }}</p>
        } @else {
          <mat-card class="state error">
            <mat-icon color="warn">database</mat-icon>
            <p>La API no tiene datos de BTC todavía. Ejecutá el pipeline (POST /api/refresh) e intentá de nuevo.</p>
            <button mat-flat-button color="primary" [disabled]="refreshing()" (click)="refresh()">
              <mat-icon inline>refresh</mat-icon>
              Actualizar datos
            </button>
          </mat-card>
        }
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
      padding: 24px 24px 48px;
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
    .state h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
    }
    .state p {
      margin: 0;
      max-width: 520px;
      line-height: 1.5;
    }
    .state.error mat-icon {
      font-size: 44px;
      width: 44px;
      height: 44px;
    }
    .skeleton {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .sk-row {
      display: grid;
      grid-template-columns: minmax(0, 5fr) minmax(0, 4fr);
      gap: 20px;
    }
    .sk-card {
      position: relative;
      overflow: hidden;
      background: var(--surface);
      border: 1px solid var(--border);
    }
    .sk-hero,
    .sk-side {
      height: 360px;
    }
    .sk-block {
      height: 220px;
    }
    .sk-card::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.12), transparent);
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer {
      to {
        transform: translateX(100%);
      }
    }
    @media (max-width: 900px) {
      .sk-row {
        grid-template-columns: 1fr;
      }
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
    .summary-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }
    .refresh-btn {
      white-space: nowrap;
    }
    .refresh-btn mat-icon.spinning {
      animation: spin 1.2s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    .alert {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 0.86rem;
      line-height: 1.4;
    }
    .alert mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex: none;
    }
    .alert.error {
      color: #fca5a5;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
    }
    .alert.warn {
      color: #fcd34d;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
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
    .generated {
      margin: 0;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    @media (max-width: 900px) {
      .summary-row {
        grid-template-columns: 1fr;
      }
      .summary-right {
        align-items: flex-start;
        width: 100%;
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
  readonly refreshing = signal(false);
  readonly refreshError = signal('');

  readonly isLoading = computed(() => this.state().status === 'loading');

  readonly errorMessage = computed(() => {
    const s = this.state();
    return s.status === 'error' ? s.message : '';
  });

  readonly dashboard = computed<DashboardResponse | null>(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.data : null;
  });

  readonly report = computed<ScoreSnapshot | null>(() => this.dashboard()?.report ?? null);

  readonly zoneInfo = computed<ZoneInfo>(() => {
    const r = this.report();
    return r ? zoneInfoFor(r) : resolveZone(0);
  });

  readonly fallbacks = computed<(keyof RefreshFallbacks)[]>(() => {
    const f = this.report()?.fallbacks;
    if (!f) return [];
    return (Object.keys(FALLBACK_LABELS) as (keyof RefreshFallbacks)[]).filter((k) => f[k]);
  });

  readonly fallbackList = computed(() =>
    this.fallbacks()
      .map((k) => FALLBACK_LABELS[k])
      .join(', '),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set({ status: 'loading' });
    this.refreshError.set('');
    const sub = this.service
      .getDashboard(90)
      .pipe(
        catchError((err: Error) => {
          this.state.set({ status: 'error', message: err.message });
          return EMPTY;
        }),
      )
      .subscribe((data) => this.state.set({ status: 'loaded', data }));
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  retry(): void {
    this.load();
  }

  refresh(): void {
    if (this.refreshing()) return;
    this.refreshError.set('');
    this.refreshing.set(true);
    const sub = this.service
      .refresh()
      .pipe(finalize(() => this.refreshing.set(false)))
      .subscribe({
        next: (report) => {
          const s = this.state();
          if (s.status === 'loaded') {
            this.state.set({
              status: 'loaded',
              data: { ...s.data, report, generated_at: nowStamp() },
            });
          } else {
            this.load();
          }
        },
        error: (err: Error) => this.refreshError.set(err.message),
      });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  protected readonly formatDate = formatDate;
  protected readonly USD = USD;
}
