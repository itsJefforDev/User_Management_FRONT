import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportService } from './report.service';
import { AuthService } from './auth.service';
import { ExpenseService } from './expense.service';

describe('ReportService', () => {
  let service: ReportService;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportService);
    authService = TestBed.inject(AuthService);
    service.applyPreset('ALL');
  });

  const setRole = (name: string) =>
    authService.currentUser.set({
      token: 't',
      role: [{ id: 1, name, permissions: [] }],
      email: 'test@empresa.com',
      name: 'Test',
    });

  it('should be created with the summary report by default', () => {
    expect(service).toBeTruthy();
    expect(service.report().type).toBe('SUMMARY');
  });

  it('should compute available = income - expenses - savings contributions', () => {
    const [income, expense, saved, available] = service.report().kpis.map((k) => Number(k.value));
    expect(available).toBe(income - expense - saved);
  });

  it('should match the expenses report total with the expense data', () => {
    service.setReportType('EXPENSES');
    const expected = TestBed.inject(ExpenseService)
      .allExpenses()
      .reduce((acc, e) => acc + Number(e.amount), 0);
    expect(service.report().kpis[0].value).toBe(expected);
    expect(service.report().rows.length).toBe(TestBed.inject(ExpenseService).allExpenses().length);
  });

  it('should restrict date range with presets', () => {
    service.applyPreset('MONTH');
    expect(service.dateFrom()).not.toBe('');
    expect(service.preset()).toBe('MONTH');
    service.setDateFrom('2026-01-01');
    expect(service.preset()).toBe('CUSTOM');
  });

  it('should not allow standard users to open admin reports', () => {
    setRole('ROLE_USER');
    service.setReportType('USERS');
    expect(service.reportType()).toBe('SUMMARY');
    expect(service.availableReports().some((r) => r.adminOnly)).toBe(false);
  });

  it('should allow administrators to open admin reports', () => {
    setRole('ADMIN');
    service.setReportType('AUDIT');
    expect(service.reportType()).toBe('AUDIT');
    expect(service.report().type).toBe('AUDIT');
    expect(service.availableReports().length).toBe(8);
  });

  it('should filter movements by type', () => {
    service.setReportType('MOVEMENTS');
    service.movementFilter.set('INCOME');
    expect(service.report().rows.every((r) => r['kind'] === 'Ingreso')).toBe(true);
  });
});
