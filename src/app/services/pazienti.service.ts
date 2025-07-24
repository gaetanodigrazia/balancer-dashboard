import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../api.config';

export interface Paziente {
  id: string,
  nome: string,
  cognome: string, 
  email: string,
  confermato: boolean,
  pazienteId: string
}
@Injectable({ providedIn: 'root' })
export class PazientiService {
  
  private baseUrl = `${API_BASE_URL}/pazienti`;

  constructor(private http: HttpClient) {}

  getPazientiAssociati() {
    return this.http.get<Paziente[]>(`${this.baseUrl}/associati`);
  }

  rimuoviAssociazione(pazienteId: string) {
    return this.http.delete(`${this.baseUrl}/${pazienteId}`);
  }
  getRichiesteDaConfermare() {
  return this.http.get<Paziente[]>(`${this.baseUrl}/richieste-pending`);
}

confermaAssociazione(associazioneId: string) {
  return this.http.patch<any>(`${this.baseUrl}/conferma/${associazioneId}`, {});
}

}
