import { TestBed } from '@angular/core/testing';
import { ExpenseTableComponent } from './expense-table';
import { Expense } from '../../../../core/models/expense.model';

describe('ExpenseTableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseTableComponent],
    }).compileComponents();
  });

  it('should create the expense table', () => {
    const fixture = TestBed.createComponent(ExpenseTableComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render expenses when provided', () => {
    const fixture = TestBed.createComponent(ExpenseTableComponent);
    const mock: Expense[] = [
      { id: 1, amount: 50000, description: 'Mercado', date: '2026-11-01', categoryName: 'Comida', accountName: 'Ahorros', expenseType: 'VARIABLE' },
    ];
    fixture.componentRef.setInput('expenses', mock);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mercado');
    expect(fixture.nativeElement.textContent).toContain('01/11/2026');
  });

  it('should show loading state', () => {
    const fixture = TestBed.createComponent(ExpenseTableComponent);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('td').textContent).toContain('Cargando gastos...');
  });
});
