import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api.config';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  constructor(private http: HttpClient) {}

  /**
   * Richiede dal backend un token firmato (timestamp + firma)
   */
  generaTokenFirmato(): Observable<{ ts: string; sig: string }> {
    return this.http.get<{ ts: string; sig: string }>(`${API_BASE_URL}/token/genera`);
  }

  /**
   * Verifica al backend se timestamp + firma sono validi
   */
  verificaTokenFirmato(ts: string, sig: string): Observable<{ valido: boolean }> {
    return this.http.post<{ valido: boolean }>(`${API_BASE_URL}/token/verifica`, { ts, sig });
  }
}
