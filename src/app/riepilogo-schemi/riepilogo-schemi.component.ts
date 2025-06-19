import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SchemaBrief } from '../services/schema-nutrizionale.service';
import { SchemaNutrizionaleService } from '../services/schema-nutrizionale.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-riepilogo-schemi',
  templateUrl: './riepilogo-schemi.component.html',
  styleUrls: ['./riepilogo-schemi.component.css']
})
export class RiepilogoSchemiComponent implements OnInit {
  schemi: SchemaBrief[] = [];
  selectedSchema: SchemaBrief | null = null;

  @Output() selezionaSchema = new EventEmitter<SchemaBrief>();
  @Output() cambiaTab = new EventEmitter<'gestione-schema' | 'gestione-pasti'>();

  constructor(private schemaService: SchemaNutrizionaleService) {}

  ngOnInit() {
    this.caricaSchemi();
  }

  caricaSchemi() {
    this.schemaService.getSchemiDisponibili().subscribe({
  next: (data) => {
    console.log('Schemi ricevuti dal backend:', data);
    this.schemi = data;
  },
      error: (err) => {
        console.error('Errore nel caricamento degli schemi:', err);
        this.schemi = [];
      }
    });
  }

  seleziona(s: SchemaBrief) {
    this.selectedSchema = s;
    this.selezionaSchema.emit(s);
  }

modificaSchema(schema: SchemaBrief) {
  this.selectedSchema = schema;
  this.selezionaSchema.emit(schema);
  this.cambiaTab.emit('gestione-schema');
}

modificaPasti(schema: SchemaBrief) {
  this.schemaService.getSchemaById(schema.id).subscribe({
    next: (detailedSchema) => {
      this.selectedSchema = detailedSchema;
      this.selezionaSchema.emit(detailedSchema);
      this.cambiaTab.emit('gestione-pasti');
    },
    error: (err) => {
      console.error('Errore nel caricamento dettagli schema:', err);
    }
  });
}

 esportaSchemaPdf(schema: any) {
    // Crea un contenuto testuale per il PDF
    const doc = new jsPDF();

    // Definisci alcune variabili per il layout testo
    const lineHeight = 10;
    let y = 10;

    doc.setFontSize(14);
    doc.text(`Schema Nutrizionale: ${schema.nome}`, 10, y);
    y += lineHeight;

    doc.setFontSize(12);
    doc.text(`Calorie: ${schema.calorie}`, 10, y);
    y += lineHeight;

    doc.text(`Carboidrati: ${schema.carboidrati} g`, 10, y);
    y += lineHeight;

    doc.text(`Grassi: ${schema.grassi} g`, 10, y);
    y += lineHeight;

    doc.text(`Proteine: ${schema.proteine} g`, 10, y);
    y += lineHeight;

    doc.text(`Acqua: ${schema.acqua} L`, 10, y);
    y += lineHeight;

    // Se vuoi puoi aggiungere anche i dettagli (pasti, alimenti ecc)
    console.log('Dettagli schema:', schema.dettagli);

    if (schema.dettagli) {
      y += lineHeight;
      doc.setFontSize(13);
      doc.text('Dettagli Pasti:', 10, y);
      y += lineHeight;
console.log('Dettagli schema:', schema.dettagli);

      for (const tipoPasto in schema.dettagli) {
        if (schema.dettagli.hasOwnProperty(tipoPasto)) {
          doc.setFontSize(12);
          doc.text(`- ${tipoPasto.replace(/_/g, ' ')}`, 10, y);
          y += lineHeight;

          const dettagliPasto = schema.dettagli[tipoPasto];
console.log('Dettagli schema:', schema.dettagli);

          // assumo dettagliPasto.opzioni è array di array di alimenti (Opzione[])
          dettagliPasto.opzioni.forEach((opzione: any[], idx: number) => {
            console.log('Dettagli schema:', schema.dettagli);

            doc.text(`  Opzione ${idx + 1}:`, 12, y);
            y += lineHeight;

            opzione.forEach((alimento: any) => {
              const line = `    • ${alimento.nome} - ${alimento.macronutriente} - ${alimento.grammi} g`;
              doc.text(line, 14, y);
              y += lineHeight;
            });
          });

          y += lineHeight / 2;
        }
      }
    }

    // Salva il PDF con nome schema
    doc.save(`${schema.nome.replace(/\s+/g, '_').toLowerCase()}_schema.pdf`);
  }

}
