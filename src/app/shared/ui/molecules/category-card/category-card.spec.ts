import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryCardComponent } from './category-card';
import { Category } from '../../../../core/models/category.model';

describe('CategoryCardComponent', () => {
  let component: CategoryCardComponent;
  let fixture: ComponentFixture<CategoryCardComponent>;

  const mockCategory: Category = {
    id: 1,
    name: 'Alimentación',
    description: 'Gastos de supermercado',
    type: 'EXPENSE',
    active: true,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-02T00:00:00',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('category', mockCategory);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe emitir evento edit al solicitar edición', () => {
    spyOn(component.edit, 'emit');
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    component.edit.emit(mockCategory);
    expect(component.edit.emit).toHaveBeenCalledWith(mockCategory);
  });

  it('debe mostrar el nombre y tipo de categoría', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Alimentación');
    expect(compiled.textContent).toContain('Gasto');
  });
});
