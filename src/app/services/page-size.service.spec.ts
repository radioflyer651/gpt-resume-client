import { TestBed } from '@angular/core/testing';

import { PageSizeService } from './page-size.service';

describe('PageSizeService', () => {
  let service: PageSizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PageSizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
