import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SavingsPageComponent } from './savings-page';
import { SavingService } from '../../../../core/services/saving.service';

describe('SavingsPageComponent', () => {
  let component: SavingsPageComponent;
  let fixture: ComponentFixture<SavingsPageComponent>;
  let savingService: SavingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavingsPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SavingsPageComponent);
    component = fixture.componentInstance;
    savingService = TestBed.inject(SavingService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open and close the goal modal', () => {
    component.openCreateGoal();
    expect(component.showGoalModal()).toBe(true);
    component.closeGoalModal();
    expect(component.showGoalModal()).toBe(false);
  });

  it('should reject goals with a non positive target', () => {
    component.openCreateGoal();
    component.goalName.set('Meta');
    component.goalTarget.set('0');
    component.submitGoal();
    expect(component.goalError()).toContain('mayor a cero');
  });

  it('should reject goals with a past target date', () => {
    component.openCreateGoal();
    component.goalName.set('Meta');
    component.goalTarget.set('1000');
    component.goalDate.set('2000-01-01');
    component.submitGoal();
    expect(component.goalError()).toContain('posterior a la fecha actual');
  });

  it('should reject contributions greater than the pending amount', () => {
    const goal = savingService.allGoals().find((g) => g.status === 'IN_PROGRESS')!;
    component.openContribution(goal);
    component.contribAmount.set(String(goal.targetAmount * 2));
    component.submitContribution();
    expect(component.contribError()).toContain('monto pendiente');
  });
});
