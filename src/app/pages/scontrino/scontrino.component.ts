import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-scontrino',
  templateUrl: './scontrino.component.html',
})
export class ScontrinoComponent {
  immagine!: File;
  scontrino: any = null;
  loading = false;
  errore = '';

  constructor(private http: HttpClient) {}

  onFileChange(event: any) {
    this.immagine = event.target.files[0];
  }

  inviaOCR() {
    if (!this.immagine) return;

    const formData = new FormData();
    formData.append('file', this.immagine);

    this.loading = true;
    this.errore = '';
    this.scontrino = null;

    this.http.post<{ status: string; data?: any; error?: any }>('/ocr-scontrino', formData).subscribe({
      next: res => {
        this.loading = false;
        if (res.status === 'ok') {
          this.scontrino = res.data;
        } else {
          this.errore = res.error;
        }
      },
      error: err => {
        this.loading = false;
        this.errore = 'Errore di rete o server.';
      }
    });
  }
}
