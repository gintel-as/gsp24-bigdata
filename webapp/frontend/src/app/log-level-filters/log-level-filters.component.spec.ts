import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogLevelFiltersComponent } from './log-level-filters.component';

describe('LogLevelFiltersComponent', () => {
  let component: LogLevelFiltersComponent;
  let fixture: ComponentFixture<LogLevelFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogLevelFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogLevelFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
