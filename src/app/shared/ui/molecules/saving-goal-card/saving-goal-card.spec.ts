import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SavingGoalCardComponent } from './saving-goal-card';
import { SavingGoal } from '../../../../core/models/saving.model';

describe('SavingGoalCardComponent', () => {
  let fixture: ComponentFixture<SavingGoalCardComponent>;

  const goal: SavingGoal = {
    id: 1,
    name: 'Comprar computador',
    targetAmount: 4000000,
    currentAmount: 2500000,
    targetDate: '2999-06-30',
    status: 'IN_PROGRESS',
    userId: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SavingGoalCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(SavingGoalCardComponent);
    fixture.componentRef.setInput('goal', goal);
    fixture.detectChanges();
  });

  it('should create and show the progress percentage', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('62.5%');
    expect(fixture.nativeElement.textContent).toContain('Comprar computador');
  });

  it('should show the contribute action only for goals in progress', () => {
    expect(fixture.nativeElement.textContent).toContain('Aportar');

    fixture.componentRef.setInput('goal', { ...goal, status: 'COMPLETED' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Aportar');
    expect(fixture.nativeElement.textContent).toContain('Meta cumplida');
  });
});
