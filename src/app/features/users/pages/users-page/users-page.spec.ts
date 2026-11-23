import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { UsersPageComponent } from './users-page';
import { AuthService } from '../../../../core/services/auth.service';

describe('UsersPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
      ],
    }).compileComponents();

    // Simular usuario ADMIN en el test
    const authService = TestBed.inject(AuthService);
    authService.currentUser.set({
      token: 'test-admin-token',
      role: [{ id: 1, name: 'ADMIN', permissions: [] }],
      email: 'admin@empresa.com',
      name: 'Administrador',
    });
  });

  it('should create the users page', () => {
    const fixture = TestBed.createComponent(UsersPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render page heading', () => {
    const fixture = TestBed.createComponent(UsersPageComponent);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading.textContent).toContain('Usuarios');
  });
});
