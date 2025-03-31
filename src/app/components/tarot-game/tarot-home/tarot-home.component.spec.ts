import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarotHomeComponent } from './tarot-home.component';

describe('TarotHomeComponent', () => {
  let component: TarotHomeComponent;
  let fixture: ComponentFixture<TarotHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarotHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarotHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
