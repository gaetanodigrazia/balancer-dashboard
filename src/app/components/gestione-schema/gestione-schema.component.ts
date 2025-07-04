import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SchemaBrief, SchemaNutrizionaleService } from 'src/app/services/schema-nutrizionale.service';
declare var bootstrap: any;

@Component({
  selector: 'app-gestione-schema',
  templateUrl: './gestione-schema.component.html',
  styleUrls: ['./gestione-schema.component.css']
})
export class GestioneSchemaComponent implements OnInit {
  schema: (SchemaBrief & {
    calorie?: number;
    carboidrati?: number;
    grassi?: number;
    proteine?: number;
    acqua?: number;
  }) | null = null;


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
    private route: ActivatedRoute,
    private router: Router
  ) { }

ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');
  if (id) {
    this.caricaSchema(id);  // ← id è una stringa UUID
  } else {
    this.error = 'ID schema non valido.';
  }
}


  private caricaSchema(id: string) {
    this.loading = true;
    this.schemaService.getSchemaById(id).subscribe({
      next: (data) => {
        this.schema = data;
        this.nome = data.nome;
        this.calorie = data.calorie;
        this.carboidrati = data.carboidrati;
        this.grassi = data.grassi;
        this.proteine = data.proteine;
        this.acqua = data.acqua;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Errore nel caricamento dello schema.';
      }
    });
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

const payload: any = {
  nome: this.nome.trim(),
  calorie: this.calorie,
  carboidrati: this.carboidrati,
  grassi: this.grassi,
  proteine: this.proteine,
  acqua: this.acqua,
};

if (this.schema?.id) {
  payload.id = this.schema.id;
}

console.log('Payload in invio:', payload);

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
}
