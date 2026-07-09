import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ZoneInfo } from '../../core/accumulation-logic';

@Component({
  selector: 'app-buy-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatSliderModule, MatIconModule, MatButtonModule],
  template: `
    <mat-card class="buy-card">
      <mat-card-header>
        <mat-card-title-group>
          <mat-card-title>
            <mat-icon inline>storefront</mat-icon>
            Posible Compra
          </mat-card-title>
          <mat-card-subtitle>Recomendación según el score</mat-card-subtitle>
        </mat-card-title-group>
      </mat-card-header>

      <mat-card-content>
        <div class="hero">
          <span class="action">{{ zone().action }}</span>
          <span class="percent num" [style.color]="zone().color">
            {{ percent() }}%
          </span>
          <span class="amount num">
            {{ formattedAmount() }}
          </span>
          <span class="of">de tu monto mensual</span>
        </div>

        <div class="alloc" [style.--progress]="percent() + '%'">
          <span class="alloc-track">
            <span class="alloc-fill" [style.background]="zone().color"></span>
          </span>
          <span class="alloc-label">
            {{ ratioLabel() }}
          </span>
        </div>

        <p class="summary">{{ zone().summary }}</p>

        <div class="monthly">
          <label for="monthly-amount">Monto mensual configurable</label>
          <mat-slider
            id="monthly-amount"
            min="100"
            max="10000"
            step="100"
            class="slider"
          >
            <input
              matSliderThumb
              [value]="monthlyAmount()"
              (input)="onAmountChange($event)"
            />
          </mat-slider>
          <div class="monthly-values num">
            <span>$100</span>
            <span class="current num">{{ monthlyFormatted() }}</span>
            <span>$10,000</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
    }
    .buy-card {
      height: 100%;
    }
    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hero {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-areas:
        'action percent'
        'amount amount'
        'of of';
      gap: 2px 12px;
      align-items: baseline;
      padding: 8px 0 12px;
    }
    .action {
      grid-area: action;
      color: var(--text-secondary);
      font-size: 0.92rem;
    }
    .percent {
      grid-area: percent;
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .amount {
      grid-area: amount;
      font-size: 2.4rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .of {
      grid-area: of;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .alloc {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 10px 0 6px;
    }
    .alloc-track {
      flex: 1;
      height: 10px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.18);
      overflow: hidden;
      position: relative;
    }
    .alloc-fill {
      display: block;
      height: 100%;
      width: var(--progress);
      border-radius: 999px;
      transition: width 0.4s ease, background 0.4s ease;
    }
    .alloc-label {
      color: var(--text-secondary);
      font-size: 0.85rem;
      white-space: nowrap;
    }
    .summary {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.45;
      margin: 6px 0 16px;
    }
    .monthly label {
      display: block;
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin-bottom: 6px;
    }
    .monthly-values {
      display: flex;
      justify-content: space-between;
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin-top: 2px;
    }
    .monthly-values .current {
      color: var(--text-primary);
      font-weight: 600;
    }
  `,
})
export class BuyPanelComponent {
  readonly zone = input.required<ZoneInfo>();

  readonly monthlyAmount = signal(1000);

  readonly percent = computed(() => Math.round(this.zone().ratio * 100));

  readonly amountNow = computed(() => this.monthlyAmount() * this.zone().ratio);

  readonly formattedAmount = computed(() => this.format(this.amountNow()));

  readonly monthlyFormatted = computed(() => this.format(this.monthlyAmount()));

  readonly ratioLabel = computed(() =>
    this.percent() === 100
      ? `100% del monto`
      : this.percent() === 0
        ? 'Sin inversión esta ronda'
        : `${this.percent()}% del monto ahora`,
  );

  readonly currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  onAmountChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = Number(target?.value);
    if (Number.isFinite(value)) {
      this.monthlyAmount.set(value);
    }
  }

  private format(value: number): string {
    return this.currency.format(Math.round(value * 100) / 100);
  }
}