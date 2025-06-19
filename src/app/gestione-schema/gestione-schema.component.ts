import { Component, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { SchemaNutrizionaleService, SchemaBrief } from '../services/schema-nutrizionale.service';
import { EventEmitter } from '@angular/core';
declare var bootstrap: any;

@Component({
  selector: 'app-gestione-schema',
  templateUrl: './gestione-schema.component.html',
  styleUrls: ['./gestione-schema.component.css']
})
export class GestioneSchemaComponent implements OnChanges {
  @Input() schema: SchemaBrief & {
    calorie: number;
    carboidrati: number;
    grassi: number;
    proteine: number;
    acqua: number;
  } | null = null;
  @Output() schemaEliminato = new EventEmitter<void>();

  nome: string = '';
  calorie: number | null = null;
  carboidrati: number | null = null;
  grassi: number | null = null;
  proteine: number | null = null;
  acqua: number | null = null;

  loading = false;
  message: string | null = null;
  error: string | null = null;

  constructor(
    private schemaService: SchemaNutrizionaleService,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.schema && this.schema) {
      this.nome = this.schema.nome || '';
      this.calorie = this.schema.calorie ?? null;
      this.carboidrati = this.schema.carboidrati ?? null;
      this.grassi = this.schema.grassi ?? null;
      this.proteine = this.schema.proteine ?? null;
      this.acqua = this.schema.acqua ?? null;

      // Reset messaggi quando cambia lo schema
      this.message = null;
      this.error = null;
    }
  }

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
      acqua: this.acqua,
    };

    this.schemaService.salvaDatiGenerali(payload).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Schema salvato con successo!';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Errore nel salvataggio.';
      }
    });
  }

  eliminaSchema() {
    if (!confirm('Sei sicuro di voler eliminare questo schema?')) {
      return;
    }

    if (!this.schema || !this.schema.id) {
      this.error = 'ID schema non disponibile.';
      return;
    }

    this.loading = true;
    this.message = null;
    this.error = null;

this.schemaService.eliminaSchema(this.schema.id).subscribe({
  next: () => {
    this.loading = false;
    this.message = 'Schema eliminato con successo.';

    // Comunica al componente padre che lo schema è stato eliminato
    this.schemaEliminato.emit();
  },
  error: (err) => {
    this.loading = false;
    this.error = err.error?.detail || "Errore durante l'eliminazione dello schema.";
  }
});

  }

  confermaEliminazione() {
  if (!this.schema || !this.schema.id) {
    this.error = 'ID schema non disponibile.';
    return;
  }

  this.loading = true;
  this.message = null;
  this.error = null;

  this.schemaService.eliminaSchema(this.schema.id).subscribe({
    next: () => {
      this.loading = false;
      this.message = 'Schema eliminato con successo.';
      this.schemaEliminato.emit();

      // Chiudi manualmente la modale
      const modalElement = document.getElementById('confermaEliminazioneModal');
      const modal = bootstrap.Modal.getInstance(modalElement!);
      modal?.hide();
    },
    error: (err) => {
      this.loading = false;
      this.error = err.error?.detail || "Errore durante l'eliminazione dello schema.";
    }
  });
}

}
