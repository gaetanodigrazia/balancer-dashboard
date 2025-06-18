import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Chart, { ChartOptions } from 'chart.js/auto';

@Component({
  selector: 'app-spese-mensili',
  templateUrl: './spese-mensili.component.html',
  styleUrls: ['./spese-mensili.component.css']
})
export class SpeseMensiliComponent implements AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  chart!: Chart;
  chartType: 'bar' | 'line' = 'bar';

  budget: number | null = null;

  labels: string[] = [];
  values: number[] = [];

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    this.caricaDati();
  }

  caricaDati() {
    this.http.get<any[]>('/scontrini').subscribe({
      next: (scontrini) => {
        const spesePerMese: Record<string, number> = {};
        scontrini.forEach(s => {
          const mese = s.data.slice(0, 7);
          spesePerMese[mese] = (spesePerMese[mese] || 0) + s.totale;
        });
        this.labels = Object.keys(spesePerMese).sort();
        this.values = this.labels.map(m => spesePerMese[m]);
        this.renderChart();
      },
      error: (err) => {
        console.error('Errore caricamento dati:', err);
      }
    });
  }

  renderChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    // Dati del dataset spese
    const datasets: any[] = [{
      label: 'Spese Mensili (€)',
      data: this.values,
      backgroundColor: this.chartType === 'bar' ? 'rgba(75, 192, 192, 0.7)' : undefined,
      borderColor: this.chartType === 'line' ? 'rgba(75, 192, 192, 1)' : undefined,
      fill: false,
      tension: 0.1,
    }];

    // Se budget è impostato, aggiungi linea orizzontale come dataset
    if (this.budget !== null && !isNaN(this.budget)) {
      datasets.push({
        label: 'Budget Mensile (€)',
        data: new Array(this.values.length).fill(this.budget),
        borderColor: 'rgba(255, 99, 132, 0.8)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        type: 'line',
        pointRadius: 0,
        tension: 0,
      });
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: this.chartType,
      data: {
        labels: this.labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      } as ChartOptions
    });
  }

  cambiaTipo(tipo: 'bar' | 'line') {
    this.chartType = tipo;
    this.renderChart();
  }

  onBudgetChange(value: string) {
    const n = Number(value);
    this.budget = isNaN(n) ? null : n;
    this.renderChart();
  }
}
