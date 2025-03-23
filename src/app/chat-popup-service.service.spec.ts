import { TestBed } from '@angular/core/testing';

import { ChatPopupServiceService } from './chat-popup-service.service';

describe('ChatPopupServiceService', () => {
  let service: ChatPopupServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatPopupServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
