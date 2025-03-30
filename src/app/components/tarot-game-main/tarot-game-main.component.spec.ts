import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarotGameMainComponent } from './tarot-game-main.component';

describe('TarotGameMainComponent', () => {
  let component: TarotGameMainComponent;
  let fixture: ComponentFixture<TarotGameMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarotGameMainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarotGameMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
