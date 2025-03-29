import { TestBed } from '@angular/core/testing';

import { LlmFunctionsService } from './llm-functions.service';

describe('LlmFunctionsService', () => {
  let service: LlmFunctionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LlmFunctionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
