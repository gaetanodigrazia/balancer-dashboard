import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScorteService {
  constructor(private http: HttpClient) {}

  getScorteAttuali(): Observable<any[]> {
    return this.http.get<any[]>('/prodotti');
  }

  aggiungiProdotto(prodotto: any): Observable<any> {
    return this.http.post('/prodotti', prodotto);
  }
}
