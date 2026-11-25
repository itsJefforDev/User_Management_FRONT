import { TestBed } from '@angular/core/testing';
import { ReportTableComponent } from './report-table';
import { ReportColumn, ReportRow } from '../../../../core/models/report.model';

describe('ReportTableComponent', () => {
  const columns: ReportColumn[] = [
    { key: 'name', label: 'Nombre', format: 'text' },
    { key: 'amount', label: 'Valor', format: 'currency', align: 'right' },
  ];
  const makeRows = (n: number): ReportRow[] =>
    Array.from({ length: n }, (_, i) => ({ name: `Fila ${i + 1}`, amount: 1000 * (i + 1) }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ReportTableComponent] }).compileComponents();
  });

  it('should create and render headers and rows', () => {
    const fixture = TestBed.createComponent(ReportTableComponent);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', makeRows(2));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nombre');
    expect(fixture.nativeElement.textContent).toContain('Fila 2');
  });

  it('should paginate and show everything when showAll is true', () => {
    const fixture = TestBed.createComponent(ReportTableComponent);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', makeRows(20));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(15);

    fixture.componentRef.setInput('showAll', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(20);
  });

  it('should show empty state', () => {
    const fixture = TestBed.createComponent(ReportTableComponent);
    fixture.componentRef.setInput('columns', columns);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay datos');
  });
});
