import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DettagliPastoService, SchemaCompletoDTO } from 'src/app/services/dettagli-pasto.service';
import { HttpClient } from '@angular/common/http';

interface RicettaGenerata {
  titolo: string;
  ingredienti: { nome: string; quantita: string }[];
  procedimento: string;
  tempoPreparazione?: string;
  difficolta?: string;
}

declare var bootstrap: any;

@Component({
  selector: 'app-genera-ricette',
  templateUrl: './genera-ricette.component.html',
  styleUrls: ['./genera-ricette.component.css']
})
export class GeneraRicetteComponent implements OnInit {
  schemaCompleto: SchemaCompletoDTO | null = null;
  loading = false;
  error: string | null = null;

  ricetteGenerate: { [pasto: string]: RicettaGenerata } = {};
  loadingRicetta: { [pasto: string]: boolean } = {};

  ricettaSelezionata: RicettaGenerata | null = null;
  modalInstance: any = null;

  constructor(
    private route: ActivatedRoute,
    private dettagliService: DettagliPastoService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID schema non valido.';
      return;
    }

    this.loading = true;
    this.dettagliService.getSchemaCompletoById(id).subscribe({
      next: (data) => {
        this.schemaCompleto = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento dello schema completo:', err);
        this.error = err.error?.detail || 'Errore nel caricamento dello schema.';
        this.loading = false;
      }
    });

    // Inizializza la modale
    setTimeout(() => {
      const modalEl = document.getElementById('ricettaModal');
      if (modalEl) {
        this.modalInstance = new bootstrap.Modal(modalEl);
      }
    }, 0);
  }

  getPastiKeys(): string[] {
    return this.schemaCompleto?.dettagli ? Object.keys(this.schemaCompleto.dettagli) : [];
  }

  generaRicettaPasto(nomePasto: string) {
    this.loadingRicetta[nomePasto] = true;
    this.error = null;

    const body = {
      nomePasto,
      schemaJson: this.route.snapshot.paramMap.get('id')
    };

    this.http.post<RicettaGenerata>('http://localhost:8080/api/openai/genera-ricetta', body).subscribe({
      next: (res) => {
        console.log('✅ Ricetta ricevuta:', res);
        this.ricetteGenerate[nomePasto] = res;
        this.ricettaSelezionata = res;
        this.loadingRicetta[nomePasto] = false;

        // Mostra la modale con la ricetta generata
        setTimeout(() => {
          this.modalInstance?.show();
        }, 0);
      },
      error: (err) => {
        console.error(`Errore nella generazione della ricetta per ${nomePasto}:`, err);
        this.error = `Errore nella generazione della ricetta per ${nomePasto}.`;
        this.loadingRicetta[nomePasto] = false;
      }
    });
  }
}
