import { Component, OnInit } from '@angular/core';
import { Paziente, PazientiService } from 'src/app/services/pazienti.service';

@Component({
  selector: 'app-pazienti',
  templateUrl: './pazienti.component.html',
})
export class PazientiComponent implements OnInit {
  pazienti: Paziente[] = [];
  richiestePending: Paziente[] = [];

  loading = false;
  error: string | null = null;

  loadingPending = false;
  errorPending: string | null = null;

  constructor(private pazientiService: PazientiService) {}

  ngOnInit(): void {
    this.caricaPazienti();
    this.caricaRichiestePending();
  }

  caricaPazienti() {
    this.loading = true;
    this.pazientiService.getPazientiAssociati().subscribe({
      next: (data) => {
        console.log("Data received: ", data);
        this.pazienti = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Errore nel caricamento dei pazienti.';
        this.loading = false;
      },
    });
  }

  caricaRichiestePending() {
    this.loadingPending = true;
    this.pazientiService.getRichiesteDaConfermare().subscribe({
      next: (res) => {
        console.log(this.richiestePending);
                console.log("Data received: ", res);

        this.richiestePending = res;
        this.loadingPending = false;
      },
      error: () => {
        this.errorPending = 'Errore nel caricamento delle richieste.';
        this.loadingPending = false;
      },
    });
  }

  rimuovi(pazienteId: string) {
    if (!confirm('Vuoi davvero rimuovere il paziente?')) return;

    this.pazientiService.rimuoviAssociazione(pazienteId).subscribe({
      next: () => {
        this.pazienti = this.pazienti.filter(p => p.id !== pazienteId);
      },
      error: () => {
        this.error = 'Errore nella rimozione.';
      }
    });
  }

  conferma(id: string) {
    this.pazientiService.confermaAssociazione(id).subscribe(() => {
      this.richiestePending = this.richiestePending.filter(r => r.pazienteId !== id);
      // svuotare arrays
      this.caricaPazienti();
    });
  }
}
