import { TestBed } from '@angular/core/testing';
import { IncomeTableComponent } from './income-table';
import { Income } from '../../../../core/models/income.model';

describe('IncomeTableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeTableComponent],
    }).compileComponents();
  });

  it('should create the income table', () => {
    const fixture = TestBed.createComponent(IncomeTableComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render incomes when provided', () => {
    const fixture = TestBed.createComponent(IncomeTableComponent);
    const mock: Income[] = [
      { id: 1, amount: 50000, description: 'Mercado', date: '2026-11-01', categoryName: 'Comida', accountName: 'Ahorros', incomeType: 'SALARY' },
    ];
    fixture.componentRef.setInput('incomes', mock);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mercado');
    expect(fixture.nativeElement.textContent).toContain('01/11/2026');
  });

  it('should show loading state', () => {
    const fixture = TestBed.createComponent(IncomeTableComponent);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('td').textContent).toContain('Cargando ingresos...');
  });
});
