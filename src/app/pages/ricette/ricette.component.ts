import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DettagliPastoService } from 'src/app/services/dettagli-pasto.service';
import { SchemaCompletoDTO } from 'src/app/services/dettagli-pasto.service';
import { SchemaBrief, SchemaNutrizionaleService } from 'src/app/services/schema-nutrizionale.service';
interface Ingrediente {
  nome: string;
  quantita: string;
}

interface Ricetta {
  titolo: string;
  ingredienti: Ingrediente[];
  procedimento: string;
  tempoPreparazione: string;
  difficolta: string;
}

@Component({
  selector: 'app-ricette',
  templateUrl: './ricette.component.html',
  styleUrls: ['./ricette.component.css']
})
export class RicetteComponent implements OnInit {
  ricetta: Ricetta | null = null;
  loading = false;
  error: string | null = null;
  schemi: SchemaBrief[] = [];
selectedSchema: SchemaBrief | null = null;

constructor(
    private route: ActivatedRoute,
    private dettagliService: DettagliPastoService,
    private schemaService: SchemaNutrizionaleService
) {}

ngOnInit() {
    const schemaId = this.route.snapshot.paramMap.get('id');
    if (schemaId) {
      this.generaRicetta(schemaId);
    }
    this.caricaSchemi();  // <-- aggiungi caricamento schemi
}

caricaSchemi() {
    this.schemaService.getSchemiDisponibili().subscribe({
        next: (data) => {
            this.schemi = data;
            console.log('Schemi caricati:', data);
        },
        error: (err) => {
            console.error('Errore nel caricamento degli schemi:', err);
            this.error = 'Errore nel caricamento degli schemi.';
        }
    });
}

  generaRicetta(schemaId: string) {
    this.loading = true;
    this.error = null;
    this.ricetta = null;
    console.log("Chiamata ");

    this.dettagliService.getSchemaCompletoById(schemaId).subscribe({
      next: (data: SchemaCompletoDTO) => {
        console.log("Chiamata ", data.dettagli);
        // ✅ Esempio: genera ricetta per PRANZO
        

        this.loading = false;
      },
      error: (err) => {
        console.error('Errore nella generazione della ricetta:', err);
        this.error = 'Errore nella generazione della ricetta.';
        this.loading = false;
      }
    });
  }

  scegliAlimento(pasto: any, macro: string) {
    const opzione = pasto.opzioni.find((o: any) =>
      o.alimenti.some((a: any) =>
        a.macronutriente === macro || a.macronutriente === 'gruppo'
      )
    );

    if (!opzione) return { nome: '-', grammi: 0 };

    const alimento = opzione.alimenti.find((a: any) =>
      a.macronutriente === macro
    ) || opzione.alimenti.find((a: any) => a.macronutriente === 'gruppo');

    if (alimento.macronutriente === 'gruppo') {
      // Usa il primo alimento del gruppo come rappresentativo
      return alimento.gruppoAlimenti[0] || { nome: '-', grammi: 0 };
    }

    return alimento;
  }
}
