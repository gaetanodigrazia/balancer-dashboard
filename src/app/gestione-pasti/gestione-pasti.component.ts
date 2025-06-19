import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SchemaNutrizionaleService, Alimento, Opzione, SchemaBrief, DettagliPasto } from '../services/schema-nutrizionale.service';

@Component({
  selector: 'app-gestione-pasti',
  templateUrl: './gestione-pasti.component.html',
  styleUrls: ['./gestione-pasti.component.css']
})
export class GestionePastiComponent implements OnChanges {
  @Input() schemaId!: number;

  schema!: SchemaBrief;
  dettagliPasti: { [tipoPasto: string]: DettagliPasto } = {};

  tipiPasto: string[] = [
    'colazione',
    'spuntino_1',
    'pranzo',
    'spuntino_2',
    'pre_intra_post_workout',
    'cena'
  ];

  loading = false;
  message: string | null = null;
  error: string | null = null;
  opzioneDaEliminare: { tipoPasto: string; opzioneId: string } | null = null;

  constructor(private schemaService: SchemaNutrizionaleService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schemaId']) {
      console.log('📦 schemaId ricevuto in GestionePastiComponent:', this.schemaId);

      if (this.schemaId) {
        this.caricaSchema();
      } else {
        console.warn('⚠️ schemaId non definito, impossibile caricare lo schema.');
      }
    }
  }

  private caricaSchema() {
    this.loading = true;
    this.schemaService.getSchemaById(this.schemaId).subscribe({
      next: (data) => {
              console.log('📄 Schema ricevuto dal backend:', data); // 👈 Log importante

        this.schema = data;
        this.dettagliPasti = {};

        this.tipiPasto.forEach(tp => {
          const pasto = this.schema.dettagli?.[tp];
          if (pasto && pasto.opzioni?.length > 0) {
            pasto.opzioni.forEach(op => op.salvata = true);
            this.dettagliPasti[tp] = pasto;
          } else {
            this.dettagliPasti[tp] = { opzioni: [] };
          }
        });

        console.log('✅ Schema caricato:', this.schema);
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore durante il caricamento dello schema:', err);
        this.loading = false;
        this.error = err.error?.detail || 'Errore nel caricamento dello schema.';
      }
    });
  }

  nuovoAlimento(): Alimento {
    return { nome: '', macronutriente: '', grammi: null };
  }

  aggiungiOpzione(tipoPasto: string) {
    const nuovaOpzione: Opzione = {
      id: crypto.randomUUID(),
      alimenti: [this.nuovoAlimento()],
      salvata: false
    };
    this.dettagliPasti[tipoPasto].opzioni.push(nuovaOpzione);
  }

  rimuoviOpzione(tipoPasto: string, index: number) {
    this.dettagliPasti[tipoPasto].opzioni.splice(index, 1);
  }

  confirmModal(tipoPasto: string, opzioneId: string) {
    this.opzioneDaEliminare = { tipoPasto, opzioneId };
    const modal = new (window as any).bootstrap.Modal(document.getElementById('confermaEliminazioneModal'));
    modal.show();
  }

  confermaEliminazione() {
    if (!this.opzioneDaEliminare) return;

    const { tipoPasto, opzioneId } = this.opzioneDaEliminare;

    this.loading = true;
    this.error = null;
    this.message = null;

    this.schemaService.rimuoviOpzione(this.schema.id, tipoPasto, opzioneId).subscribe({
      next: () => {
        this.dettagliPasti[tipoPasto].opzioni = this.dettagliPasti[tipoPasto].opzioni.filter(op => op.id !== opzioneId);
        this.loading = false;
        this.message = 'Opzione eliminata con successo.';

        const modalEl = document.getElementById('confermaEliminazioneModal');
        if (modalEl) {
          const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
          modal?.hide();
        }

        this.opzioneDaEliminare = null;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Errore durante l\'eliminazione dell\'opzione.';
      }
    });
  }

  aggiungiAlimento(tipoPasto: string, opzioneIndex: number) {
    this.dettagliPasti[tipoPasto].opzioni[opzioneIndex].alimenti.push(this.nuovoAlimento());
  }

  rimuoviAlimento(tipoPasto: string, opzioneIndex: number, alimentoIndex: number) {
    this.dettagliPasti[tipoPasto].opzioni[opzioneIndex].alimenti.splice(alimentoIndex, 1);
  }

  macronutrienteChanged(tipoPasto: string, opzioneIndex: number, alimentoIndex: number) {
    const alimento = this.dettagliPasti[tipoPasto].opzioni[opzioneIndex].alimenti[alimentoIndex];
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
    const alimento = this.dettagliPasti[tipoPasto].opzioni[opzioneIndex].alimenti[alimentoIndex];
    alimento.gruppoAlimenti = alimento.gruppoAlimenti || [];
    alimento.gruppoAlimenti.push(this.nuovoAlimento());
  }

  rimuoviSubAlimento(tipoPasto: string, opzioneIndex: number, alimentoIndex: number, subIndex: number) {
    const alimento = this.dettagliPasti[tipoPasto].opzioni[opzioneIndex].alimenti[alimentoIndex];
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

  salvaSingoloPasto(tipoPasto: string) {
    if (!this.schema) return;

    const opzioneIndex = this.dettagliPasti[tipoPasto].opzioni.findIndex(o => !o.salvata);
    if (opzioneIndex === -1) {
      this.error = 'Nessuna opzione da salvare.';
      return;
    }

    const opzione = this.dettagliPasti[tipoPasto].opzioni[opzioneIndex];
    const alimentiValidi = opzione.alimenti.filter(
      a => a.nome?.trim() && a.macronutriente && (a.macronutriente === 'gruppo' || a.grammi)
    );

    if (alimentiValidi.length === 0) {
      this.error = 'Alimenti non validi.';
      return;
    }

    this.loading = true;
    this.message = null;
    this.error = null;

    const payload = {
      nome: this.schema.nome,
      tipoSchema: this.schema.id,
      tipoPasto: tipoPasto,
      dettagli: {
        opzioni: [{ ...opzione, alimenti: alimentiValidi }]
      }
    };

    this.schemaService.salvaDettagliSingoloPasto(payload).subscribe({
      next: () => {
        this.dettagliPasti[tipoPasto].opzioni[opzioneIndex].salvata = true;
        this.loading = false;
        this.message = `Opzione per '${this.formatTipoPasto(tipoPasto)}' salvata con successo!`;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || `Errore nel salvataggio dell'opzione.`;
      }
    });
  }

  formatTipoPasto(tipo: string): string {
    return tipo.replace(/_/g, ' ');
  }
}
