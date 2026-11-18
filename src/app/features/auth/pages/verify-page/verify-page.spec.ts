import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { VerifyPageComponent } from './verify-page';

describe('VerifyPageComponent', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create the verify page', () => {
    const fixture = TestBed.createComponent(VerifyPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should navigate to login onGoToLogin', () => {
    const fixture = TestBed.createComponent(VerifyPageComponent);
    const component = fixture.componentInstance;
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onGoToLogin();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
