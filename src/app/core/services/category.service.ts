import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../models/category.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:8080/userManagement/api/v1/categories';

  // Categorías de demostración/contingencia para modo local
  private readonly fallbackCategories: Category[] = [
    {
      id: 1,
      name: 'Alimentación y Comida',
      description: 'Supermercado, restaurantes, cafés y abarrotes',
      type: 'EXPENSE',
      active: true,
      createdAt: '2026-01-10T10:00:00',
      updatedAt: '2026-02-15T15:30:00',
    },
    {
      id: 2,
      name: 'Transporte y Movilidad',
      description: 'Gasolina, transporte público, taxis y mantenimiento vehicular',
      type: 'EXPENSE',
      active: true,
      createdAt: '2026-01-15T11:20:00',
      updatedAt: '2026-02-20T09:15:00',
    },
    {
      id: 3,
      name: 'Salario y Nómina',
      description: 'Ingresos fijos por relación laboral y contratos',
      type: 'INCOME',
      active: true,
      createdAt: '2026-01-01T08:00:00',
      updatedAt: '2026-02-01T08:00:00',
    },
    {
      id: 4,
      name: 'Ventas y Negocios',
      description: 'Ingresos extraordinarios por servicios y comercio independiente',
      type: 'INCOME',
      active: true,
      createdAt: '2026-01-12T14:00:00',
      updatedAt: '2026-02-18T16:00:00',
    },
    {
      id: 5,
      name: 'Transferencias y Ajustes',
      description: 'Movimientos entre cuentas propias, reintegros o cuadres de caja',
      type: 'BOTH',
      active: true,
      createdAt: '2026-01-20T09:30:00',
      updatedAt: '2026-02-25T11:45:00',
    },
    {
      id: 6,
      name: 'Servicios Públicos e Internet',
      description: 'Agua, luz, gas, telecomunicaciones y suscripciones corporativas',
      type: 'EXPENSE',
      active: true,
      createdAt: '2026-01-22T12:00:00',
      updatedAt: '2026-03-01T10:00:00',
    },
    {
      id: 7,
      name: 'Entretenimiento y Ocio',
      description: 'Cine, salidas, recreación y eventos sociales',
      type: 'EXPENSE',
      active: false,
      createdAt: '2026-02-05T17:15:00',
      updatedAt: '2026-03-02T13:20:00',
    },
  ];

  // Estado reactivo con Signals
  private readonly categoriesSignal = signal<Category[]>(this.fallbackCategories);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Filtros reactivos
  readonly searchQuery = signal<string>('');
  readonly typeFilter = signal<string>('ALL');
  readonly statusFilter = signal<string>('ALL');

  // Señales públicas de solo lectura
  readonly allCategories = this.categoriesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computados reactivos para la UI
  readonly filteredCategories = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const type = this.typeFilter().toUpperCase();
    const status = this.statusFilter().toUpperCase();

    return this.categoriesSignal().filter((cat) => {
      const matchesSearch =
        !q ||
        cat.name.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q)) ||
        cat.type.toLowerCase().includes(q);

      const matchesType = type === 'ALL' || cat.type.toUpperCase() === type;

      const matchesStatus =
        status === 'ALL' ||
        (status === 'ACTIVE' && cat.active) ||
        (status === 'INACTIVE' && !cat.active);

      return matchesSearch && matchesType && matchesStatus;
    });
  });

  readonly totalCategories = computed(() => this.categoriesSignal().length);

  readonly activeCategoriesCount = computed(
    () => this.categoriesSignal().filter((c) => c.active).length
  );

  readonly inactiveCategoriesCount = computed(
    () => this.categoriesSignal().filter((c) => !c.active).length
  );

  readonly expenseCategoriesCount = computed(
    () => this.categoriesSignal().filter((c) => c.type.toUpperCase() === 'EXPENSE').length
  );

  readonly incomeCategoriesCount = computed(
    () => this.categoriesSignal().filter((c) => c.type.toUpperCase() === 'INCOME').length
  );

  readonly bothCategoriesCount = computed(
    () => this.categoriesSignal().filter((c) => c.type.toUpperCase() === 'BOTH').length
  );

  /**
   * Genera los headers con el Bearer token actual.
   */
  private getHeaders(): { headers: HttpHeaders } {
    const token = this.authService.token();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  /**
   * Carga todas las categorías desde el backend: GET /api/v1/categories
   */
  loadCategories(): Observable<Category[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<Category[]>(this.apiUrl, this.getHeaders()).pipe(
      tap((categories) => {
        if (categories && categories.length > 0) {
          this.categoriesSignal.set(categories);
        }
      }),
      catchError((err) => {
        // En caso de que el backend no esté respondiendo, conservamos la data demo local
        console.warn('Backend categories endpoint no respondió, usando datos locales:', err.message);
        return of(this.categoriesSignal());
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Obtiene una categoría por ID: GET /api/v1/categories/{id}
   */
  getCategoryById(id: number): Observable<Category> {
    return this.http
      .get<Category>(`${this.apiUrl}/${id}`, this.getHeaders())
      .pipe(
        catchError(() => {
          const found = this.categoriesSignal().find((c) => c.id === id);
          if (found) return of(found);
          return throwError(() => new Error(`Categoría con id ${id} no encontrada`));
        })
      );
  }

  /**
   * Obtiene categorías por tipo: GET /api/v1/categories/type/{type}
   */
  getCategoriesByType(type: string): Observable<Category[]> {
    return this.http
      .get<Category[]>(`${this.apiUrl}/type/${type}`, this.getHeaders())
      .pipe(
        catchError(() => {
          const list = this.categoriesSignal().filter(
            (c) => c.type.toUpperCase() === type.toUpperCase()
          );
          return of(list);
        })
      );
  }

  /**
   * Crea una nueva categoría: POST /api/v1/categories
   */
  create(request: CreateCategoryRequest): Observable<Category> {
    this.loadingSignal.set(true);

    return this.http
      .post<Category>(this.apiUrl, request, this.getHeaders())
      .pipe(
        catchError(() => {
          // Fallback local
          const newCategory: Category = {
            id: Date.now(),
            name: request.name.trim(),
            description: request.description?.trim() || '',
            type: request.type.toUpperCase(),
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return of(newCategory);
        }),
        tap((created) => {
          this.categoriesSignal.update((cats) => [created, ...cats]);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * Actualiza una categoría existente: PUT /api/v1/categories/{id}
   */
  update(id: number, request: UpdateCategoryRequest): Observable<Category> {
    this.loadingSignal.set(true);

    return this.http
      .put<Category>(`${this.apiUrl}/${id}`, request, this.getHeaders())
      .pipe(
        catchError(() => {
          // Fallback local
          const existing = this.categoriesSignal().find((c) => c.id === id);
          const updatedCategory: Category = {
            id,
            name: request.name.trim(),
            description: request.description !== undefined ? request.description.trim() : existing?.description,
            type: request.type ? request.type.toUpperCase() : existing?.type || 'EXPENSE',
            active: request.active !== undefined ? request.active : (existing?.active ?? true),
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return of(updatedCategory);
        }),
        tap((updated) => {
          this.categoriesSignal.update((cats) =>
            cats.map((c) => (c.id === id ? { ...c, ...updated } : c))
          );
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * Desactivación lógica (Eliminación suave): DELETE /api/v1/categories/{id}
   */
  delete(id: number): Observable<void> {
    this.loadingSignal.set(true);

    return this.http
      .delete<void>(`${this.apiUrl}/${id}`, this.getHeaders())
      .pipe(
        catchError(() => of(undefined as void)),
        tap(() => {
          // El backend realiza desactivación lógica (active = false)
          this.categoriesSignal.update((cats) =>
            cats.map((c) => (c.id === id ? { ...c, active: false } : c))
          );
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * Alterna el estado activo/inactivo de una categoría
   */
  toggleStatus(id: number): Observable<Category> {
    const existing = this.categoriesSignal().find((c) => c.id === id);
    if (!existing) {
      return throwError(() => new Error('Categoría no encontrada'));
    }

    const newActiveState = !existing.active;
    const updateRequest: UpdateCategoryRequest = {
      name: existing.name,
      description: existing.description,
      type: existing.type,
      active: newActiveState,
    };

    return this.update(id, updateRequest);
  }
}
