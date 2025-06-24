import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { SchemaBrief, SchemaNutrizionaleService } from 'src/app/services/schema-nutrizionale.service';
import { UtilsService } from 'src/app/services/utils.service'; // ✅ nuovo import
declare var bootstrap: any;

@Component({
  selector: 'app-inserisci-schema',
  templateUrl: './inserisci-schema.component.html',
  styleUrls: ['./inserisci-schema.component.css']
})
export class InserisciSchemaComponent implements OnInit {
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
  isDemo = false;

  ts: string = '';
  sig: string = '';

  modelliDisponibili: SchemaBrief[] = [];
  idModelloOrigine: number | null = null;

  constructor(
    private schemaService: SchemaNutrizionaleService,
    private authService: AuthService,
    private utilsService: UtilsService // ✅ nuovo
  ) { }

  ngOnInit(): void {
    this.caricaModelli();
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.isDemo = user.is_demo;

        if (this.isDemo) {

          this.utilsService.generaTokenFirmato().subscribe({
            next: ({ ts, sig }) => {
              this.ts = ts;
              this.sig = sig;
              this.nome = `Demo - ${ts}`;  // Mostra il token nel campo nome
              console.log('🔐 Token demo ricevuto', { ts, sig });
            },
            error: () => {
              console.error('❌ Errore nel recupero token demo');
            }
          });


          setTimeout(() => {
            const demoModal = document.getElementById('demoModal');
            if (demoModal) {
              const modalInstance = new bootstrap.Modal(demoModal);
              modalInstance.show();
            }
          }, 300);
        }
      },
      error: (err) => {
        console.warn('Errore nel recupero dell’utente:', err);
      }
    });
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
      payload.clona_da = Number(this.idModelloOrigine);
    }

    // ✅ Se è demo, aggiungi ts e sig
    if (this.isDemo) {
      payload.ts = this.ts;
      payload.sig = this.sig;
    }

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
