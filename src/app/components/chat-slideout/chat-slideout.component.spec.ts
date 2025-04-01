import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatSlideoutComponent } from './chat-slideout.component';

describe('ChatSlideoutComponent', () => {
  let component: ChatSlideoutComponent;
  let fixture: ComponentFixture<ChatSlideoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatSlideoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatSlideoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
