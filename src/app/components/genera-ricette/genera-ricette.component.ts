import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SchemaNutrizionaleService, SchemaBrief, DettagliPasto } from 'src/app/services/schema-nutrizionale.service';
import { HttpClient } from '@angular/common/http';
import * as bootstrap from 'bootstrap';

interface Ricetta {
  titolo: string;
  ingredienti: { nome: string; quantita: string }[];
  procedimento: string;
  presentazione?: string;
  nota_nutrizionale?: string;
}

@Component({
  selector: 'app-genera-ricette',
  templateUrl: './genera-ricette.component.html',
  styleUrls: ['./genera-ricette.component.css']
})
export class GeneraRicetteComponent implements OnInit {
  schema!: SchemaBrief;
  dettagliPasti: { [tipoPasto: string]: DettagliPasto } = {};
  tipiPasto = ['colazione', 'spuntino_1', 'pranzo', 'spuntino_2', 'pre_intra_post_workout', 'cena'];

  ricetta: Ricetta | null = null;
  error: string | null = null;

  loadingPerPasto: { [tipoPasto: string]: boolean } = {};
  loadingModal = false;

  constructor(
    private route: ActivatedRoute,
    private schemaService: SchemaNutrizionaleService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
const id = this.route.snapshot.paramMap.get('id');
if (!id || id.trim() === '') {
  this.error = 'ID schema non valido.';
  return;
}

    this.schemaService.getSchemaById(id).subscribe({
      next: (data) => {
        this.schema = data;
        this.tipiPasto.forEach(tipo => {
          const pasto = this.schema.dettagli?.[tipo];
          this.dettagliPasti[tipo] = pasto?.opzioni?.length ? pasto : { opzioni: [] };
        });
      },
      error: () => {
        this.error = 'Errore nel caricamento dello schema.';
      }
    });
  }

  formatTipoPasto(tipo: string): string {
    return tipo.replace(/_/g, ' ').toUpperCase();
  }

  generaRicettaPerPasto(tipoPasto: string) {
    this.loadingPerPasto[tipoPasto] = true;
    this.loadingModal = true;
    this.ricetta = null;
    this.error = null;

    const modalElement = document.getElementById('ricettaModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }

    this.http.post<Ricetta>(`/ricette/genera/${this.schema.id}/${tipoPasto}`, {}).subscribe({
      next: (res) => {
        this.ricetta = res;
        this.loadingModal = false;
        this.loadingPerPasto[tipoPasto] = false;
      },
      error: () => {
        this.error = 'Errore nella generazione della ricetta.';
        this.loadingModal = false;
        this.loadingPerPasto[tipoPasto] = false;
      }
    });
  }
}
