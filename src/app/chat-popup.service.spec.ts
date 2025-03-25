import { TestBed } from '@angular/core/testing';

import { ChatPopupService } from './chat-popup.service';

describe('ChatPopupServiceService', () => {
  let service: ChatPopupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatPopupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
