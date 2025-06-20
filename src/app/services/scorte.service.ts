import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

@Injectable({
  providedIn: 'root',
})
export class ScorteService {

  private baseUrl = `${API_BASE_URL}/prodotti`;

  constructor(private http: HttpClient) {}

  getScorteAttuali(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  aggiungiProdotto(prodotto: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, prodotto);
  }

  rimuoviProdotto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  aggiornaScorte(ingredienti: any[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/scorte`, ingredienti);
  }

  aggiornaProdotto(id: number, dati: { quantita: number; quantita_grammi: number }): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, dati);
  }
}
