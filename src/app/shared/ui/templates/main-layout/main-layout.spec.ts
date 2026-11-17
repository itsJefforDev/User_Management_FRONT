import { TestBed } from '@angular/core/testing';
import { MainLayoutComponent } from './main-layout';

describe('MainLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
    }).compileComponents();
  });

  it('should create the main layout', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
