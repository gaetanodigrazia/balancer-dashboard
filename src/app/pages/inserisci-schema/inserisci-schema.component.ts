import { Component } from '@angular/core';
import { SchemaBrief, SchemaNutrizionaleService } from 'src/app/services/schema-nutrizionale.service';

@Component({
  selector: 'app-inserisci-schema',
  templateUrl: './inserisci-schema.component.html',
  styleUrls: ['./inserisci-schema.component.css']
})
export class InserisciSchemaComponent {
  nome = '';
  calorie = 0;
  carboidrati = 0;
  grassi = 0;
  proteine = 0;
  acqua = 0;
  isModello = false;
  loading = false;
  message = '';
  error = '';

  modelliDisponibili: SchemaBrief[] = [];
  idModelloOrigine: number | null = null;

  constructor(private schemaService: SchemaNutrizionaleService) {}

  ngOnInit(): void {
    this.caricaModelli();
  }

  caricaModelli(): void {
    this.schemaService.getModelli().subscribe({
      next: (modelli) => {
        this.modelliDisponibili = modelli;
      },
      error: () => {
        console.error('Errore nel caricamento dei modelli');
      },
    });
  }

  inviaDatiGenerali(): void {
    this.loading = true;
    this.message = '';
    this.error = '';

    const payload: any = {
      nome: this.nome,
      calorie: this.calorie,
      carboidrati: this.carboidrati,
      grassi: this.grassi,
      proteine: this.proteine,
      acqua: this.acqua,
      is_modello: this.isModello,
      is_global: false
    };

    if (this.idModelloOrigine !== null) {
      payload.clona_da = Number(this.idModelloOrigine); // ✅ conversione forzata a number
    }

    console.log('📤 Payload inviato:', payload);

    this.schemaService.salvaDatiGenerali(payload).subscribe({
      next: () => {
        this.message = '✅ Schema creato con successo';
        this.error = '';
        this.loading = false;
      },
      error: () => {
        this.message = '';
        this.error = '❌ Errore durante il salvataggio dello schema';
        this.loading = false;
      },
    });
  }
}
