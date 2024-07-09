import { TestBed } from '@angular/core/testing';

import { PlotMethodService } from './plot-method.service';

describe('PlotMethodService', () => {
  let service: PlotMethodService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlotMethodService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
