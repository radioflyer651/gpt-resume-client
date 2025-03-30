import { TestBed } from '@angular/core/testing';

import { TarotGameService } from './tarot-game.service';

describe('TarotGameService', () => {
  let service: TarotGameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TarotGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
