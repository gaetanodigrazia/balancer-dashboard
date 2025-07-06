import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DettagliPasto } from './schema-nutrizionale.service';
import { API_BASE_URL } from '../api.config';
import { SchemaBrief } from './schema-nutrizionale.service';
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

export interface DettagliPastoDTO {
  nome: string;
  opzioni: Opzione[];
  completato?: boolean;
}

export interface SchemaCompletoDTO {
  schema: SchemaBrief;
  dettagli: DettagliPastoDTO | null;
}


@Injectable({
  providedIn: 'root'
})
export class DettagliPastoService {

  private baseUrl = `${API_BASE_URL}/schemi-nutrizionali/dettagli`;


  constructor(private http: HttpClient) { }

  /**
   * Ottieni i dettagli dei pasti per uno schema
   * @param schemaId UUID dello schema
   */
  getSchemaCompletoById(schemaId: string): Observable<SchemaCompletoDTO> {
    return this.http.get<SchemaCompletoDTO>(`${this.baseUrl}/${schemaId}/completo`);
  }


  /**
   * Salva o aggiorna un singolo pasto in uno schema
   * @param payload Payload di SalvaSingoloPastoRequest
   */
  salvaSingoloPasto(payload: {
    tipoSchema: string;
    tipoPasto: string;
    dettagli: DettagliPasto;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/dinamico/pasto`, payload);
  }

  /**
   * Marca o smarca un pasto come completato
   * @param schemaId UUID dello schema
   * @param nomePasto Nome del pasto
   * @param completato true | false
   */
  toggleCompletatoPasto(schemaId: string, nomePasto: string, completato: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/${encodeURIComponent(nomePasto)}/toggle-completato`,
      null,
      { params: { completato, schemaId } }
    );
  }
}
