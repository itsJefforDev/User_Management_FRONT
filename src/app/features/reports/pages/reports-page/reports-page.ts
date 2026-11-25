import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MainLayoutComponent } from '../../../../shared/ui/templates/main-layout/main-layout';
import { ReportTableComponent } from '../../../../shared/ui/organisms/report-table/report-table';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { ReportService } from '../../../../core/services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  REPORT_PRESETS,
  ReportFilterKey,
  ReportKpi,
  ReportPreset,
  ReportType,
  formatReportValue,
  toExportValue,
} from '../../../../core/models/report.model';
import { todayISO } from '../../../../core/models/expense.model';
import { downloadCsv } from '../../../../core/utils/csv-export';

@Component({
  selector: 'app-reports-page',
  imports: [MainLayoutComponent, ReportTableComponent, ButtonComponent, BadgeComponent],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
})
export class ReportsPageComponent implements OnInit {
  protected readonly reportService = inject(ReportService);
  protected readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  protected readonly presets = REPORT_PRESETS;
  protected formatValue = formatReportValue;

  /** Vista del reporte actual. */
  protected readonly view = computed(() => this.reportService.report());

  /** Al imprimir se muestran todas las filas de la tabla. */
  readonly printing = signal<boolean>(false);

  readonly generatedAt = new Date().toLocaleString('es-CO');
  protected readonly userName = computed(() => this.authService.userDisplayName());

  protected readonly evolutionMax = computed(() =>
    Math.max(0, ...this.view().evolution.flatMap((p) => [p.income, p.expense]))
  );

  ngOnInit(): void {
    this.reload();
  }

  reload() {
    this.reportService.loadAll().subscribe();
  }

  protected hasFilter(key: ReportFilterKey): boolean {
    return this.reportService.currentInfo().filters.includes(key);
  }

  protected pct(value: number): number {
    const max = this.evolutionMax();
    return max > 0 ? (value / max) * 100 : 0;
  }

  protected toneClass(kpi: ReportKpi): string {
    switch (kpi.tone) {
      case 'positive': return 'text-emerald-600';
      case 'negative': return 'text-rose-600';
      default: return 'text-slate-900';
    }
  }

  // ─── Handlers de filtros ─────────────────────────────────────────────────
  selectType(type: ReportType) { this.reportService.setReportType(type); }
  applyPreset(preset: ReportPreset) { this.reportService.applyPreset(preset); }
  onDateFrom(e: Event) { this.reportService.setDateFrom((e.target as HTMLInputElement).value); }
  onDateTo(e: Event) { this.reportService.setDateTo((e.target as HTMLInputElement).value); }
  onAccount(e: Event) { this.reportService.accountFilter.set((e.target as HTMLSelectElement).value); }
  onCategory(e: Event) { this.reportService.categoryFilter.set((e.target as HTMLSelectElement).value); }
  onStatus(e: Event) { this.reportService.statusFilter.set((e.target as HTMLSelectElement).value); }
  onMovement(e: Event) {
    this.reportService.movementFilter.set(
      (e.target as HTMLSelectElement).value as 'ALL' | 'INCOME' | 'EXPENSE'
    );
  }

  // ─── Exportación (HU-29) ─────────────────────────────────────────────────
  exportCsv() {
    const view = this.view();
    if (view.rows.length === 0) {
      this.notificationService.showWarning('No hay datos para exportar con los filtros actuales.', 'Reporte vacío');
      return;
    }

    downloadCsv(
      `reporte-${view.type.toLowerCase()}-${todayISO()}.csv`,
      view.columns.map((c) => c.label),
      view.rows.map((row) => view.columns.map((c) => toExportValue(row[c.key], c.format)))
    );
    this.notificationService.showSuccess(
      `Se descargó "${view.title}" en formato CSV (compatible con Excel).`,
      'Reporte Exportado'
    );
  }

  /** Imprime o guarda como PDF desde el diálogo del navegador. */
  exportPdf() {
    this.printing.set(true);
    setTimeout(() => {
      window.print();
      this.printing.set(false);
    }, 80);
  }
}
