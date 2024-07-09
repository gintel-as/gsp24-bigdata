import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionTreeComponent } from './session-tree.component';

describe('SessionTreeComponent', () => {
  let component: SessionTreeComponent;
  let fixture: ComponentFixture<SessionTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
