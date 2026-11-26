import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'sidebar_collapsed';

/**
 * Estado del sidebar del espacio de trabajo.
 * Es un servicio raíz para que el estado (expandido/colapsado) se conserve entre páginas.
 */
@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  /** Escritorio: sidebar colapsado (solo iconos). Se recuerda en localStorage. */
  readonly collapsed = signal<boolean>(this.readStored());

  /** Móvil: el sidebar se abre como panel superpuesto. */
  readonly mobileOpen = signal<boolean>(false);

  toggleCollapsed() {
    const next = !this.collapsed();
    this.collapsed.set(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(next));
    }
  }

  openMobile() { this.mobileOpen.set(true); }
  closeMobile() { this.mobileOpen.set(false); }

  private readStored(): boolean {
    return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true';
  }
}
