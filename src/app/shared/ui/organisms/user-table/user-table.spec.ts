import { TestBed } from '@angular/core/testing';
import { UserTableComponent } from './user-table';
import { User } from '../../../../core/models/user.model';

describe('UserTableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTableComponent],
    }).compileComponents();
  });

  it('should create the user table', () => {
    const fixture = TestBed.createComponent(UserTableComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render users when provided', () => {
    const fixture = TestBed.createComponent(UserTableComponent);
    const mockUsers: User[] = [
      {
        id: 1,
        name: 'Sofia Gomez',
        email: 'sofia@empresa.com',
        roles: ['ADMIN'],
        status: 'ACTIVE',
        createdAt: '2026-01-01',
      },
    ];

    fixture.componentRef.setInput('users', mockUsers);
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector('.font-semibold.text-slate-900');
    expect(nameEl.textContent).toContain('Sofia Gomez');
  });

  it('should show loading state when loading input is true', () => {
    const fixture = TestBed.createComponent(UserTableComponent);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const td = fixture.nativeElement.querySelector('td');
    expect(td.textContent).toContain('Cargando usuarios...');
  });
});
