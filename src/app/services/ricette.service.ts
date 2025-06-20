import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface Ingrediente {
  nome: string;
  quantita: string;
}

export interface Ricetta {
  titolo: string;
  ingredienti: Ingrediente[];
  procedimento: string;
  presentazione?: string;
  nota_nutrizionale?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RicettaService {
  private baseUrl = `${API_BASE_URL}/ricette`;

  constructor(private http: HttpClient) {}

  generaRicetta(schemaId: number, tipoPasto: string): Observable<Ricetta> {
    return this.http.post<Ricetta>(`${this.baseUrl}/genera/${schemaId}/${tipoPasto}`, {});
  }
}
