import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page';
import { RegisterPageComponent } from './features/auth/pages/register-page/register-page';
import { VerifyPageComponent } from './features/auth/pages/verify-page/verify-page';
import { AdminPageComponent } from './features/admin/pages/admin-page/admin-page';
import { UserPageComponent } from './features/user/pages/user-page/user-page';
import { UsersPageComponent } from './features/users/pages/users-page/users-page';
import { LandingPageComponent } from './features/landing/pages/landing-page/landing-page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'landing',
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
  {
    path: 'admin',
    component: AdminPageComponent,
  },
  {
    path: 'user',
    component: UserPageComponent,
  },
  {
    path: 'users-management',
    component: UsersPageComponent,
  },
    {
    path: 'landing',
    component: LandingPageComponent,
  },
  // {
  //   path: '**',
  //   redirectTo: 'login',
  // },
];
