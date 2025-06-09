import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickJobCreateComponent } from './quick-job-create.component';

describe('QuickJobCreateComponent', () => {
  let component: QuickJobCreateComponent;
  let fixture: ComponentFixture<QuickJobCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickJobCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickJobCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
