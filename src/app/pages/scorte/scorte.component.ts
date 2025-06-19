import { Component, OnInit } from '@angular/core';
import { ScorteService } from '../../services/scorte.service';

@Component({
  selector: 'app-scorte',
  templateUrl: './scorte.component.html',
  styleUrls: ['./scorte.component.css']
})
export class ScorteComponent implements OnInit {
  scorte: any[] = [];
  loading = true;
  error: string | null = null;

  nuovoProdotto = {
    nome: '',
    quantita: 1,
    quantita_grammi: 0,
    prezzo_unitario: 0
  };

  constructor(private scorteService: ScorteService) {}

  ngOnInit(): void {
    this.caricaScorte();
  }

  caricaScorte() {
    this.loading = true;
    this.error = null;
    this.scorteService.getScorteAttuali().subscribe({
      next: (data) => {
        this.scorte = this.raggruppaPerNome(data);
        this.loading = false;
        console.log('📦 Risposta dal backend raggruppata:', this.scorte);
      },
      error: (err) => {
        this.error = err.message || 'Errore nella richiesta';
        this.loading = false;
      }
    });
  }

  aggiungiProdotto() {
    if (
      !this.nuovoProdotto.nome.trim() ||
      this.nuovoProdotto.quantita < 1 ||
      this.nuovoProdotto.prezzo_unitario < 0
    ) {
      alert('Inserisci dati validi per il prodotto');
      return;
    }

    this.scorteService.aggiungiProdotto(this.nuovoProdotto).subscribe({
      next: () => {
        // Reset form
        this.nuovoProdotto = { nome: '', quantita: 1, quantita_grammi: 0, prezzo_unitario: 0 };
        // Ricarica lista prodotti
        this.caricaScorte();
      },
      error: () => {
        alert('Errore nell\'inserimento prodotto');
      }
    });
  }

  raggruppaPerNome(prodotti: any[]) {
    const map = new Map<
      string,
      {
        nome: string;
        quantita: number;
        quantita_grammi: number;
        prezzo_unitario_tot: number;
        count: number;
        scontrino_ids: Set<number | null>;
      }
    >();

    prodotti.forEach(p => {
      const key = p.nome;
      if (!map.has(key)) {
        map.set(key, {
          nome: p.nome,
          quantita: p.quantita,
          quantita_grammi: p.quantita_grammi ?? 0,
          prezzo_unitario_tot: p.prezzo_unitario * p.quantita,
          count: p.quantita,
          scontrino_ids: new Set(p.scontrino_id !== null ? [p.scontrino_id] : [])
        });
      } else {
        const entry = map.get(key)!;
        entry.quantita += p.quantita;
        entry.quantita_grammi += p.quantita_grammi ?? 0;
        entry.prezzo_unitario_tot += p.prezzo_unitario * p.quantita;
        entry.count += p.quantita;
        if (p.scontrino_id === null) entry.scontrino_ids.add(999);
        if (p.scontrino_id !== null) entry.scontrino_ids.add(p.scontrino_id);
      }
    });

    return Array.from(map.values()).map(entry => ({
      nome: entry.nome,
      quantita: entry.quantita,
      quantita_grammi: entry.quantita_grammi,
      prezzo_unitario: entry.prezzo_unitario_tot / entry.count,
      scontrino_ids: Array.from(entry.scontrino_ids)
    }));
  }

  rimuoviProdotto(id: number) {
    this.scorteService.rimuoviProdotto(id).subscribe({
      next: () => {
        this.caricaScorte();
      },
      error: (err) => {
        alert('Errore durante la rimozione del prodotto: ' + (err.message || err));
      }
    });
  }

  
  // Rimuovi aggiornaQuantita, non più necessario

salvaQuantitaAggiornata(prodotto: any) {
  if (!prodotto.id) {
    console.warn('Prodotto senza id, impossibile aggiornare');
    return;
  }

  const datiAggiornati = {
    quantita: prodotto.quantita,
    quantita_grammi: prodotto.quantita_grammi ?? 0,
  };

  this.scorteService.aggiornaProdotto(prodotto.id, datiAggiornati).subscribe({
    next: () => {
      alert(`Prodotto ${prodotto.nome} aggiornato correttamente.`);
      // Se vuoi puoi ricaricare la lista prodotti per sicurezza:
      // this.caricaScorte();
    },
    error: (err) => {
      alert(`Errore durante l'aggiornamento del prodotto ${prodotto.nome}: ${err.message || err}`);
    }
  });
}

}
