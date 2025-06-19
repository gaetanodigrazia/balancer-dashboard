import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alimento {
  nome: string;
  macronutriente: 'carboidrati' | 'grassi' | 'proteine' | 'gruppo' | '';
  grammi: number | null;
  gruppoAlimenti?: Alimento[];
}
export interface SchemaBrief {
  id: number;
  nome: string;
}


export type Opzione = Alimento[];

@Injectable({
  providedIn: 'root',
})
export class SchemaNutrizionaleService {
  private baseUrl = '/schemi-nutrizionali';

  constructor(private http: HttpClient) {}
schemiDisponibili: SchemaBrief[] = [];

getSchemiDisponibili(): Observable<SchemaBrief[]> {
  return this.http.get<SchemaBrief[]>(`${this.baseUrl}`);
}


  // Salva dati generali di uno schema
  salvaDatiGenerali(payload: {
    nome: string;
    calorie: number;
    carboidrati: number;
    grassi: number;
    proteine: number;
    acqua: number;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/dati-generali`, payload);
  }

// Cambia il tipo di tipoSchema in numero
salvaOpzioniPasti(payload: {
  nome: string;
  tipoSchema: number;   // qui numero
  tipoPasto: string;
  dettagli: Opzione[];
}): Observable<any> {
  return this.http.post(`${this.baseUrl}/dinamico/completo`, payload);
}
}
