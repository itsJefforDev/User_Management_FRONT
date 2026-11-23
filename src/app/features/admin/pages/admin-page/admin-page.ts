import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { AccountService } from '../../../../core/services/account.service';
import { MainLayoutComponent } from '../../../../shared/ui/templates/main-layout/main-layout';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';
import { AvatarComponent } from '../../../../shared/ui/atoms/avatar/avatar';
import { formatCurrency } from '../../../../core/models/account.model';

interface AuditEntry {
  id: number;
  user: string;
  action: string;
  module: string;
  result: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED';
  ipAddress: string;
  timestamp: string;
}

@Component({
  selector: 'app-admin-page',
  imports: [
    CommonModule,
    MainLayoutComponent,
    BadgeComponent,
    ButtonComponent,
    AvatarComponent,
  ],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPageComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly userService = inject(UserService);
  protected readonly accountService = inject(AccountService);
  private readonly router = inject(Router);

  // Tab activo de la intranet
  protected readonly activeTab = signal<'overview' | 'roles' | 'audit' | 'system'>('overview');

  // Datos reactivos del administrador
  readonly adminName = computed(() => this.authService.userDisplayName());
  readonly adminEmail = computed(() => this.authService.userEmail());
  readonly adminRole = computed(() => this.authService.userRole());

  readonly formattedDate = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Registros de auditoría basados en la especificación del PDF (AuditLog)
  readonly auditLogs = signal<AuditEntry[]>([
    {
      id: 101,
      user: 'admin@empresa.com',
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      result: 'SUCCESS',
      ipAddress: '192.168.1.45',
      timestamp: '2026-11-23 15:45:12',
    },
    {
      id: 102,
      user: 'admin@empresa.com',
      action: 'ACCOUNT_CREATED',
      module: 'ACCOUNTS',
      result: 'SUCCESS',
      ipAddress: '192.168.1.45',
      timestamp: '2026-11-23 14:30:00',
    },
    {
      id: 103,
      user: 'carlos.mendoza@empresa.com',
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      result: 'SUCCESS',
      ipAddress: '10.0.0.12',
      timestamp: '2026-11-23 13:12:44',
    },
    {
      id: 104,
      user: 'intruso@desconocido.com',
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      result: 'UNAUTHORIZED',
      ipAddress: '185.220.101.5',
      timestamp: '2026-11-23 11:05:19',
    },
    {
      id: 105,
      user: 'admin@empresa.com',
      action: 'USER_STATUS_UPDATED',
      module: 'USERS',
      result: 'SUCCESS',
      ipAddress: '192.168.1.45',
      timestamp: '2026-11-23 09:20:10',
    },
  ]);

  // Roles y permisos definidos en la especificación
  readonly systemRoles = signal([
    {
      name: 'ADMINISTRADOR (ADMIN)',
      description: 'Acceso total y gobierno de la plataforma',
      userCount: 1,
      permissions: [
        'USERS_VIEW',
        'USERS_CREATE',
        'USERS_UPDATE',
        'USERS_DELETE',
        'ACCOUNTS_VIEW',
        'ACCOUNTS_CREATE',
        'ACCOUNTS_UPDATE',
        'AUDIT_VIEW',
        'REPORTS_VIEW',
      ],
    },
    {
      name: 'USUARIO ESTÁNDAR (ROLE_USER)',
      description: 'Gestión personal de finanzas y cuenta propia',
      userCount: 3,
      permissions: [
        'ACCOUNTS_VIEW',
        'ACCOUNTS_CREATE',
        'ACCOUNTS_UPDATE',
        'EXPENSES_VIEW',
        'EXPENSES_CREATE',
        'INCOMES_VIEW',
        'SAVINGS_VIEW',
      ],
    },
  ]);

  ngOnInit() {
    // Cargar datos sincronizados
    this.userService.loadUsers();
    this.accountService.loadAccountsByUser();
  }

  setTab(tab: 'overview' | 'roles' | 'audit' | 'system') {
    this.activeTab.set(tab);
  }

  goToUserManagement() {
    this.router.navigate(['/users-management']);
  }

  goToAccounts() {
    this.router.navigate(['/accounts']);
  }

  handleLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  protected formatCurrency = formatCurrency;
}
