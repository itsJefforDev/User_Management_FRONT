import { TestBed } from '@angular/core/testing';
import { AuthLayoutComponent } from './auth-layout';

describe('AuthLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
    }).compileComponents();
  });

  it('should create the auth layout', () => {
    const fixture = TestBed.createComponent(AuthLayoutComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
