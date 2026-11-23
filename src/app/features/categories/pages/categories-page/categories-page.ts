import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../../../../shared/ui/templates/main-layout/main-layout';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';
import { InputComponent } from '../../../../shared/ui/atoms/input/input';
import { FormFieldComponent } from '../../../../shared/ui/molecules/form-field/form-field';
import { CategoryCardComponent } from '../../../../shared/ui/molecules/category-card/category-card';
import { CategoryService } from '../../../../core/services/category.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Category,
  CategoryType,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../../../core/models/category.model';

@Component({
  selector: 'app-categories-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MainLayoutComponent,
    BadgeComponent,
    ButtonComponent,
    InputComponent,
    FormFieldComponent,
    CategoryCardComponent,
  ],
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.scss',
})
export class CategoriesPageComponent implements OnInit {
  protected readonly categoryService = inject(CategoryService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  // Modal Visibility Signals
  readonly showCreateModal = signal<boolean>(false);
  readonly showEditModal = signal<boolean>(false);
  readonly showDeleteModal = signal<boolean>(false);

  // Form State for Creating
  readonly createName = signal<string>('');
  readonly createDescription = signal<string>('');
  readonly createType = signal<CategoryType>('EXPENSE');
  readonly createError = signal<string | null>(null);

  // Form State for Editing
  readonly editingCategory = signal<Category | null>(null);
  readonly editName = signal<string>('');
  readonly editDescription = signal<string>('');
  readonly editType = signal<CategoryType>('EXPENSE');
  readonly editActive = signal<boolean>(true);
  readonly editError = signal<string | null>(null);

  // Delete/Deactivate Target
  readonly deletingCategory = signal<Category | null>(null);

  ngOnInit(): void {
    // Si no es admin, adminGuard ya interceptará, pero reforzamos reactivamente
    if (!this.authService.isAdmin()) {
      this.notificationService.showWarning(
        'Acceso Restringido: El módulo de categorías es exclusivo para Administradores.',
        'Permisos Insuficientes'
      );
      this.router.navigate(['/user'], { queryParams: { accessDenied: 'true' } });
      return;
    }

    this.categoryService.loadCategories().subscribe();
  }

  // ─── FILTERS ────────────────────────────────────────────────────────
  setSearch(query: string) {
    this.categoryService.searchQuery.set(query);
  }

  setTypeFilter(type: string) {
    this.categoryService.typeFilter.set(type);
  }

  setStatusFilter(status: string) {
    this.categoryService.statusFilter.set(status);
  }

  resetFilters() {
    this.categoryService.searchQuery.set('');
    this.categoryService.typeFilter.set('ALL');
    this.categoryService.statusFilter.set('ALL');
  }

  // ─── CREATE MODAL ACTIONS ───────────────────────────────────────────
  openCreateModal() {
    this.createName.set('');
    this.createDescription.set('');
    this.createType.set('EXPENSE');
    this.createError.set(null);
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.createError.set(null);
  }

  submitCreate() {
    const name = this.createName().trim();
    if (!name) {
      this.createError.set('El nombre de la categoría es requerido.');
      return;
    }
    if (name.length > 100) {
      this.createError.set('El nombre no puede exceder los 100 caracteres.');
      return;
    }

    const payload: CreateCategoryRequest = {
      name,
      description: this.createDescription().trim() || undefined,
      type: this.createType(),
    };

    this.categoryService.create(payload).subscribe({
      next: (cat) => {
        this.notificationService.showSuccess(
          `Categoría "${cat.name}" creada exitosamente con tipo ${cat.type}.`,
          'Categoría Registrada'
        );
        this.closeCreateModal();
      },
      error: (err) => {
        this.createError.set(
          err?.error?.message || 'Error al crear la categoría en el servidor.'
        );
      },
    });
  }

  // ─── EDIT MODAL ACTIONS ─────────────────────────────────────────────
  openEditModal(category: Category) {
    this.editingCategory.set(category);
    this.editName.set(category.name);
    this.editDescription.set(category.description || '');
    this.editType.set((category.type as CategoryType) || 'EXPENSE');
    this.editActive.set(category.active);
    this.editError.set(null);
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.editingCategory.set(null);
    this.editError.set(null);
  }

  submitEdit() {
    const category = this.editingCategory();
    if (!category) return;

    const name = this.editName().trim();
    if (!name) {
      this.editError.set('El nombre de la categoría es requerido.');
      return;
    }

    const payload: UpdateCategoryRequest = {
      name,
      description: this.editDescription().trim() || undefined,
      type: this.editType(),
      active: this.editActive(),
    };

    this.categoryService.update(category.id, payload).subscribe({
      next: (updated) => {
        this.notificationService.showSuccess(
          `Categoría "${updated.name}" actualizada con éxito.`,
          'Cambios Guardados'
        );
        this.closeEditModal();
      },
      error: (err) => {
        this.editError.set(
          err?.error?.message || 'Error al actualizar la categoría.'
        );
      },
    });
  }

  // ─── TOGGLE STATUS ──────────────────────────────────────────────────
  handleToggleStatus(category: Category) {
    this.categoryService.toggleStatus(category.id).subscribe({
      next: (updated) => {
        const actionLabel = updated.active ? 'activada' : 'desactivada';
        this.notificationService.showSuccess(
          `Categoría "${updated.name}" ${actionLabel} correctamente.`
        );
      },
    });
  }

  // ─── DELETE / DEACTIVATE MODAL ACTIONS ──────────────────────────────
  openDeleteModal(category: Category) {
    this.deletingCategory.set(category);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deletingCategory.set(null);
  }

  confirmDelete() {
    const category = this.deletingCategory();
    if (!category) return;

    this.categoryService.delete(category.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(
          `Categoría "${category.name}" desactivada lógicamente en el sistema.`,
          'Categoría Desactivada'
        );
        this.closeDeleteModal();
      },
      error: () => {
        this.notificationService.showError('No se pudo desactivar la categoría.');
        this.closeDeleteModal();
      },
    });
  }
}
