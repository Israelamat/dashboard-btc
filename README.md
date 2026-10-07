# dashboard-btc — Dashboard de análisis de acumulación de Bitcoin

Frontend Angular (standalone components + signals) que muestra el "score de
acumulación de BTC" (0-100) calculado a partir de señales de mercado.

> **Estado actual:** conectado a la API local. El dashboard llama a
> `GET /api/dashboard?days=90` en `http://127.0.0.1:8000` (ver
> `src/app/api/api.types.ts` para el contrato tipado) y el botón
> "Actualizar datos" ejecuta `POST /api/refresh`.

## Requisitos

- Node.js 20+ (testeado con 22)
- pnpm (el proyecto usa `pnpm` como package manager)
- API local corriendo: `python -m src.api` → http://127.0.0.1:8000

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
  styles.scss                            # Tema oscuro Material + variables globales
  app/
    api/api.types.ts                     # Contrato tipado de la API (dashboard, tablas, config…)
    models/btc-report.model.ts           # Metadatos de UI: COMPONENT_META, ReportComponent
    core/accumulation-logic.ts           # Reglas puras: zona/acción/ratio + orden de señales
    services/financial-data.service.ts   # HttpClient contra la API (dashboard/refresh/tablas)
    pages/dashboard/                     # Vista principal (loading / error+retry / data)
    components/
      score-gauge/                       # Gauge circular SVG del score total
      buy-panel/                         # "Posible Compra" + monto mensual configurable
      components-card/                   # Chart horizontal + top-3 señales
      metrics-grid/                      # Grilla de métricas secundarias
```

## Conexión con la API

- `FinancialDataService` (en `src/app/services/financial-data.service.ts`) expone
  `getDashboard()`, `refresh()`, `getConfig()`, `getScoreHistory()` y
  `getTable(source, query)` para los 11 endpoints.
- La base URL es un `InjectionToken` (`API_BASE_URL`, defecto
  `http://127.0.0.1:8000`); se puede sobreescribir con
  `provideFactory(API_BASE_URL, () => 'http://otro-host:8000')`.
- CORS ya permite los puertos 4200/4300, así que no hace falta proxy.
- Los errores 422/503/500 se normalizan a `ApiError` con el `detail` del JSON,
  que el dashboard muestra en pantalla.