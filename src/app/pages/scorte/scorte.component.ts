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
    if (!this.nuovoProdotto.nome.trim() || this.nuovoProdotto.quantita < 1 || this.nuovoProdotto.prezzo_unitario < 0) {
      alert('Inserisci dati validi per il prodotto');
      return;
    }

    this.scorteService.aggiungiProdotto(this.nuovoProdotto).subscribe({
      next: () => {
        this.nuovoProdotto = { nome: '', quantita: 1, prezzo_unitario: 0 };
        this.caricaScorte();
      },
      error: () => {
        alert('Errore nell\'inserimento prodotto');
      }
    });
  }

  raggruppaPerNome(prodotti: any[]) {
    const map = new Map<string, {
      nome: string;
      quantita: number;
      prezzo_unitario_tot: number;
      count: number;
      scontrino_ids: Set<number | null>;
      ids: Set<number>;
    }>();

    prodotti.forEach(p => {
      const key = p.nome;
      if (!map.has(key)) {
        map.set(key, {
          nome: p.nome,
          quantita: p.quantita,
          prezzo_unitario_tot: p.prezzo_unitario * p.quantita,
          count: p.quantita,
          scontrino_ids: new Set(p.scontrino_id !== null ? [p.scontrino_id] : []),
          ids: new Set(p.id ? [p.id] : [])
        });
      } else {
        const entry = map.get(key)!;
        entry.quantita += p.quantita;
        entry.prezzo_unitario_tot += p.prezzo_unitario * p.quantita;
        entry.count += p.quantita;
        if (p.scontrino_id === null) entry.scontrino_ids.add(999);
        if (p.scontrino_id !== null) entry.scontrino_ids.add(p.scontrino_id);
        if (p.id) entry.ids.add(p.id);
      }
    });

    return Array.from(map.values()).map(entry => ({
      nome: entry.nome,
      quantita: entry.quantita,
      prezzo_unitario: entry.prezzo_unitario_tot / entry.count,
      scontrino_ids: Array.from(entry.scontrino_ids),
      ids: Array.from(entry.ids)
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
}
