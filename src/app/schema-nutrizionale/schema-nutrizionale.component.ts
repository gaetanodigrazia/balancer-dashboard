import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Alimento {
  nome: string;
  grammi: number | null;
}

type Opzione = Alimento[];

interface Dettagli {
  colazione: Opzione[];
  spuntino_1: Opzione[];
  pranzo: Opzione[];
  spuntino_2: Opzione[];
  pre_intra_post_workout: Opzione[];
  cena: Opzione[];
}

@Component({
  selector: 'app-schema-nutrizionale',
  templateUrl: './schema-nutrizionale.component.html',
  styleUrls: ['./schema-nutrizionale.component.css']
})
export class SchemaNutrizionaleComponent {
  nome = '';
  calorie: number | null = null;
  carboidrati: number | null = null;
  grassi: number | null = null;
  proteine: number | null = null;
  acqua: number | null = null;

  dettagli: Dettagli = {
    colazione: [ [this.nuovoAlimento()] ],
    spuntino_1: [ [this.nuovoAlimento()] ],
    pranzo: [ [this.nuovoAlimento()] ],
    spuntino_2: [ [this.nuovoAlimento()] ],
    pre_intra_post_workout: [ [this.nuovoAlimento()] ],
    cena: [ [this.nuovoAlimento()] ],
  };

  loading = false;
  message: string | null = null;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  nuovoAlimento(): Alimento {
    return { nome: '', grammi: null };
  }

  // Aggiungi opzione nuova per un pasto
  aggiungiOpzione(pasto: keyof Dettagli) {
    this.dettagli[pasto].push([this.nuovoAlimento()]);
  }

  // Rimuovi opzione intera da un pasto
  rimuoviOpzione(pasto: keyof Dettagli, index: number) {
    this.dettagli[pasto].splice(index, 1);
  }

  // Aggiungi alimento a un'opzione
  aggiungiAlimento(pasto: keyof Dettagli, opzioneIndex: number) {
    this.dettagli[pasto][opzioneIndex].push(this.nuovoAlimento());
  }

  // Rimuovi alimento da un'opzione
  rimuoviAlimento(pasto: keyof Dettagli, opzioneIndex: number, alimentoIndex: number) {
    this.dettagli[pasto][opzioneIndex].splice(alimentoIndex, 1);
  }

  inviaSchema() {
    if (!this.nome.trim() || this.calorie === null || this.carboidrati === null || this.grassi === null || this.proteine === null || this.acqua === null) {
      this.error = "Compila tutti i campi generali.";
      this.message = null;
      return;
    }

    // Validazione base: almeno un alimento per ogni opzione
    for (const pasto of Object.keys(this.dettagli) as (keyof Dettagli)[]) {
      for (const opzione of this.dettagli[pasto]) {
        if (opzione.length === 0) {
          this.error = `Almeno un alimento richiesto in ogni opzione di ${pasto}`;
          this.message = null;
          return;
        }
        for (const alimento of opzione) {
          if (!alimento.nome.trim() || alimento.grammi === null || alimento.grammi < 0) {
            this.error = `Compila nome e grammi validi per tutti gli alimenti (pasto: ${pasto})`;
            this.message = null;
            return;
          }
        }
      }
    }

    this.loading = true;
    this.error = null;
    this.message = null;

    const payload = {
      nome: this.nome.trim(),
      calorie: this.calorie,
      carboidrati: this.carboidrati,
      grassi: this.grassi,
      proteine: this.proteine,
      acqua: this.acqua,
      dettagli: this.dettagli
    };

    this.http.post('/schemi-nutrizionali', payload).subscribe({
      next: () => {
        this.loading = false;
        this.message = "Schema nutrizionale salvato con successo!";
        this.resetForm();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || "Errore nel salvataggio.";
      }
    });
  }

  resetForm() {
    this.nome = '';
    this.calorie = null;
    this.carboidrati = null;
    this.grassi = null;
    this.proteine = null;
    this.acqua = null;

    this.dettagli = {
      colazione: [ [this.nuovoAlimento()] ],
      spuntino_1: [ [this.nuovoAlimento()] ],
      pranzo: [ [this.nuovoAlimento()] ],
      spuntino_2: [ [this.nuovoAlimento()] ],
      pre_intra_post_workout: [ [this.nuovoAlimento()] ],
      cena: [ [this.nuovoAlimento()] ],
    };
  }
}
