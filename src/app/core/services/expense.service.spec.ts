import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ExpenseService } from './expense.service';
import { CreateExpenseRequest } from '../models/expense.model';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8080/userManagement/api/v1/expenses';

  const request: CreateExpenseRequest = {
    amount: 25000,
    description: 'Café',
    date: '2026-11-20',
    categoryId: 1,
    accountId: 1,
    expenseType: 'VARIABLE',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExpenseService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExpenseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created with summary data', () => {
    expect(service).toBeTruthy();
    expect(service.summary().count).toBe(service.allExpenses().length);
    expect(service.summary().total).toBeGreaterThan(0);
  });

  it('should filter by search and reset page', () => {
    service.currentPage.set(2);
    service.setSearch('supermercado');
    expect(service.currentPage()).toBe(1);
    expect(service.filteredExpenses().every((e) => e.description.toLowerCase().includes('supermercado'))).toBe(true);
  });

  it('should sort by amount descending', () => {
    service.setSort('amount_desc');
    const amounts = service.filteredExpenses().map((e) => Number(e.amount));
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });

  it('should add expense returned by backend on create', () => {
    service.create(request).subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 99, ...request, categoryName: 'Comida', accountName: 'Ahorros' });
    expect(service.allExpenses().some((e) => e.id === 99)).toBe(true);
  });

  it('should fallback locally on create when backend is unreachable', () => {
    service.create(request).subscribe();
    httpMock.expectOne(apiUrl).error(new ProgressEvent('error'));
    expect(service.allExpenses().some((e) => e.description === 'Café')).toBe(true);
  });

  it('should remove expense on delete', () => {
    const id = service.allExpenses()[0].id;
    service.delete(id).subscribe();
    httpMock.expectOne(`${apiUrl}/${id}`).flush(null);
    expect(service.allExpenses().some((e) => e.id === id)).toBe(false);
  });
});
