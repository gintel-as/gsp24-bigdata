import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlotSectionsComponent } from './plot-sections.component';

describe('PlotSectionsComponent', () => {
  let component: PlotSectionsComponent;
  let fixture: ComponentFixture<PlotSectionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PlotSectionsComponent]
    });
    fixture = TestBed.createComponent(PlotSectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
