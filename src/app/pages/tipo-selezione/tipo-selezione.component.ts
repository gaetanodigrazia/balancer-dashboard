import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-tipo-selezione',
  templateUrl: './tipo-selezione.component.html',
  imports: [RouterModule] // ✅ IMPORTANTE per usare routerLink
})
export class TipoSelezioneComponent {
  predizioni = [
    { id: 1001, tipo: 'Indipendente', prezzo: 210000, data: '06/06' },
    { id: 1002, tipo: 'Appartamento', prezzo: 165000, data: '06/06' },
    { id: 1003, tipo: 'Indipendente', prezzo: 230000, data: '05/06' },
    { id: 1004, tipo: 'Appartamento', prezzo: 155000, data: '05/06' },
    { id: 1005, tipo: 'Indipendente', prezzo: 198000, data: '04/06' },
  ];

  stats = {
    indipendenti: 72,
    appartamenti: 48
  };
}

