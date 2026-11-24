import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { IncomesPageComponent } from './incomes-page';

describe('IncomesPageComponent', () => {
  let component: IncomesPageComponent;
  let fixture: ComponentFixture<IncomesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomesPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open and close the create modal', () => {
    component.openCreateModal();
    expect(component.showFormModal()).toBe(true);
    expect(component.editingIncome()).toBeNull();
    component.closeFormModal();
    expect(component.showFormModal()).toBe(false);
  });

  it('should reject amounts lower or equal to zero', () => {
    component.openCreateModal();
    component.formAmount.set('0');
    component.submitForm();
    expect(component.formError()).toContain('mayor a cero');
  });

  it('should require a destination account', () => {
    component.openCreateModal();
    component.formAmount.set('1000');
    component.formDescription.set('Prueba');
    component.formCategoryId.set(1);
    component.submitForm();
    expect(component.formError()).toContain('cuenta de destino');
  });
});
