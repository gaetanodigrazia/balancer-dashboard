import { Component } from '@angular/core';

interface SchemaBrief {
  id: number;
  nome: string;
}

@Component({
  selector: 'app-schema-nutrizionale',
  templateUrl: './schema-nutrizionale.component.html',
  styleUrls: ['./schema-nutrizionale.component.css']
})
export class SchemaNutrizionaleComponent {



  // Se il componente gestione-schema emette un aggiornamento, puoi aggiornare schemaSelezionato qui
  onSchemaAggiornato(schema: SchemaBrief) {
    this.schemaSelezionato = schema;
  }


tab: 'riepilogo' | 'gestione-schema' | 'gestione-pasti' | 'inserisci-schema' = 'riepilogo';
schemaSelezionato: SchemaBrief | null = null;

onSchemaSelezionato(schema: SchemaBrief, tab: 'gestione-schema' | 'gestione-pasti' = 'gestione-schema') {
  this.schemaSelezionato = schema;
  this.changeTab(tab);
}

changeTab(tabName: typeof this.tab) {
  this.tab = tabName;
}


}
