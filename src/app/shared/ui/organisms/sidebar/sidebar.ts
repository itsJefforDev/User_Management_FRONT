import { Component, computed, inject, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SidebarService } from '../../../../core/services/sidebar.service';
import { AvatarComponent } from '../../atoms/avatar/avatar';

interface NavItem {
  label: string;
  route: string;
  icon: string; // Atributo "d" del path SVG (estilo outline)
  adminOnly?: boolean;
}

// Rutas por defecto de cada rol (el inicio cambia según el rol)
const ICONS = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  card: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  down: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
  up: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  savings: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2zm9 3v6m-3-3h6',
  reports: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
};

/**
 * Sidebar de navegación del espacio de trabajo.
 * Desktop: expandible/colapsable (solo iconos). Móvil: panel superpuesto.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly sidebar = inject(SidebarService);
  private readonly router = inject(Router);

  /** Abre el modal de edición de perfil (lo aloja el layout para no quedar dentro del sidebar). */
  editProfile = output<void>();

  protected readonly icons = ICONS;

  protected readonly homeRoute = computed(() => (this.authService.isAdmin() ? '/admin' : '/user'));

  protected readonly navItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: 'Inicio', route: this.homeRoute(), icon: ICONS.home },
      { label: 'Usuarios', route: '/users-management', icon: ICONS.users, adminOnly: true },
      { label: 'Categorías', route: '/categories', icon: ICONS.tag, adminOnly: true },
      { label: 'Cuentas', route: '/accounts', icon: ICONS.card },
      { label: 'Gastos', route: '/expenses', icon: ICONS.down },
      { label: 'Ingresos', route: '/incomes', icon: ICONS.up },
      { label: 'Ahorros', route: '/savings', icon: ICONS.savings },
      { label: 'Reportes', route: '/reports', icon: ICONS.reports },
    ];
    return items.filter((i) => !i.adminOnly || this.authService.isAdmin());
  });

  // Clases dinámicas (en escritorio el ancho depende de si está colapsado)
  protected readonly asideClass = computed(() => {
    const width = this.sidebar.collapsed() ? 'lg:w-[4.5rem]' : 'lg:w-64';
    const mobile = this.sidebar.mobileOpen() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0';
    return `${width} ${mobile}`;
  });

  /** Oculta los textos cuando está colapsado (solo en escritorio). */
  protected readonly labelClass = computed(() => (this.sidebar.collapsed() ? 'lg:hidden' : ''));

  protected itemClass(active: boolean): string {
    const base = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-smooth cursor-pointer w-full';
    const state = active
      ? 'bg-indigo-50 text-indigo-700 font-semibold'
      : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900';
    const collapsed = this.sidebar.collapsed() ? 'lg:justify-center lg:px-0' : '';
    return `${base} ${state} ${collapsed}`;
  }

  protected logout() {
    this.sidebar.closeMobile();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  protected openProfile() {
    this.sidebar.closeMobile();
    this.editProfile.emit();
  }
}
