import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { ZoneInfo } from '../../core/accumulation-logic';

@Component({
  selector: 'app-buy-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule],
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
          <div class="hero-main">
            <span class="action">{{ zone().action }}</span>
            <span class="amount num" [style.color]="zone().color">{{ formattedAmount() }}</span>
            <span class="of">de tu monto mensual</span>
          </div>
          <span class="percent num" [style.color]="zone().color">{{ percent() }}%</span>
        </div>

        <div class="alloc-track">
          <span
            class="alloc-fill"
            [style.width.%]="percent()"
            [style.background]="zone().color"
          ></span>
        </div>

        <div class="monthly">
          <label for="monthly-amount">Monto mensual configurable</label>
          <input
            id="monthly-amount"
            class="range"
            type="range"
            min="100"
            max="10000"
            step="100"
            [value]="monthlyAmount()"
            [style.accent-color]="zone().color"
            (input)="onAmountChange($event)"
          />
          <div class="monthly-values num">
            <span>$100</span>
            <span class="current">{{ monthlyFormatted() }}</span>
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
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0 12px;
    }
    .hero-main {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .action {
      color: var(--text-secondary);
      font-size: 0.92rem;
    }
    .amount {
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }
    .of {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .percent {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      white-space: nowrap;
    }
    .alloc-track {
      display: block;
      height: 10px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.18);
      overflow: hidden;
    }
    .alloc-fill {
      display: block;
      height: 100%;
      border-radius: 999px;
      transition: width 0.4s ease, background 0.4s ease;
    }
    .monthly {
      margin-top: 16px;
    }
    .monthly label {
      display: block;
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin-bottom: 8px;
    }
    .range {
      display: block;
      width: 100%;
      margin: 0;
      cursor: pointer;
    }
    .monthly-values {
      display: flex;
      justify-content: space-between;
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin-top: 6px;
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
