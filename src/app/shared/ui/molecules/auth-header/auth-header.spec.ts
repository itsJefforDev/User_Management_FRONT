import { TestBed } from '@angular/core/testing';
import { AuthHeaderComponent } from './auth-header';

describe('AuthHeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthHeaderComponent],
    }).compileComponents();
  });

  it('should create the auth header', () => {
    const fixture = TestBed.createComponent(AuthHeaderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render title and subtitle', () => {
    const fixture = TestBed.createComponent(AuthHeaderComponent);
    fixture.componentRef.setInput('title', 'Iniciar Sesión');
    fixture.componentRef.setInput('subtitle', 'Ingresa tu correo');
    fixture.detectChanges();

    const h2 = fixture.nativeElement.querySelector('h2');
    const p = fixture.nativeElement.querySelector('p');
    expect(h2.textContent).toContain('Iniciar Sesión');
    expect(p.textContent).toContain('Ingresa tu correo');
  });
});
