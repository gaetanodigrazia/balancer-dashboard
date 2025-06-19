import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SchemaBrief } from '../services/schema-nutrizionale.service';
import { SchemaNutrizionaleService } from '../services/schema-nutrizionale.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';



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
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = 40;

  const paleBlue: [number, number, number] = [235, 245, 255];

  const drawBackground = () => {
    doc.setFillColor(...paleBlue);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  // ❗Disegna lo sfondo solo qui (prima pagina)
  drawBackground();

  // Titolo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30);
  doc.text(`Schema Nutrizionale – ${schema.nome}`, margin, y);
  y += 30;

  // Dati generali
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const infoFields = [
    `Calorie: ${schema.calorie ?? '-'}`,
    `Carboidrati: ${schema.carboidrati ?? '-'}g`,
    `Grassi: ${schema.grassi ?? '-'}g`,
    `Proteine: ${schema.proteine ?? '-'}g`,
    `Acqua: ${schema.acqua ?? '-'}L`
  ];
  infoFields.forEach(line => {
    doc.text(line, margin, y);
    y += 18;
  });

  y += 20;

  // Tabelle per pasto
  Object.entries(schema.dettagli ?? {}).forEach(([pasto, detRaw]) => {
    const det = detRaw as { opzioni: any[] };
    if (!det.opzioni?.length) return;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 80, 160);
    doc.text(pasto.replace(/_/g, ' ').toUpperCase(), margin, y);
    y += 24;

    const body = det.opzioni.flatMap((opz: any, idx: number) => {
      const label = opz.nome || `Opzione ${idx + 1}`;
      return opz.alimenti.map((al: any, ai: number) => {
        const isGroup = al.macronutriente === 'gruppo';
        const name = ai === 0 ? label : '';
        return [
          name,
          al.nome ?? '-',
          al.macronutriente ?? '-',
          al.grammi ?? '-',
          isGroup ? 'Sì' : 'No'
        ];
      });
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Opzione', 'Alimento', 'Macronutriente', 'Grammi', 'Gruppo']],
      body,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 6,
        textColor: 50
      },
      headStyles: {
        fillColor: [60, 120, 180],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 250, 255]
      },
      // Sfondo SOLO nelle pagine successive
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawBackground();
        }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 30;
  });

  doc.save(`${schema.nome.replace(/\s+/g, '_').toLowerCase()}_schema.pdf`);
}




}
