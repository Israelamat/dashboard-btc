import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface Point {
  x: number;
  y: number;
}

const START_ANGLE = 135;
const SWEEP = 270;

function polar(cx: number, cy: number, r: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const diff = endDeg - startDeg;
  const largeArc = Math.abs(diff) > 180 ? 1 : 0;
  const sweep = diff > 0 ? 1 : 0;
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

@Component({
  selector: 'app-score-gauge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gauge-wrap">
      <svg [attr.viewBox]="viewBox()" class="gauge" role="img" [attr.aria-label]="'Score total ' + score() + ' de 100'">
        <path
          [attr.d]="trackPath()"
          class="track"
          pathLength="100"
          fill="none"
          stroke-linecap="round"
        />
        <path
          [attr.d]="trackPath()"
          class="value"
          pathLength="100"
          stroke-linecap="round"
          [style.stroke]="color()"
          [attr.stroke-dasharray]="100"
          [attr.stroke-dashoffset]="100 - score()"
          style="transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)"
        />
      </svg>
      <div class="center">
        <span class="score num" [style.color]="color()">{{ displayScore() }}</span>
        <span class="max">/ 100</span>
        <span class="caption">Score de acumulación</span>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      max-width: 300px;
      margin-inline: auto;
    }
    .gauge-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
    }
    .gauge {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .track {
      stroke: rgba(148, 163, 184, 0.18);
      stroke-width: 11;
    }
    .value {
      stroke-width: 11;
      filter: drop-shadow(0 0 6px currentColor);
    }
    .center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .score {
      font-size: clamp(2.6rem, 9vw, 3.4rem);
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .max {
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin-top: 2px;
    }
    .caption {
      margin-top: 10px;
      color: var(--text-secondary);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
  `,
})
export class ScoreGaugeComponent {
  readonly score = input.required<number>();
  readonly color = input<string>('var(--zone-neutral)');

  readonly displayScore = computed(() =>
    new Intl.NumberFormat('en-US', { minimumIntegerDigits: 2 }).format(
      Math.round(this.score()),
    ),
  );

  readonly viewBox = computed(() => {
    const r = 100;
    const pad = 22;
    return `${-pad} ${-pad} ${2 * r + 2 * pad} ${2 * r + 2 * pad}`;
  });

  readonly trackPath = computed(() =>
    arcPath(100, 100, 100, START_ANGLE, START_ANGLE + SWEEP),
  );
}