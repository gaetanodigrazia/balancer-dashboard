import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScorteService {
  private baseUrl = ''; // Inserisci qui l'URL base del backend, es. 'http://localhost:8000'

  constructor(private http: HttpClient) {}

  getScorteAttuali(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/prodotti`);
  }

  aggiungiProdotto(prodotto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/prodotti`, prodotto);
  }

  rimuoviProdotto(id: number): Observable<any> {
    // Meglio rimuovere tramite ID, sicuro e semplice
    return this.http.delete<any>(`${this.baseUrl}/prodotti/${id}`);
  }

aggiornaScorte(ingredienti: any[]): Observable<any> {
  return this.http.put('/prodotti/scorte', ingredienti);
}
aggiornaProdotto(id: number, dati: { quantita: number; quantita_grammi: number }): Observable<any> {
  return this.http.put(`${this.baseUrl}/prodotti/${id}`, dati);
}


}
