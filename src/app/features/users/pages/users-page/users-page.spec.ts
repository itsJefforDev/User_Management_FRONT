import { TestBed } from '@angular/core/testing';
import { UsersPageComponent } from './users-page';

describe('UsersPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersPageComponent],
    }).compileComponents();
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
