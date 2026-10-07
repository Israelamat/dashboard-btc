import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError, timeout } from 'rxjs';

import {
  ApiConfig,
  ApiErrorBody,
  ApiIndex,
  DashboardResponse,
  ScoreSnapshot,
  TableQuery,
  TableResponse,
  TableSource,
} from '../api/api.types';

/**
 * Base URL de la API FastAPI. El server arranca con
 * `python -m src.api` y expone http://127.0.0.1:8000 (API_HOST / API_PORT).
 * CORS ya permite los puertos 4200/4300 de Angular, así que no hace falta proxy.
 * Se puede sobreescribir con `provideFactory(API_BASE_URL, () => '...')`.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://127.0.0.1:8000',
});

/** Error de la API: conserva el `detail` del JSON y el código HTTP. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** POST /api/refresh corre el pipeline completo y puede tardar 7-15 s. */
const REFRESH_TIMEOUT_MS = 45_000;

type QueryValue = string | number | undefined;

@Injectable({ providedIn: 'root' })
export class FinancialDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** GET / → índice de rutas (útil para comprobar que la API está viva). */
  getIndex(): Observable<ApiIndex> {
    return this.get<ApiIndex>('/');
  }

  /** GET /api/dashboard?days=90 → los 9 bloques del dashboard. */
  getDashboard(days = 90): Observable<DashboardResponse> {
    return this.get<DashboardResponse>('/api/dashboard', { days });
  }

  /** GET /api/config → pesos, zonas, acciones y componentes. */
  getConfig(): Observable<ApiConfig> {
    return this.get<ApiConfig>('/api/config');
  }

  /**
   * POST /api/refresh → ejecuta el pipeline completo y devuelve el
   * ScoreSnapshot con source: "live". Sin body; puede bloquear ~7-15 s.
   * 503 si el pipeline aborta.
   */
  refresh(): Observable<ScoreSnapshot> {
    return this.http
      .post<ScoreSnapshot>(`${this.baseUrl}/api/refresh`, null)
      .pipe(timeout(REFRESH_TIMEOUT_MS), catchError((err) => throwError(() => toApiError(err))));
  }

  /** GET /api/score/history → misma tabla que las otras 6 fuentes. */
  getScoreHistory(query: TableQuery = {}): Observable<TableResponse<'scores'>> {
    return this.getTable('scores', query);
  }

  /** GET /api/{source} con los parámetros compartidos limit/date/start/end. */
  getTable<S extends TableSource>(source: S, query: TableQuery = {}): Observable<TableResponse<S>> {
    const path = source === 'scores' ? '/api/score/history' : `/api/${source}`;
    return this.get<TableResponse<S>>(path, query);
  }

  private get<T>(path: string, query: Record<string, QueryValue> | TableQuery = {}): Observable<T> {
    const defined = Object.fromEntries(
      Object.entries(query).filter(([, v]) => v !== undefined),
    ) as Record<string, string | number>;
    const params = new HttpParams({ fromObject: defined });
    return this.http
      .get<T>(`${this.baseUrl}${path}`, { params })
      .pipe(catchError((err) => throwError(() => toApiError(err))));
  }
}

/** Normaliza cualquier error (HTTP, timeout, red) a ApiError con `detail`. */
function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof HttpErrorResponse) {
    const detail = toDetailMessage((err.error as ApiErrorBody | null)?.detail);
    if (detail) return new ApiError(detail, err.status);
    if (err.status === 0) {
      return new ApiError(
        'No se pudo conectar con la API local. ¿Está corriendo `python -m src.api`?',
        0,
      );
    }
    return new ApiError(err.message || `Error HTTP ${err.status}`, err.status);
  }

  if (err instanceof Error) {
    const isTimeout = err.name === 'TimeoutError';
    return new ApiError(
      isTimeout
        ? 'La API tardó demasiado en responder (el refresh corre el pipeline completo).'
        : err.message,
      null,
    );
  }

  return new ApiError('Error inesperado llamando a la API.', null);
}

/**
 * `detail` es string en 503/500, pero en 422 de validación de query FastAPI
 * devuelve un array de ítems Pydantic ({loc, msg, type}). En el array sólo
 * extraemos los `msg` legibles.
 */
function toDetailMessage(detail: ApiErrorBody['detail'] | null | undefined): string | undefined {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((item) => item?.msg).filter((msg): msg is string => !!msg);
    if (msgs.length) return msgs.join(' · ');
  }
  return undefined;
}
