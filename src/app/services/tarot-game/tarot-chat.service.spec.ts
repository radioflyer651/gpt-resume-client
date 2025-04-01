import { TestBed } from '@angular/core/testing';

import { TarotChatService } from './tarot-chat.service';

describe('TarotChatService', () => {
  let service: TarotChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TarotChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
