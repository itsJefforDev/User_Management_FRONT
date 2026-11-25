import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportsPageComponent } from './reports-page';
import { ReportService } from '../../../../core/services/report.service';

describe('ReportsPageComponent', () => {
  let component: ReportsPageComponent;
  let fixture: ComponentFixture<ReportsPageComponent>;
  let reportService: ReportService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsPageComponent);
    component = fixture.componentInstance;
    reportService = TestBed.inject(ReportService);
    fixture.detectChanges();
  });

  it('should create and render the report title', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Resumen financiero');
  });

  it('should switch the report type', () => {
    component.selectType('EXPENSES');
    fixture.detectChanges();
    expect(reportService.reportType()).toBe('EXPENSES');
    expect(fixture.nativeElement.textContent).toContain('Reporte de gastos');
  });

  it('should toggle printing mode when exporting to PDF', () => {
    vi.useFakeTimers();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    component.exportPdf();
    expect(component.printing()).toBe(true);
    vi.advanceTimersByTime(100);
    expect(printSpy).toHaveBeenCalled();
    expect(component.printing()).toBe(false);
    vi.useRealTimers();
  });
});
