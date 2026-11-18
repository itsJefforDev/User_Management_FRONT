import { TestBed } from '@angular/core/testing';
import { AlertComponent } from './alert';

describe('AlertComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertComponent],
    }).compileComponents();
  });

  it('should create the alert', () => {
    const fixture = TestBed.createComponent(AlertComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should apply danger styling when variant is danger', () => {
    const fixture = TestBed.createComponent(AlertComponent);
    fixture.componentRef.setInput('variant', 'danger');
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('div[role="alert"]');
    expect(root.className).toContain('bg-rose-50');
  });

  it('should display title when provided', () => {
    const fixture = TestBed.createComponent(AlertComponent);
    fixture.componentRef.setInput('title', 'Alerta importante');
    fixture.detectChanges();

    const h4 = fixture.nativeElement.querySelector('h4');
    expect(h4.textContent).toContain('Alerta importante');
  });
});
