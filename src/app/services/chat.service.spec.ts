import { TestBed } from '@angular/core/testing';

import { ChatService } from './chat.service';

describe('Chat2Service', () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
