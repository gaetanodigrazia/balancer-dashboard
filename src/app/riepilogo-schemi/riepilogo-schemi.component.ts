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

  constructor(private schemaService: SchemaNutrizionaleService) { }

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

  esportaSchemaPdf(schemaBrief: SchemaBrief) {
    this.schemaService.getSchemaById(schemaBrief.id).subscribe({
      next: (schema) => {
        console.log('📦 SCHEMA COMPLETO PER PDF:', JSON.stringify(schema, null, 2));
        this.generaPdf(schema);  // Chiamata al metodo vero di esportazione
      },
      error: (err) => {
        console.error('Errore nel caricamento dettagli schema per esportazione:', err);
      }
    });
  }
  private generaPdf(schema: any) {
    const doc = new jsPDF();
    const lineHeight = 8;
    let y = 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.text(`Schema Nutrizionale: ${schema.nome}`, 10, y);
    y += lineHeight * 2;

    doc.setFontSize(12);
    doc.text(`Calorie: ${schema.calorie}`, 10, y); y += lineHeight;
    doc.text(`Carboidrati: ${schema.carboidrati}g`, 10, y); y += lineHeight;
    doc.text(`Grassi: ${schema.grassi}g`, 10, y); y += lineHeight;
    doc.text(`Proteine: ${schema.proteine}g`, 10, y); y += lineHeight;
    doc.text(`Acqua: ${schema.acqua}L`, 10, y); y += lineHeight * 2;

    for (const tipoPasto in schema.dettagli) {
      const dettagliPasto = schema.dettagli[tipoPasto];
      if (!dettagliPasto.opzioni?.length) continue;

      doc.setFontSize(14);
      doc.text(`Pasto: ${tipoPasto.replace(/_/g, ' ')}`, 10, y);
      y += lineHeight;

      // Intestazione tabella
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('Opzione', 10, y);
      doc.text('Alimento', 30, y);
      doc.text('Macronutriente', 90, y);
      doc.text('Grammi', 140, y);
      doc.text('Gruppo', 170, y);
      y += lineHeight;

      dettagliPasto.opzioni.forEach((opzione: any, idx: number) => {
        const opzioneLabel = opzione.nome?.trim() || `Opzione ${idx + 1}`;

        opzione.alimenti.forEach((alimento: any, alimentoIndex: number) => {
          const label = alimentoIndex === 0 ? opzioneLabel : '';

          // Controllo se è gruppo
          if (alimento.macronutriente === 'gruppo' && alimento.gruppoAlimenti?.length) {
            alimento.gruppoAlimenti.forEach((sub: any) => {
              doc.text(label, 10, y);
              doc.text(`-> ${sub.nome}`, 30, y);
              doc.text(sub.macronutriente, 90, y);
              doc.text(`${sub.grammi ?? '-'}`, 140, y);
              doc.text('Sì', 175, y);
              y += lineHeight;
            });
          } else {
            doc.text(label, 10, y);
            doc.text(alimento.nome || '-', 30, y);
            doc.text(alimento.macronutriente || '-', 90, y);
            doc.text(`${alimento.grammi ?? '-'}`, 140, y);
            doc.text('No', 175, y);
            y += lineHeight;
          }

          // Salto pagina
          if (y > 270) {
            doc.addPage();
            y = 10;
          }
        });

        // Linea divisoria tra opzioni
        doc.setDrawColor(150);
        doc.line(10, y - 2, 200, y - 2);
        y += lineHeight / 2;
      });

      y += lineHeight;
    }

    doc.save(`${schema.nome.replace(/\s+/g, '_').toLowerCase()}_schema.pdf`);
  }




}
