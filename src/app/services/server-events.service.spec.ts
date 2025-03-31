import { TestBed } from '@angular/core/testing';

import { ServerEventsService } from './server-events.service';

describe('LlmFunctionsService', () => {
  let service: ServerEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
