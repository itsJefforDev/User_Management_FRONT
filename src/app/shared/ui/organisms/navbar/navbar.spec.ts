import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NavbarComponent } from './navbar';

describe('NavbarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  it('should create the navbar', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render custom title', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.componentRef.setInput('title', 'Empresarial App');
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('span.text-base');
    expect(titleEl.textContent.trim()).toBe('Empresarial App');
  });
});
