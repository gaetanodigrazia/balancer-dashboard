import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../api.config';

export interface Alimento {
  nome: string;
  macronutriente: 'carboidrati' | 'grassi' | 'proteine' | 'gruppo' | '';
  grammi: number | null;
  gruppoAlimenti?: Alimento[];
}

export interface Opzione {
  id?: string;
  alimenti: Alimento[];
  salvata?: boolean;
  nome?: string;
  inModifica?: boolean;
}

export interface DettagliPasto {
  opzioni: Opzione[];
}

export interface SchemaBrief {
  id: number;
  nome: string;
  calorie?: number;
  carboidrati?: number;
  grassi?: number;
  proteine?: number;
  acqua?: number;
  dettagli?: { [pasto: string]: DettagliPasto };
}

@Injectable({
  providedIn: 'root',
})
export class SchemaNutrizionaleService {
  
  private baseUrl = `${API_BASE_URL}/schemi-nutrizionali`;

  constructor(private http: HttpClient) {}

  schemiDisponibili: SchemaBrief[] = [];

  getSchemiDisponibili(): Observable<SchemaBrief[]> {
    return this.http.get<SchemaBrief[]>(this.baseUrl);
  }

  salvaDatiGenerali(payload: {
    id?: number;
    nome: string;
    calorie: number;
    carboidrati: number;
    grassi: number;
    proteine: number;
    acqua: number;
    is_modello?: boolean;
    clona_da?: number;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/dati-generali`, payload);
  }

  salvaOpzioniPasti(payload: {
    nome: string;
    tipoSchema: number;
    dettagli: { [tipoPasto: string]: DettagliPasto };
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/dinamico/completo`, payload);
  }

  eliminaSchema(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  salvaDettagliSingoloPasto(payload: {
    nome: string;
    tipoSchema: number;
    tipoPasto: string;
    dettagli: DettagliPasto;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/dinamico/pasto`, payload);
  }

  getSchemaById(id: number): Observable<SchemaBrief> {
    return this.http.get<SchemaBrief>(`${this.baseUrl}/${id}`);
  }

  rimuoviOpzione(schemaId: number, tipoPasto: string, opzioneId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${schemaId}/opzione/${tipoPasto}/${opzioneId}/`);
  }

  clonaSchema(id: number): Observable<{ message: string; id: number }> {
    return this.http.post<{ message: string; id: number }>(
      `${this.baseUrl}/clona/${id}`, {}
    );
  }

  getModelli(): Observable<SchemaBrief[]> {
    return this.http.get<SchemaBrief[]>(`${this.baseUrl}/schema/modelli`).pipe(
      tap((res) => console.log('✅ Modelli caricati:', res))
    );
  }
}
