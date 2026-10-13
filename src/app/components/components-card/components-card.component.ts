import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { ComponentView } from '../../models/btc-report.model';
import { ApiConfig, ScoreSnapshot } from '../../api/api.types';
import { buildComponents, orderComponents, topComponents } from '../../core/accumulation-logic';

@Component({
  selector: 'app-components-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatChipsModule, MatIconModule],
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
                {{ c.label }} · {{ fmt(c.value) }}
              </mat-chip>
            }
          </mat-chip-set>
        </div>

        @if (missing() > 0) {
          <p class="note">
            <mat-icon inline>info</mat-icon>
            {{ missing() }} señal(es) sin dato hoy; el score se recalcula con las disponibles.
          </p>
        }
        @if (report().low_confidence) {
          <p class="note warn">
            <mat-icon inline>warning</mat-icon>
            Cobertura baja de señales: la zona puede estar limitada.
          </p>
        }

        <div class="list">
          @for (c of components(); track c.key) {
            <div
              class="row"
              [class.strong]="c.value != null && $index < 3"
              [class.missing]="c.value == null"
              [attr.title]="c.description"
            >
              <span class="dot" [style.background]="barColor($index)"></span>
              <span class="name">
                {{ c.label }}
                <span class="tag">{{ c.tag }}</span>
              </span>
              <span class="mini-bar" aria-hidden="true">
                <span class="mini-fill" [style.width.%]="c.value ?? 0" [style.background]="barColor($index)"></span>
              </span>
              <span class="value num">{{ fmt(c.value) }}</span>
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
      margin: 4px 0 16px;
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
    .note {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 12px;
      color: var(--text-secondary);
      font-size: 0.8rem;
    }
    .note.warn {
      color: var(--btc-orange);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) minmax(90px, 220px) 40px auto;
      gap: 12px;
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
    .row.missing {
      opacity: 0.55;
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
      min-width: 0;
    }
    .name > :first-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      display: block;
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
        grid-template-columns: auto minmax(0, 1fr) 40px;
      }
      .mini-bar,
      .weight {
        display: none;
      }
    }
  `,
})
export class ComponentsCardComponent {
  readonly report = input.required<ScoreSnapshot>();
  readonly config = input.required<ApiConfig>();

  readonly all = computed<ComponentView[]>(() =>
    buildComponents(this.config().components, this.report().components),
  );

  readonly components = computed<ComponentView[]>(() => orderComponents(this.all()));

  readonly top = computed<ComponentView[]>(() => topComponents(this.all(), 3));

  readonly missing = computed(() => this.all().filter((c) => c.value == null).length);

  fmt(value: number | null): string {
    return value == null ? '—' : String(Math.round(value));
  }

  barColor(index: number): string {
    return index === 0 ? '#22c55e' : index === 1 ? '#4ade80' : index === 2 ? '#86efac' : '#334155';
  }

  icon(index: number): string {
    return index === 0 ? 'military_tech' : index === 1 ? 'trending_up' : 'local_fire_department';
  }
}
