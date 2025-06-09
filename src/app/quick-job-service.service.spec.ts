import { TestBed } from '@angular/core/testing';

import { QuickJobServiceService } from './quick-job-service.service';

describe('QuickJobServiceService', () => {
  let service: QuickJobServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuickJobServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
