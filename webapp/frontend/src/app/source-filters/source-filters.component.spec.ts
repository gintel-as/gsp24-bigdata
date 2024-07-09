import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SourceFiltersComponent } from './source-filters.component';

describe('SourceFiltersComponent', () => {
  let component: SourceFiltersComponent;
  let fixture: ComponentFixture<SourceFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourceFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SourceFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
