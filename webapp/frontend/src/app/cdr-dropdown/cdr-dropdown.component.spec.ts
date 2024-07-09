import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CdrDropdownComponent } from './cdr-dropdown.component';

describe('CdrDropdownComponent', () => {
  let component: CdrDropdownComponent;
  let fixture: ComponentFixture<CdrDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdrDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdrDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
