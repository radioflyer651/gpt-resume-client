import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobListingDialogComponent } from './job-listing-dialog.component';

describe('JobListingDialogComponent', () => {
  let component: JobListingDialogComponent;
  let fixture: ComponentFixture<JobListingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobListingDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobListingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
