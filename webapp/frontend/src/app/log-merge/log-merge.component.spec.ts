import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogMergeComponent } from './log-merge.component';

describe('LogMergeComponent', () => {
  let component: LogMergeComponent;
  let fixture: ComponentFixture<LogMergeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LogMergeComponent]
    });
    fixture = TestBed.createComponent(LogMergeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
