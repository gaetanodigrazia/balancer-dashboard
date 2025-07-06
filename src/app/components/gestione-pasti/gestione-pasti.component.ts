import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SchemaNutrizionaleService, Alimento, Opzione, SchemaBrief, DettagliPasto } from '../../services/schema-nutrizionale.service';

@Component({
  selector: 'app-gestione-pasti',
  templateUrl: './gestione-pasti.component.html',
  styleUrls: ['./gestione-pasti.component.css']
})
export class GestionePastiComponent implements OnInit {
  schema!: SchemaBrief;
  isDemo = false;
  pasti: DettagliPasto[] = [];

  loading = false;
  message: string | null = null;
  error: string | null = null;
  opzioneDaEliminare: { pastoIndex: number; opzioneId: string } | null = null;
nuovoNomePasto: string = '';

  constructor(
    private schemaService: SchemaNutrizionaleService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.caricaSchemaById(id);
      }
    });
  }

private caricaSchemaById(id: string) {
  this.loading = true;

  this.schemaService.getSchemaById(id).subscribe({
    next: (data) => {
      this.schema = data;
      this.isDemo = data.is_global || false;

      this.schemaService.getSchemaDettagliById(id).subscribe({
        next: (dettagli) => {
          console.log('Dettagli ricevuti:', dettagli);

          let dettagliArray: DettagliPasto[];

          if (Array.isArray(dettagli)) {
            dettagliArray = dettagli;
          } else {
            dettagliArray = Object.keys(dettagli).map(key => ({
              nome: dettagli[key].nome || key,
              opzioni: dettagli[key].opzioni || []
            }));
          }

          this.pasti = dettagliArray.map(pasto => {
            pasto.opzioni.forEach(op => {
              op.salvata = true;
              op.inModifica = false;
            });
            return pasto;
          });

          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.detail || 'Errore nel caricamento dei dettagli dello schema.';
          this.mostraModaleEsito();
        }
      });
    },
    error: (err) => {
      this.loading = false;
      this.error = err.error?.detail || 'Errore nel caricamento dello schema.';
      this.mostraModaleEsito();
    }
  });
}


  nuovoAlimento(): Alimento {
    return { nome: '', macronutriente: '', grammi: null };
  }

  aggiungiOpzione(pastoIndex: number) {
    const nuovaOpzione: Opzione = {
      id: crypto.randomUUID(),
      alimenti: [this.nuovoAlimento()],
      salvata: false,
      inModifica: true
    };
    this.pasti[pastoIndex].opzioni.unshift(nuovaOpzione);
  }

  rimuoviOpzione(pastoIndex: number, opzioneIndex: number) {
    this.pasti[pastoIndex].opzioni.splice(opzioneIndex, 1);
  }

  modificaOpzione(pastoIndex: number, opzione: Opzione) {
    opzione.inModifica = true;
  }

  annullaModificaOpzione(pastoIndex: number, opzione: Opzione) {
    opzione.inModifica = false;
  }

  salvaModificaOpzione(pastoIndex: number, opzione: Opzione) {
    opzione.inModifica = false;
  }

  aggiungiAlimento(pastoIndex: number, opzioneIndex: number) {
    this.pasti[pastoIndex].opzioni[opzioneIndex].alimenti.push(this.nuovoAlimento());
  }

  rimuoviAlimento(pastoIndex: number, opzioneIndex: number, alimentoIndex: number) {
    this.pasti[pastoIndex].opzioni[opzioneIndex].alimenti.splice(alimentoIndex, 1);
  }

  macronutrienteChanged(pastoIndex: number, opzioneIndex: number, alimentoIndex: number) {
    const alimento = this.pasti[pastoIndex].opzioni[opzioneIndex].alimenti[alimentoIndex];
    if (alimento.macronutriente === 'gruppo') {
      if (!alimento.gruppoAlimenti || alimento.gruppoAlimenti.length === 0) {
        alimento.gruppoAlimenti = [this.nuovoAlimento()];
      }
      alimento.nome = '';
      alimento.grammi = null;
    } else {
      alimento.gruppoAlimenti = undefined;
    }
  }

  aggiungiSubAlimento(pastoIndex: number, opzioneIndex: number, alimentoIndex: number) {
    const alimento = this.pasti[pastoIndex].opzioni[opzioneIndex].alimenti[alimentoIndex];
    alimento.gruppoAlimenti = alimento.gruppoAlimenti || [];
    alimento.gruppoAlimenti.push(this.nuovoAlimento());
  }

  rimuoviSubAlimento(pastoIndex: number, opzioneIndex: number, alimentoIndex: number, subIndex: number) {
    const alimento = this.pasti[pastoIndex].opzioni[opzioneIndex].alimenti[alimentoIndex];
    if (!alimento.gruppoAlimenti) return;
    alimento.gruppoAlimenti.splice(subIndex, 1);
    if (alimento.gruppoAlimenti.length === 0) {
      alimento.macronutriente = '';
    }
  }

  confirmModal(pastoIndex: number, opzioneId: string) {
    this.opzioneDaEliminare = { pastoIndex, opzioneId };
    const modal = new (window as any).bootstrap.Modal(document.getElementById('confermaEliminazioneModal'));
    modal.show();
  }

  confermaEliminazione() {
    if (!this.opzioneDaEliminare) return;
    const { pastoIndex, opzioneId } = this.opzioneDaEliminare;

    this.loading = true;
    this.error = null;
    this.message = null;

    this.schemaService.rimuoviOpzione(this.schema.id, this.pasti[pastoIndex].nome, opzioneId).subscribe({
      next: () => {
        this.pasti[pastoIndex].opzioni = this.pasti[pastoIndex].opzioni.filter(op => op.id !== opzioneId);
        this.loading = false;
        this.message = 'Opzione eliminata con successo.';
        this.mostraModaleEsito();

        const modalEl = document.getElementById('confermaEliminazioneModal');
        if (modalEl) {
          const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
          modal?.hide();
        }

        this.opzioneDaEliminare = null;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Errore durante l\'eliminazione dell\'opzione.';
        this.mostraModaleEsito();
      }
    });
  }

  salvaDettagli() {
    if (!this.schema) return;

    this.loading = true;
    this.message = null;
    this.error = null;

const dettagliObj: { [key: string]: DettagliPasto } = {};
this.pasti.forEach(pasto => {
  dettagliObj[pasto.nome] = {
    nome: pasto.nome,
    opzioni: pasto.opzioni
  };
});

const payload = {
  nome: this.schema.nome,
  tipoSchema: this.schema.id,
  dettagli: dettagliObj
};


    this.schemaService.salvaOpzioniPasti(payload).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Dettagli pasti salvati con successo!';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Errore nel salvataggio dettagli pasti.';
      }
    });
  }

  salvaSingoloPasto(pastoIndex: number) {
    if (!this.schema) return;

    const opzioneIndex = this.pasti[pastoIndex].opzioni.findIndex(o => !o.salvata || o.inModifica);
    if (opzioneIndex === -1) {
      this.error = 'Nessuna opzione da salvare.';
      return;
    }

    const opzione = this.pasti[pastoIndex].opzioni[opzioneIndex];
    const alimentiValidi = opzione.alimenti.filter(
      a => a.nome?.trim() && a.macronutriente && (a.macronutriente === 'gruppo' || a.grammi)
    );

    if (alimentiValidi.length === 0) {
      this.error = 'Alimenti non validi.';
      return;
    }

    this.loading = true;
    this.message = null;
    this.error = null;

    const opzioniSalvate = this.pasti[pastoIndex].opzioni.filter(o => o.salvata && o !== opzione);

const payload = {
  nome: this.schema.nome,
  tipoSchema: this.schema.id,
  tipoPasto: this.pasti[pastoIndex].nome,
  dettagli: {
    nome: this.pasti[pastoIndex].nome, 
    opzioni: [...opzioniSalvate, { ...opzione, alimenti: alimentiValidi }]
  }
};


    this.schemaService.salvaDettagliSingoloPasto(payload).subscribe({
      next: () => {
        this.pasti[pastoIndex].opzioni[opzioneIndex].salvata = true;
        this.pasti[pastoIndex].opzioni[opzioneIndex].inModifica = false;
        this.loading = false;
        this.message = `Opzione per '${this.pasti[pastoIndex].nome}' salvata con successo!`;
        this.mostraModaleEsito();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || `Errore nel salvataggio dell'opzione.`;
        this.mostraModaleEsito();
      }
    });
  }

  aggiungiNuovoPasto() {
  const nome = this.nuovoNomePasto.trim();
  if (!nome) {
    this.error = 'Inserisci un nome valido per il nuovo pasto';
    this.mostraModaleEsito();
    return;
  }

  // Evita duplicati
  if (this.pasti.some(p => p.nome === nome)) {
    this.error = 'Esiste già un pasto con questo nome';
    this.mostraModaleEsito();
    return;
  }

  const nuovoPasto: DettagliPasto = {
    nome: nome,
    opzioni: []
  };

  this.pasti.push(nuovoPasto);
  this.nuovoNomePasto = '';
}


  mostraModaleEsito(): void {
    setTimeout(() => {
      const modalElement = document.getElementById('notificaEsitoModal');
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();
      }
    }, 0);
  }

toggleCompletatoPasto(pastoIndex: number, completato: boolean) {
  const pasto = this.pasti[pastoIndex];
  if (!this.schema?.id) return;

  this.loading = true;
  this.schemaService.toggleCompletatoPasto(this.schema.id, pasto.nome, completato).subscribe({
    next: () => {
      pasto.completato = completato;
      this.loading = false;
      this.message = completato ? `Pasto '${pasto.nome}' segnato come completato` : `Pasto '${pasto.nome}' segnato come incompleto`;
      this.mostraModaleEsito();
    },
    error: (err) => {
      this.loading = false;
      this.error = err.error?.detail || `Errore nel cambio stato del pasto`;
      this.mostraModaleEsito();
    }
  });
}

}
