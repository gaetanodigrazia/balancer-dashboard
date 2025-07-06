import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../api.config';
import { AuthService } from '../auth/auth.service';

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
      completato?: boolean; // <-- aggiungi qui

}

export interface DettagliPasto {
  nome: string; 
  opzioni: Opzione[];
  completato?: boolean; 
}

export interface SchemaBrief {
  id: string;
  nome: string;
  calorie?: number;
  carboidrati?: number;
  grassi?: number;
  proteine?: number;
  acqua?: number;
  dettagli?: string;
  is_global?: boolean;
  is_modello?: boolean;
  is_demo?: boolean; 
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SchemaNutrizionaleService {

  private baseUrl = `${API_BASE_URL}/schemi-nutrizionali`;
      private another = `http://localhost:8080/schemi-nutrizionali`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  schemiDisponibili: SchemaBrief[] = [];

  getSchemiPerUtente(): Observable<SchemaBrief[]> {
    return this.http.get<SchemaBrief[]>(this.baseUrl);
  }


  getSchemiDisponibili(): Observable<SchemaBrief[]> {

    return this.http.get<SchemaBrief[]>(this.another);
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
    tipoSchema: string;
    dettagli: { [tipoPasto: string]: DettagliPasto };
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/dinamico/completo`, payload);
  }

  eliminaSchema(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }


getSchemaById(id: string): Observable<SchemaBrief> {
  return this.http.get<SchemaBrief>(`${this.baseUrl}/${id}`);
}


  rimuoviOpzione(schemaId: string, tipoPasto: string, opzioneId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${schemaId}/opzione/${tipoPasto}/${opzioneId}/`);
  }

  clonaSchema(id: string): Observable<{ message: string; id: number }> {
    return this.http.post<{ message: string; id: number }>(
      `${this.baseUrl}/clona/${id}`, {}
    );
  }

  getModelli(): Observable<SchemaBrief[]> {
    return this.http.get<SchemaBrief[]>(`${this.baseUrl}/schema/modelli`).pipe(
      tap((res) => console.log('✅ Modelli caricati:', res))
    );
  }

  getSchemiGlobali() {
  return this.http.get<SchemaBrief[]>(`${this.baseUrl}/schema/globali`).pipe(
    tap(res => console.log('🔍 Risposta cruda schemi globali:', res)));
}

getSchemaMetadataById(id: string): Observable<SchemaBrief> {
    return this.http.get<SchemaBrief>(`${this.baseUrl}/${id}`);
}


getUltimiSchemi(limit = 5) {
  return this.http.get<SchemaBrief[]>(`${this.baseUrl}/ultimi?limit=${limit}`);
}
getProgressUtente(): Observable<{
  totaleSchemi: number,
  schemiCompleti: number,
  percentuale: number
}> {
  return this.http.get<{
    totaleSchemi: number,
    schemiCompleti: number,
    percentuale: number
  }>(`${this.baseUrl}/progress`);
}
toggleCompletatoPasto(schemaId: string, nomePasto: string, completato: boolean): Observable<void> {
  return this.http.patch<void>(
    `${this.baseUrl}/dinamico/pasto/${encodeURIComponent(nomePasto)}/toggle-completato`,
    null,
    { params: { completato, schemaId } }
  );
}



}
