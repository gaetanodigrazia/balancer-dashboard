import { Component, OnInit } from '@angular/core';
import { TraceService } from '../../services/trace.service';

@Component({
  selector: 'app-archived',
  templateUrl: './archived.component.html',
  styleUrl: './archived.component.css'
})
export class ArchivedComponent implements OnInit {
  archived: any[] = [];
  groupedArchived: { [key: string]: any[] } = {};

  constructor(private traceService: TraceService) {}

  ngOnInit(): void {
    this.traceService.getArchived().subscribe(data => {
      this.archived = data;
      this.groupedArchived = this.groupBy(this.archived);
    });
  }

  groupBy(events: any[]): { [key: string]: any[] } {
    return events.reduce((acc, e) => {
      const key = `${e.severity} | ${e.path}`;
      acc[key] = acc[key] || [];
      acc[key].push(e);
      return acc;
    }, {} as { [key: string]: any[] });
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
