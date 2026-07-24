# dashboard-btc — Dashboard de análisis de acumulación de Bitcoin

Frontend Angular (standalone components + signals) que muestra el "score de
acumulación de BTC" (0-100) calculado a partir de señales de mercado.

> **Estado actual:** datos de ejemplo. Se carga el JSON estático desde
> `src/assets/mock-data.json` simulando latencia de red (`delay(300)`).
> Cuando exista el backend basta con cambiar una línea en
> `FinancialDataService` para consumir `GET /api/financial-data`.

## Requisitos

- Node.js 20+ (testeado con 22)
- pnpm (el proyecto usa `pnpm` como package manager)

## Comandos

```bash
pnpm install        # instalar dependencias
pnpm start          # ng serve → http://localhost:4200
pnpm build          # build de producción en dist/
pnpm test           # tests (vitest)
```

## Stack

- Angular 21 (standalone components, signals, control flow `@if/@for`)
- Angular Material 21 (tema oscuro M3)
- Chart.js 4 + ng2-charts 10 (gráfico horizontal de las 7 señales)
- Diseño responsive, mobile-first

## Estructura principal

```
src/
  assets/mock-data.json                  # JSON de ejemplo que consume el frontend
  styles.scss                            # Tema oscuro Material + variables globales
  app/
    models/btc-report.model.ts           # Interfaces tipadas: BtcReport, ReportComponents, ...
    core/accumulation-logic.ts           # Reglas puras: zona/acción/ratio + orden de señales
    services/financial-data.service.ts   # HttpClient; carga mock por ahora (con delay)
    pages/dashboard/                     # Vista principal (loading / error+retry / data)
    components/
      score-gauge/                       # Gauge circular SVG del score total
      buy-panel/                         # "Posible Compra" + monto mensual configurable
      components-card/                   # Chart horizontal + top-3 señales
      metrics-grid/                      # Grilla de métricas secundarias
```

## Cambio al backend real

En `src/app/services/financial-data.service.ts`:

```ts
// Reemplazar estas líneas:
return this.http.get<BtcReport>(this.mockUrl).pipe(delay(this.mockNetworkDelayMs));

// Por:
return this.http.get<BtcReport>(this.apiUrl);
```

(la constante `apiUrl` ya está comentada en el servicio)