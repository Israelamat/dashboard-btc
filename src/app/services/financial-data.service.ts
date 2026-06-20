import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

import { BtcReport } from '../models/btc-report.model';

@Injectable({ providedIn: 'root' })
export class FinancialDataService {
  private readonly http = inject(HttpClient);

  // Endpoint real de la futura API REST (backend aún no implementado).
  // private readonly apiUrl = '/api/financial-data';

  private readonly mockUrl = 'assets/mock-data.json';

  private readonly mockNetworkDelayMs = 300;

  getFinancialData(): Observable<BtcReport> {
    // TODO: cuando exista el backend, reemplazar por la llamada HTTP real:
    //   return this.http.get<BtcReport>(this.apiUrl);
    // Por ahora se sirve el JSON estático de src/assets/mock-data.json
    // simulando latencia de red para poder probar el estado "loading".
    return this.http.get<BtcReport>(this.mockUrl).pipe(delay(this.mockNetworkDelayMs));
  }
}