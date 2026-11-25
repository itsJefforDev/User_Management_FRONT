import { Component, computed, input, signal } from '@angular/core';
import { ReportColumn, ReportRow, formatReportValue } from '../../../../core/models/report.model';
import { ButtonComponent } from '../../atoms/button/button';

@Component({
  selector: 'app-report-table',
  imports: [ButtonComponent],
  templateUrl: './report-table.html',
  styleUrl: './report-table.scss',
})
export class ReportTableComponent {
  columns = input<ReportColumn[]>([]);
  rows = input<ReportRow[]>([]);
  loading = input<boolean>(false);
  /** Muestra todas las filas sin paginar (se usa al imprimir). */
  showAll = input<boolean>(false);
  pageSize = input<number>(15);

  protected readonly page = signal<number>(1);
  protected formatValue = formatReportValue;

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.rows().length / this.pageSize()))
  );
  protected readonly safePage = computed(() => Math.min(this.page(), this.totalPages()));

  protected readonly visibleRows = computed(() => {
    if (this.showAll()) return this.rows();
    const start = (this.safePage() - 1) * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  protected readonly pageStart = computed(() =>
    this.rows().length === 0 ? 0 : (this.safePage() - 1) * this.pageSize() + 1
  );
  protected readonly pageEnd = computed(() =>
    Math.min(this.safePage() * this.pageSize(), this.rows().length)
  );

  protected prev() { this.page.set(Math.max(1, this.safePage() - 1)); }
  protected next() { this.page.set(Math.min(this.totalPages(), this.safePage() + 1)); }

  protected isNegative(col: ReportColumn, value: unknown): boolean {
    return col.format === 'currency' && typeof value === 'number' && value < 0;
  }
}
