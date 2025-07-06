import { Component } from '@angular/core';
import { SchemaNutrizionaleService, SchemaBrief } from 'src/app/services/schema-nutrizionale.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  ultimiSchemi: SchemaBrief[] = [];
  loadingUltimi = false;
  errorUltimi: string | null = null;

  progressPercentuale = 0;
  progressTotale = 0;
  progressCompleti = 0;
  loadingProgress = false;
  errorProgress: string | null = null;

  constructor(
    private schemaService: SchemaNutrizionaleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.caricaUltimiSchemi();
    this.caricaProgress();
  }

  caricaUltimiSchemi(): void {
    this.loadingUltimi = true;
    this.errorUltimi = null;

    this.schemaService.getUltimiSchemi().subscribe({
      next: (schemi) => {
        this.ultimiSchemi = schemi;
        this.loadingUltimi = false;
      },
      error: (err) => {
        this.loadingUltimi = false;
        this.errorUltimi = err.error?.detail || 'Errore nel caricamento degli ultimi schemi.';
      }
    });
  }

  caricaProgress(): void {
    this.loadingProgress = true;
    this.errorProgress = null;

    this.schemaService.getProgressUtente().subscribe({
      next: (progress) => {
        this.progressPercentuale = progress.percentuale;
        this.progressTotale = progress.totaleSchemi;
        this.progressCompleti = progress.schemiCompleti;
        this.loadingProgress = false;
      },
      error: (err) => {
        this.loadingProgress = false;
        this.errorProgress = err.error?.detail || 'Errore nel caricamento del progresso.';
      }
    });
  }

  apriSchema(schemaId: string): void {
    this.router.navigate(['/gestione-pasti', schemaId]);
  }
}
