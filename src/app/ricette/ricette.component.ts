import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Ingrediente {
  nome: string;
  quantita: string;
}

interface Ricetta {
  titolo: string;
  ingredienti: Ingrediente[];
  procedimento: string;
}

@Component({
  selector: 'app-ricette',
  templateUrl: './ricette.component.html'
})
export class RicetteComponent {
  tipoPasto: string = 'colazione';
  tipoSchema: string = 'on';  // Nuovo campo per tipo schema

  ricetta: Ricetta | null = null;
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  generaRicetta() {
    if (!this.tipoPasto || !this.tipoSchema) {
      this.error = 'Seleziona tipo di pasto e tipo di schema.';
      return;
    }

    this.error = null;
    this.loading = true;
    this.ricetta = null;

    const payload = {
      tipo_pasto: this.tipoPasto,
      tipo_schema: this.tipoSchema,  // Includi tipo schema nel payload
    };

    this.http.post<Ricetta>('/ricette', payload).subscribe({
      next: (data) => {
        this.ricetta = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Errore durante la generazione della ricetta.';
        this.loading = false;
      }
    });
  }
}
