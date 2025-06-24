import { Component, EventEmitter, OnInit, Output, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SchemaBrief, SchemaNutrizionaleService } from 'src/app/services/schema-nutrizionale.service';

declare var bootstrap: any;

@Component({
  selector: 'app-riepilogo-schemi',
  templateUrl: './riepilogo-schemi.component.html',
  styleUrls: ['./riepilogo-schemi.component.css']
})
export class RiepilogoSchemiComponent implements OnInit, AfterViewInit {
  schemi: SchemaBrief[] = [];
  schemiGlobali: SchemaBrief[] = []; // ✅ aggiunto
  selectedSchema: SchemaBrief | null = null;
  anteprimaSchema: any = null;
  modalInstance: any = null;
  paginaCorrente: string = '';
  loading = false;
  progress: number = 0;
  schemaDaEliminare: SchemaBrief | null = null;
  modalElimina: any = null;

  @Output() selezionaSchema = new EventEmitter<SchemaBrief>();
  @Output() cambiaTab = new EventEmitter<'gestione-schema' | 'gestione-pasti'>();

  constructor(
    private schemaService: SchemaNutrizionaleService,
    private router: Router
  ) { }

  ngOnInit() {
    this.paginaCorrente = this.router.url;
    this.caricaSchemi();
    this.caricaSchemiGlobali(); // ✅ aggiunto
  }

  ngAfterViewInit(): void {
    const modalElement = document.getElementById('anteprimaModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
    }
    this.modalInstance = new bootstrap.Modal(document.getElementById('anteprimaModal'));
    this.modalElimina = new bootstrap.Modal(document.getElementById('confermaEliminazioneModal'));
  }

  isFromGestioneSchema(): boolean {
    return this.paginaCorrente.includes('/gestione-schema');
  }

  isFromGestionePasti(): boolean {
    return this.paginaCorrente.includes('/gestione-pasti');
  }

  isFromEsporta(): boolean {
    return this.paginaCorrente.includes('/esporta');
  }

  isFromModelli(): boolean {
    return this.paginaCorrente.includes('/modelli');
  }

  isFromRiepilogo(): boolean {
    return this.paginaCorrente.includes('/riepilogo');
  }

  caricaSchemi() {
    this.loading = true;
    this.simulaProgressBar(20000);

    const isModelli = this.isFromModelli();
    const apiCall = isModelli
      ? this.schemaService.getModelli()
      : this.schemaService.getSchemiDisponibili();

    apiCall.subscribe({
      next: (data) => {
        this.schemi = data;
        this.loading = false;
        this.progress = 100;
      },
      error: (err) => {
        console.error('Errore nel caricamento degli schemi:', err);
        this.schemi = [];
        this.loading = false;
        this.progress = 0;
      }
    });
  }

  caricaSchemiGlobali() {
    this.schemaService.getSchemiGlobali().subscribe({
      next: (data) => this.schemiGlobali = data,
      error: (err) => {
        console.error('Errore nel caricamento degli schemi globali:', err);
        this.schemiGlobali = [];
      }
    });
  }

  private simulaProgressBar(durataMs: number) {
    this.progress = 0;
    const intervallo = 200;
    const incrementiTotali = durataMs / intervallo;
    const incremento = 100 / incrementiTotali;

    const timer = setInterval(() => {
      if (this.progress >= 100 || !this.loading) {
        clearInterval(timer);
      } else {
        this.progress = Math.min(this.progress + incremento, 100);
      }
    }, intervallo);
  }

  seleziona(s: SchemaBrief) {
    this.selectedSchema = s;
    this.selezionaSchema.emit(s);
  }

  modificaSchema(schema: SchemaBrief) {
    this.router.navigate(['/gestione-schema', schema.id]);
  }

  eliminaSchema(schema: SchemaBrief) {
    if (!confirm(`Sei sicuro di voler eliminare lo schema "${schema.nome}"?`)) {
      return;
    }

    this.loading = true;
    this.schemaService.eliminaSchema(schema.id).subscribe({
      next: () => {
        this.schemi = this.schemi.filter(s => s.id !== schema.id);
        this.selectedSchema = null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore durante eliminazione:', err);
        this.loading = false;
        alert('Errore durante l\'eliminazione dello schema.');
      }
    });
  }

  modificaPasti(schema: SchemaBrief) {
    this.router.navigate(['/gestione-pasti', schema.id]);
  }

  clonaSchema(schema: SchemaBrief) {
    if (!confirm(`Vuoi clonare lo schema "${schema.nome}"?`)) return;

    this.loading = true;
    this.schemaService.clonaSchema(schema.id).subscribe({
      next: (res) => {
        this.loading = false;
        alert(res.message || 'Clonazione completata');
        this.caricaSchemi();
      },
      error: (err) => {
        this.loading = false;
        console.error('Errore durante clonazione:', err);
        alert('Errore durante la clonazione dello schema.');
      }
    });
  }

  esportaSchemaPdf(schemaBrief: SchemaBrief) {
    this.schemaService.getSchemaById(schemaBrief.id).subscribe({
      next: (schema) => this.generaPdf(schema),
      error: (err) => console.error('Errore nel caricamento schema per PDF:', err)
    });
  }

  mostraAnteprima(schema: SchemaBrief) {
    this.schemaService.getSchemaById(schema.id).subscribe({
      next: (detailedSchema) => {
        this.anteprimaSchema = detailedSchema;
        this.modalInstance?.show();
      },
      error: (err) => console.error('Errore nel caricamento anteprima:', err)
    });
  }

  getPastiKeys(schema: any): string[] {
    return schema?.dettagli ? Object.keys(schema.dettagli) : [];
  }

  formatPastoKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

    drawBackground();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30);
    doc.text(`Schema Nutrizionale – ${schema.nome}`, margin, y);
    y += 30;

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

    Object.entries(schema.dettagli ?? {}).forEach(([pasto, detRaw]) => {
      const det = detRaw as { opzioni: any[] };
      if (!det.opzioni?.length) return;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 80, 160);
      doc.text(this.formatPastoKey(pasto), margin, y);
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
        didDrawPage: (data) => {
          if (data.pageNumber > 1) drawBackground();
        }
      });

      y = (doc as any).lastAutoTable.finalY + 30;
    });

    doc.save(`${schema.nome.replace(/\s+/g, '_').toLowerCase()}_schema.pdf`);
  }

  apriModaleEliminazione(schema: SchemaBrief) {
    this.schemaDaEliminare = schema;
    this.modalElimina?.show();
  }

  confermaEliminazione() {
    if (!this.schemaDaEliminare) return;

    this.loading = true;
    this.schemaService.eliminaSchema(this.schemaDaEliminare.id).subscribe({
      next: () => {
        this.schemi = this.schemi.filter(s => s.id !== this.schemaDaEliminare!.id);
        this.schemaDaEliminare = null;
        this.loading = false;
        this.modalElimina?.hide();
      },
      error: (err) => {
        console.error('Errore durante eliminazione:', err);
        this.loading = false;
        alert('Errore durante l\'eliminazione dello schema.');
      }
    });
  }
}
