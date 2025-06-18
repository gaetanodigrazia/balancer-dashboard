import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-lista-spesa',
  templateUrl: './lista-spesa.component.html',
})
export class ListaSpesaComponent implements OnInit {
  lista: string[] = [];
  nuovoItem = '';
  scorte: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.caricaScorte();
  }

  caricaScorte() {
    this.http.get<any[]>('/prodotti').subscribe({
      next: (dati) => {
        this.scorte = dati;
      },
      error: () => {
        this.scorte = [];
      },
    });
  }

  aggiungi() {
    if (this.nuovoItem.trim()) {
      this.lista.push(this.nuovoItem.trim());
      this.nuovoItem = '';
    }
  }

  rimuovi(index: number) {
    this.lista.splice(index, 1);
  }

  esportaPDF() {
    const doc = new jsPDF();
    doc.text('Lista della Spesa', 10, 10);

    this.lista.forEach((item, i) => {
      doc.text(`- ${item}`, 10, 20 + i * 10);
    });

    const offset = 30 + this.lista.length * 10;
    doc.text('Scorte Disponibili', 10, offset);

    this.scorte.forEach((scorta, i) => {
      const y = offset + 10 + i * 10;
      doc.text(
        `• ${scorta.nome} - ${scorta.quantita} x ${scorta.prezzo_unitario}€`,
        10,
        y
      );
    });

    doc.save('lista_spesa.pdf');
  }
}
