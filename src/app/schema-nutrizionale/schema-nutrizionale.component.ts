import { Component, OnInit } from '@angular/core';
import { SchemaNutrizionaleService, Alimento, Opzione } from '../services/schema-nutrizionale.service';

interface SchemaBrief {
  id: number;
  nome: string;
}

@Component({
  selector: 'app-schema-nutrizionale',
  templateUrl: './schema-nutrizionale.component.html',
  styleUrls: ['./schema-nutrizionale.component.css']
})
export class SchemaNutrizionaleComponent implements OnInit {
  nome = '';
  tipoSchemaSelezionato: number | null = null;  // Ora è ID, non stringa
  tipoPastoSelezionato: string | null = null;

  schemiDisponibili: SchemaBrief[] = [];

  tipiPasto: string[] = [
    'colazione',
    'spuntino_1',
    'pranzo',
    'spuntino_2',
    'pre_intra_post_workout',
    'cena'
  ];

  calorie: number | null = null;
  carboidrati: number | null = null;
  grassi: number | null = null;
  proteine: number | null = null;
  acqua: number | null = null;

  opzioniDinamiche: Opzione[] = [];

  loadingDatiGenerali = false;
  messageDatiGenerali: string | null = null;
  errorDatiGenerali: string | null = null;

  loadingSchemaCompleto = false;
  messageSchemaCompleto: string | null = null;
  errorSchemaCompleto: string | null = null;

  constructor(private schemaService: SchemaNutrizionaleService) {}

  ngOnInit() {
    this.caricaSchemi();
  }

  caricaSchemi() {
    this.schemaService.getSchemiDisponibili().subscribe({
      next: (data) => this.schemiDisponibili = data,
      error: () => this.schemiDisponibili = []
    });
  }

  nuovoAlimento(): Alimento {
    return { nome: '', macronutriente: '', grammi: null };
  }

  aggiungiOpzioneDinamica() {
    this.opzioniDinamiche.push([this.nuovoAlimento()]);
  }

  rimuoviOpzioneDinamica(index: number) {
    this.opzioniDinamiche.splice(index, 1);
  }

  aggiungiAlimentoDinamico(opzioneIndex: number) {
    this.opzioniDinamiche[opzioneIndex].push(this.nuovoAlimento());
  }

  rimuoviAlimentoDinamico(opzioneIndex: number, alimentoIndex: number) {
    this.opzioniDinamiche[opzioneIndex].splice(alimentoIndex, 1);
  }

  macronutrienteChanged(opzioneIndex: number, alimentoIndex: number) {
    const alimento = this.opzioniDinamiche[opzioneIndex][alimentoIndex];
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

  aggiungiSubAlimento(opzioneIndex: number, alimentoIndex: number) {
    const alimento = this.opzioniDinamiche[opzioneIndex][alimentoIndex];
    if (!alimento.gruppoAlimenti) {
      alimento.gruppoAlimenti = [];
    }
    alimento.gruppoAlimenti.push(this.nuovoAlimento());
  }

  rimuoviSubAlimento(opzioneIndex: number, alimentoIndex: number, subAlimentoIndex: number) {
    const alimento = this.opzioniDinamiche[opzioneIndex][alimentoIndex];
    if (!alimento.gruppoAlimenti) return;
    alimento.gruppoAlimenti.splice(subAlimentoIndex, 1);
    if (alimento.gruppoAlimenti.length === 0) {
      alimento.macronutriente = '';
    }
  }

  inviaDatiGenerali() {
    this.loadingDatiGenerali = true;
    this.messageDatiGenerali = null;
    this.errorDatiGenerali = null;

    if (
      !this.nome.trim() ||
      this.calorie === null ||
      this.carboidrati === null ||
      this.grassi === null ||
      this.proteine === null ||
      this.acqua === null
    ) {
      this.errorDatiGenerali = 'Compila tutti i campi generali.';
      this.loadingDatiGenerali = false;
      return;
    }

    const payload = {
      nome: this.nome.trim(),
      calorie: this.calorie,
      carboidrati: this.carboidrati,
      grassi: this.grassi,
      proteine: this.proteine,
      acqua: this.acqua,
    };

    this.schemaService.salvaDatiGenerali(payload).subscribe({
      next: () => {
        this.loadingDatiGenerali = false;
        this.messageDatiGenerali = 'Dati generali salvati con successo!';
      },
      error: (err) => {
        this.loadingDatiGenerali = false;
        this.errorDatiGenerali = err.error?.detail || 'Errore nel salvataggio dati generali.';
      }
    });
  }

  inviaSchemaCompleto() {
    this.loadingSchemaCompleto = true;
    this.messageSchemaCompleto = null;
    this.errorSchemaCompleto = null;

    if (
      !this.nome.trim() ||
      this.calorie === null ||
      this.carboidrati === null ||
      this.grassi === null ||
      this.proteine === null ||
      this.acqua === null
    ) {
      this.errorSchemaCompleto = 'Compila tutti i campi generali.';
      this.loadingSchemaCompleto = false;
      return;
    }

    if (!this.tipoSchemaSelezionato) {
      this.errorSchemaCompleto = 'Seleziona il tipo di schema.';
      this.loadingSchemaCompleto = false;
      return;
    }

    if (!this.tipoPastoSelezionato) {
      this.errorSchemaCompleto = 'Seleziona il tipo di pasto.';
      this.loadingSchemaCompleto = false;
      return;
    }

    if (this.opzioniDinamiche.length === 0) {
      this.errorSchemaCompleto = 'Aggiungi almeno una opzione.';
      this.loadingSchemaCompleto = false;
      return;
    }

    for (const opzione of this.opzioniDinamiche) {
      if (opzione.length === 0) {
        this.errorSchemaCompleto = 'Ogni opzione deve avere almeno un alimento.';
        this.loadingSchemaCompleto = false;
        return;
      }
      for (const alimento of opzione) {
        if (alimento.macronutriente === 'gruppo') {
          if (!alimento.gruppoAlimenti || alimento.gruppoAlimenti.length === 0) {
            this.errorSchemaCompleto = 'Almeno un alimento deve essere presente nel gruppo.';
            this.loadingSchemaCompleto = false;
            return;
          }
          for (const subAlimento of alimento.gruppoAlimenti) {
            if (
              !subAlimento.nome.trim() ||
              subAlimento.macronutriente === '' ||
              subAlimento.grammi === null ||
              subAlimento.grammi < 0
            ) {
              this.errorSchemaCompleto = 'Compila tutti i dati degli alimenti nei gruppi correttamente.';
              this.loadingSchemaCompleto = false;
              return;
            }
          }
        } else {
          if (
            !alimento.nome.trim() ||
            alimento.macronutriente === '' ||
            alimento.grammi === null ||
            alimento.grammi < 0
          ) {
            this.errorSchemaCompleto = 'Compila tutti i dati degli alimenti correttamente.';
            this.loadingSchemaCompleto = false;
            return;
          }
        }
      }
    }

    const payload = {
      nome: this.nome.trim(),
      tipoSchema: this.tipoSchemaSelezionato, // ora ID numerico
      tipoPasto: this.tipoPastoSelezionato,
      dettagli: this.opzioniDinamiche
    };

    this.schemaService.salvaOpzioniPasti(payload).subscribe({
      next: () => {
        this.loadingSchemaCompleto = false;
        this.messageSchemaCompleto = 'Schema completo salvato con successo!';
        this.resetForm();
      },
      error: (err) => {
        this.loadingSchemaCompleto = false;
        this.errorSchemaCompleto = err.error?.detail || 'Errore nel salvataggio completo.';
      }
    });
  }

  resetForm() {
    this.nome = '';
    this.tipoSchemaSelezionato = null;
    this.tipoPastoSelezionato = null;
    this.opzioniDinamiche = [];
    this.calorie = null;
    this.carboidrati = null;
    this.grassi = null;
    this.proteine = null;
    this.acqua = null;

    this.loadingDatiGenerali = false;
    this.messageDatiGenerali = null;
    this.errorDatiGenerali = null;
    this.loadingSchemaCompleto = false;
    this.messageSchemaCompleto = null;
    this.errorSchemaCompleto = null;
  }
}
