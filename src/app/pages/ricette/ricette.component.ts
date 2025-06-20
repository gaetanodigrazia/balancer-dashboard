import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SchemaNutrizionaleService, SchemaBrief } from 'src/app/services/schema-nutrizionale.service';

interface Ingrediente {
  nome: string;
  quantita: string;
}

interface Ricetta {
  titolo: string;
  ingredienti: Ingrediente[];
  procedimento: string;
}

@Component({
  selector: 'app-ricette',
  templateUrl: './ricette.component.html',
  styleUrls: ['./ricette.component.css']
})
export class RicetteComponent implements OnInit {
  schemi: SchemaBrief[] = [];
  ricetta: Ricetta | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private schemaService: SchemaNutrizionaleService
  ) {}

  ngOnInit() {
    this.caricaSchemi();
  }

  // Carica gli schemi dal backend
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

  // Richiede al backend la generazione della ricetta per uno schema specifico
  generaRicetta(schemaId: number) {
    this.loading = true;
    this.ricetta = null;
    this.error = null;

    this.http.post<Ricetta>(`/ricette/genera/${schemaId}`, {}).subscribe({
      next: (res) => {
        this.ricetta = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore nella generazione della ricetta:', err);
        this.error = 'Errore nella generazione della ricetta.';
        this.loading = false;
      }
    });
  }
}
