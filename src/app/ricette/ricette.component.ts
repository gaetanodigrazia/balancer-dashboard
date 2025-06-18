import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ScorteService } from '../services/scorte.service';

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

  constructor(private http: HttpClient, private scorteService: ScorteService) {}

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
      tipo_schema: this.tipoSchema,
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

  cucina() {
    if (!this.ricetta || !this.ricetta.ingredienti || this.ricetta.ingredienti.length === 0) {
      alert('Nessuna ricetta valida per aggiornare le scorte.');
      return;
    }

    this.loading = true;
    this.error = null;

    // Prepara payload con gli ingredienti da rimuovere
    const ingredientiDaRimuovere = this.ricetta.ingredienti.map(ingr => ({
      nome: ingr.nome,
      quantita: ingr.quantita
    }));

    this.scorteService.aggiornaScorte(ingredientiDaRimuovere).subscribe({
      next: () => {
        alert('Scorte aggiornate correttamente.');
        this.loading = false;
        this.ricetta = null; // Resetta la ricetta visualizzata
        // Se vuoi aggiornare le scorte nella UI, chiama qui il metodo adatto
        // Esempio: this.caricaScorte() se definito
      },
      error: (err) => {
        this.error = 'Errore durante l\'aggiornamento delle scorte: ' + (err.message || err);
        this.loading = false;
      }
    });
  }
}
