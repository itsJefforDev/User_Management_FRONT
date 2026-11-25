import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page';
import { RegisterPageComponent } from './features/auth/pages/register-page/register-page';
import { VerifyPageComponent } from './features/auth/pages/verify-page/verify-page';
import { AdminPageComponent } from './features/admin/pages/admin-page/admin-page';
import { UserPageComponent } from './features/user/pages/user-page/user-page';
import { UsersPageComponent } from './features/users/pages/users-page/users-page';
import { LandingPageComponent } from './features/landing/pages/landing-page/landing-page';
import { AccountsPageComponent } from './features/accounts/pages/accounts-page/accounts-page';
import { CategoriesPageComponent } from './features/categories/pages/categories-page/categories-page';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { ExpensesPageComponent } from './features/expenses/pages/expenses-page/expenses-page';
import { IncomesPageComponent } from './features/incomes/pages/incomes-page/incomes-page';
import { SavingsPageComponent } from './features/savings/pages/savings-page/savings-page';
import { ReportsPageComponent } from './features/reports/pages/reports-page/reports-page';




SavingsPageComponent

export const routes: Routes = [
  // ─── Rutas públicas ───────────────────────────────────────────────
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'landing',
  },
  {
    path: 'landing',
    component: LandingPageComponent,
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'register',
    component: RegisterPageComponent,
  },
  {
    path: 'verify',
    component: VerifyPageComponent,
  },

  // ─── Rutas protegidas (Requieren autenticación) ───────────────────
  {
    path: 'admin',
    component: AdminPageComponent,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'user',
    component: UserPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'users-management',
    component: UsersPageComponent,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'accounts',
    component: AccountsPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'categories',
    component: CategoriesPageComponent,
    canActivate: [authGuard, adminGuard],
  },

  { path: 'expenses', component: ExpensesPageComponent, canActivate: [authGuard] },

  { path: 'incomes', component: IncomesPageComponent, canActivate: [authGuard] },
  { path: 'savings', component: SavingsPageComponent, canActivate: [authGuard] },
  { path: 'reports', component: ReportsPageComponent, canActivate: [authGuard] },

  // ─── Ruta comodín ─────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'landing',
  },
];
