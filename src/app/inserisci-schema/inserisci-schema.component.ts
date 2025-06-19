import { Component } from '@angular/core';
import { SchemaNutrizionaleService } from '../services/schema-nutrizionale.service';

@Component({
  selector: 'app-inserisci-schema',
  templateUrl: './inserisci-schema.component.html',
  styleUrls: ['./inserisci-schema.component.css']
})
export class InserisciSchemaComponent {
  nome: string = '';
  calorie: number | null = null;
  carboidrati: number | null = null;
  grassi: number | null = null;
  proteine: number | null = null;
  acqua: number | null = null;

  loading = false;
  message: string | null = null;
  error: string | null = null;

  constructor(private schemaService: SchemaNutrizionaleService) {}

  inviaDatiGenerali() {
    this.message = null;
    this.error = null;

    if (!this.nome.trim() || this.calorie === null || this.carboidrati === null ||
        this.grassi === null || this.proteine === null || this.acqua === null) {
      this.error = 'Compila tutti i campi.';
      return;
    }

    this.loading = true;

    const payload = {
      nome: this.nome.trim(),
      calorie: this.calorie,
      carboidrati: this.carboidrati,
      grassi: this.grassi,
      proteine: this.proteine,
      acqua: this.acqua
    };

    this.schemaService.salvaDatiGenerali(payload).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Schema salvato con successo!';
        this.resetForm();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Errore nel salvataggio.';
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
  }
}
