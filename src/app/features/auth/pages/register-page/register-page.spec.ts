import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RegisterPageComponent } from './register-page';

describe('RegisterPageComponent', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create the register page', () => {
    const fixture = TestBed.createComponent(RegisterPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should navigate to login onGoToLogin', () => {
    const fixture = TestBed.createComponent(RegisterPageComponent);
    const component = fixture.componentInstance;
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onGoToLogin();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
