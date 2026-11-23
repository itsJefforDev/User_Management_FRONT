import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountCardComponent } from './account-card';
import { Account } from '../../../../core/models/account.model';

describe('AccountCardComponent', () => {
  let component: AccountCardComponent;
  let fixture: ComponentFixture<AccountCardComponent>;

  const mockAccount: Account = {
    id: 1,
    name: 'Cuenta de Prueba',
    type: 'BANK',
    balance: 500000,
    active: true,
    userId: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('account', mockAccount);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
