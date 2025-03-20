import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumeStaticComponent } from './resume-static.component';

describe('ResumeStaticComponent', () => {
  let component: ResumeStaticComponent;
  let fixture: ComponentFixture<ResumeStaticComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeStaticComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumeStaticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
