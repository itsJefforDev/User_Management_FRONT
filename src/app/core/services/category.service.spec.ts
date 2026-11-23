import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { AuthService } from './auth.service';
import { Category, CreateCategoryRequest } from '../models/category.model';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Comida',
      description: 'Gastos de alimentación',
      type: 'EXPENSE',
      active: true,
    },
    {
      id: 2,
      name: 'Salario',
      description: 'Ingreso mensual',
      type: 'INCOME',
      active: true,
    },
    {
      id: 3,
      name: 'Transferencias',
      description: 'Entre cuentas',
      type: 'BOTH',
      active: false,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CategoryService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            token: () => 'mock-token',
            isAuthenticated: () => true,
          },
        },
      ],
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
    expect(service.allCategories().length).toBeGreaterThan(0);
  });

  it('debe calcular métricas correctamente', () => {
    expect(service.totalCategories()).toBeGreaterThan(0);
    expect(service.activeCategoriesCount()).toBeGreaterThan(0);
    expect(service.expenseCategoriesCount()).toBeGreaterThan(0);
  });

  it('debe filtrar categorías por término de búsqueda', () => {
    service.searchQuery.set('Salario');
    const filtered = service.filteredCategories();
    expect(filtered.some((c) => c.name.includes('Salario'))).toBeTrue();

    service.searchQuery.set('no-existe-xyz');
    expect(service.filteredCategories().length).toBe(0);
  });

  it('debe filtrar categorías por tipo', () => {
    service.searchQuery.set('');
    service.typeFilter.set('EXPENSE');
    const filtered = service.filteredCategories();
    expect(filtered.every((c) => c.type === 'EXPENSE')).toBeTrue();
  });

  it('debe cargar categorías desde el backend HTTP exitosamente', () => {
    service.loadCategories().subscribe((cats) => {
      expect(cats.length).toBe(3);
      expect(cats[0].name).toBe('Comida');
    });

    const req = httpMock.expectOne('http://localhost:8080/userManagement/api/v1/categories');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush(mockCategories);

    expect(service.allCategories().length).toBe(3);
  });

  it('debe crear una nueva categoría vía POST', () => {
    const newReq: CreateCategoryRequest = {
      name: 'Educación',
      description: 'Cursos y libros',
      type: 'EXPENSE',
    };

    const createdCat: Category = {
      id: 99,
      name: 'Educación',
      description: 'Cursos y libros',
      type: 'EXPENSE',
      active: true,
    };

    service.create(newReq).subscribe((cat) => {
      expect(cat.id).toBe(99);
      expect(cat.name).toBe('Educación');
    });

    const req = httpMock.expectOne('http://localhost:8080/userManagement/api/v1/categories');
    expect(req.request.method).toBe('POST');
    req.flush(createdCat);

    expect(service.allCategories().some((c) => c.id === 99)).toBeTrue();
  });

  it('debe desactivar la categoría lógicamente al llamar delete', () => {
    // Tomar primer id de demo
    const firstId = service.allCategories()[0].id;

    service.delete(firstId).subscribe(() => {
      const updated = service.allCategories().find((c) => c.id === firstId);
      expect(updated?.active).toBeFalse();
    });

    const req = httpMock.expectOne(
      `http://localhost:8080/userManagement/api/v1/categories/${firstId}`
    );
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
