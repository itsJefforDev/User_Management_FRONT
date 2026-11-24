import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ExpensesPageComponent } from './expenses-page';

describe('ExpensesPageComponent', () => {
  let component: ExpensesPageComponent;
  let fixture: ComponentFixture<ExpensesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open and close the create modal', () => {
    component.openCreateModal();
    expect(component.showFormModal()).toBe(true);
    expect(component.editingExpense()).toBeNull();
    component.closeFormModal();
    expect(component.showFormModal()).toBe(false);
  });

  it('should reject amounts lower or equal to zero', () => {
    component.openCreateModal();
    component.formAmount.set('0');
    component.submitForm();
    expect(component.formError()).toContain('mayor a cero');
  });

  it('should reject future dates', () => {
    component.openCreateModal();
    component.formAmount.set('1000');
    component.formDescription.set('Prueba');
    component.formDate.set('2999-01-01');
    component.submitForm();
    expect(component.formError()).toContain('posterior a hoy');
  });
});
