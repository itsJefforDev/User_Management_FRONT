import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { CategoriesPageComponent } from './categories-page';
import { CategoryService } from '../../../../core/services/category.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Category } from '../../../../core/models/category.model';

describe('CategoriesPageComponent', () => {
  let component: CategoriesPageComponent;
  let fixture: ComponentFixture<CategoriesPageComponent>;
  let categoryService: CategoryService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockCategory: Category = {
    id: 1,
    name: 'Alimentación',
    description: 'Comida',
    type: 'EXPENSE',
    active: true,
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAdmin',
      'isAuthenticated',
      'userDisplayName',
      'userEmail',
      'userRole',
      'token',
    ]);
    authServiceSpy.isAdmin.and.returnValue(true);
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.userDisplayName.and.returnValue('Admin');
    authServiceSpy.userEmail.and.returnValue('admin@empresa.com');
    authServiceSpy.userRole.and.returnValue('ADMIN');
    authServiceSpy.token.and.returnValue('mock-token');

    await TestBed.configureTestingModule({
      imports: [CategoriesPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        CategoryService,
        NotificationService,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesPageComponent);
    component = fixture.componentInstance;
    categoryService = TestBed.inject(CategoryService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('debe crearse correctamente para el rol ADMIN', () => {
    expect(component).toBeTruthy();
  });

  it('debe abrir y cerrar el modal de creación', () => {
    component.openCreateModal();
    expect(component.showCreateModal()).toBeTrue();
    expect(component.createName()).toBe('');

    component.closeCreateModal();
    expect(component.showCreateModal()).toBeFalse();
  });

  it('debe validar que el nombre no esté vacío al crear', () => {
    component.openCreateModal();
    component.createName.set('');
    component.submitCreate();

    expect(component.createError()).toContain('requerido');
  });

  it('debe invocar categoryService.create al enviar datos válidos', () => {
    spyOn(categoryService, 'create').and.returnValue(of(mockCategory));
    component.openCreateModal();
    component.createName.set('Hogar');
    component.createType.set('EXPENSE');
    component.submitCreate();

    expect(categoryService.create).toHaveBeenCalled();
    expect(component.showCreateModal()).toBeFalse();
  });

  it('debe abrir el modal de edición con los datos de la categoría', () => {
    component.openEditModal(mockCategory);
    expect(component.showEditModal()).toBeTrue();
    expect(component.editName()).toBe('Alimentación');
    expect(component.editType()).toBe('EXPENSE');
  });

  it('debe invocar categoryService.update al guardar cambios', () => {
    spyOn(categoryService, 'update').and.returnValue(of(mockCategory));
    component.openEditModal(mockCategory);
    component.editName.set('Alimentación Modificada');
    component.submitEdit();

    expect(categoryService.update).toHaveBeenCalled();
    expect(component.showEditModal()).toBeFalse();
  });

  it('debe abrir el modal de desactivación y confirmar', () => {
    spyOn(categoryService, 'delete').and.returnValue(of(undefined as void));
    component.openDeleteModal(mockCategory);
    expect(component.showDeleteModal()).toBeTrue();
    expect(component.deletingCategory()).toEqual(mockCategory);

    component.confirmDelete();
    expect(categoryService.delete).toHaveBeenCalledWith(mockCategory.id);
    expect(component.showDeleteModal()).toBeFalse();
  });
});
