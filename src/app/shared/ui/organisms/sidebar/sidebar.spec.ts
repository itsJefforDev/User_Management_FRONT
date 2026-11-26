import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SidebarComponent } from './sidebar';
import { AuthService } from '../../../../core/services/auth.service';
import { SidebarService } from '../../../../core/services/sidebar.service';

describe('SidebarComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem('sidebar_collapsed');
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  const setRole = (name: string) =>
    TestBed.inject(AuthService).currentUser.set({
      token: 't',
      role: [{ id: 1, name, permissions: [] }],
      email: 'test@empresa.com',
      name: 'Test',
    });

  it('should show admin links only for administrators', () => {
    setRole('ROLE_USER');
    let fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Usuarios');
    expect(fixture.nativeElement.textContent).toContain('Gastos');

    setRole('ADMIN');
    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Usuarios');
  });

  it('should toggle and remember the collapsed state', () => {
    const sidebar = TestBed.inject(SidebarService);
    expect(sidebar.collapsed()).toBe(false);
    sidebar.toggleCollapsed();
    expect(sidebar.collapsed()).toBe(true);
    expect(localStorage.getItem('sidebar_collapsed')).toBe('true');
  });
});
