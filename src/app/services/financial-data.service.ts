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

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://127.0.0.1:8000',
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** POST /api/refresh runs the full pipeline and can take 7-15s. */
const REFRESH_TIMEOUT_MS = 45_000;

type QueryValue = string | number | undefined;

@Injectable({ providedIn: 'root' })
export class FinancialDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getIndex(): Observable<ApiIndex> {
    return this.get<ApiIndex>('/');
  }

  getDashboard(days = 90): Observable<DashboardResponse> {
    return this.get<DashboardResponse>('/api/dashboard', { days });
  }

  getConfig(): Observable<ApiConfig> {
    return this.get<ApiConfig>('/api/config');
  }

  refresh(): Observable<ScoreSnapshot> {
    return this.http
      .post<ScoreSnapshot>(`${this.baseUrl}/api/refresh`, null)
      .pipe(timeout(REFRESH_TIMEOUT_MS), catchError((err) => throwError(() => toApiError(err))));
  }

  getScoreHistory(query: TableQuery = {}): Observable<TableResponse<'scores'>> {
    return this.getTable('scores', query);
  }

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
 * `detail` is a string in 503/500, but FastAPI query validation (422)
 * returns an array of Pydantic items ({loc, msg, type}). We only keep
 * the readable `msg` values from the array.
 */
function toDetailMessage(detail: ApiErrorBody['detail'] | null | undefined): string | undefined {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((item) => item?.msg).filter((msg): msg is string => !!msg);
    if (msgs.length) return msgs.join(' · ');
  }
  return undefined;
}
