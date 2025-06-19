import { Component, Input, OnInit } from '@angular/core';
import { SchemaNutrizionaleService, Alimento, Opzione, SchemaBrief, DettagliPasto } from '../services/schema-nutrizionale.service';

@Component({
  selector: 'app-gestione-pasti',
  templateUrl: './gestione-pasti.component.html',
  styleUrls: ['./gestione-pasti.component.css']
})
export class GestionePastiComponent implements OnInit {
  @Input() schema!: SchemaBrief;

  tipiPasto: string[] = [
    'colazione',
    'spuntino_1',
    'pranzo',
    'spuntino_2',
    'pre_intra_post_workout',
    'cena'
  ];

dettagliPasti: { [tipoPasto: string]: DettagliPasto } = {};

  loading = false;
  message: string | null = null;
  error: string | null = null;

  constructor(private schemaService: SchemaNutrizionaleService) {}

ngOnInit() {
  this.dettagliPasti = this.schema.dettagli || {};
  this.tipiPasto.forEach(tp => {
    if (!this.dettagliPasti[tp]) {
      this.dettagliPasti[tp] = { opzioni: [] };
    }
  });
}


  nuovoAlimento(): Alimento {
    return { nome: '', macronutriente: '', grammi: null };
  }

aggiungiOpzione(tipoPasto: string) {
  if (!this.dettagliPasti[tipoPasto]) {
    this.dettagliPasti[tipoPasto] = { opzioni: [] };
  }
  this.dettagliPasti[tipoPasto].opzioni.push([this.nuovoAlimento()]);
}

rimuoviOpzione(tipoPasto: string, index: number) {
  this.dettagliPasti[tipoPasto].opzioni.splice(index, 1);
}

aggiungiAlimento(tipoPasto: string, opzioneIndex: number) {
  this.dettagliPasti[tipoPasto].opzioni[opzioneIndex].push(this.nuovoAlimento());
}

rimuoviAlimento(tipoPasto: string, opzioneIndex: number, alimentoIndex: number) {
  this.dettagliPasti[tipoPasto].opzioni[opzioneIndex].splice(alimentoIndex, 1);
}

  macronutrienteChanged(tipoPasto: string, opzioneIndex: number, alimentoIndex: number) {
  const alimento = this.dettagliPasti[tipoPasto].opzioni[opzioneIndex][alimentoIndex];
    if (alimento.macronutriente === 'gruppo') {
      if (!alimento.gruppoAlimenti || alimento.gruppoAlimenti.length === 0) {
        alimento.gruppoAlimenti = [this.nuovoAlimento()];
      }
      alimento.nome = '';
      alimento.grammi = null;
    } else {
      alimento.gruppoAlimenti = undefined;
    }
  }

  aggiungiSubAlimento(tipoPasto: string, opzioneIndex: number, alimentoIndex: number) {
    const alimento = this.dettagliPasti[tipoPasto][opzioneIndex][alimentoIndex];
    if (!alimento.gruppoAlimenti) {
      alimento.gruppoAlimenti = [];
    }
    alimento.gruppoAlimenti.push(this.nuovoAlimento());
  }

  rimuoviSubAlimento(tipoPasto: string, opzioneIndex: number, alimentoIndex: number, subIndex: number) {
    const alimento = this.dettagliPasti[tipoPasto][opzioneIndex][alimentoIndex];
    if (!alimento.gruppoAlimenti) return;
    alimento.gruppoAlimenti.splice(subIndex, 1);
    if (alimento.gruppoAlimenti.length === 0) {
      alimento.macronutriente = '';
    }
  }

  salvaDettagli() {
    if (!this.schema) return;

    this.loading = true;
    this.message = null;
    this.error = null;

    const payload = {
      nome: this.schema.nome,
      tipoSchema: this.schema.id,
      dettagli: this.dettagliPasti
    };

    this.schemaService.salvaOpzioniPasti(payload).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Dettagli pasti salvati con successo!';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Errore nel salvataggio dettagli pasti.';
      }
    });
  }

  formatTipoPasto(tipo: string): string {
  return tipo.replace(/_/g, ' ');
}
}
