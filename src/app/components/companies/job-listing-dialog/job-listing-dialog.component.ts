import { Component, EventEmitter, Input, Output } from '@angular/core';
import { createJobListing, JobListing, JobListingStatus } from '../../../../model/shared-models/job-tracking/job-listing.model';
import { ClientApiService } from '../../../services/client-api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ComponentBase } from '../../component-base/component-base.component';
import { BehaviorSubject, combineLatestWith, filter, lastValueFrom, Observable, of, switchMap, takeUntil, takeWhile } from 'rxjs';
import { ObjectId } from 'mongodb';
import { UpsertDbItem } from '../../../../model/shared-models/db-operation-types.model';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { CommentsEditorComponent } from "../../comments-editor/comments-editor.component";
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-job-listing-dialog',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    FloatLabelModule,
    DialogModule,
    DatePickerModule,
    CommentsEditorComponent,
    TabsModule,
  ],
  templateUrl: './job-listing-dialog.component.html',
  styleUrls: [
    './job-listing-dialog.component.scss',
    '../../../../buttons.scss',
  ]
})
export class JobListingDialogComponent extends ComponentBase {
  constructor(
    readonly clientApiService: ClientApiService,
  ) {
    super();
  }

  ngOnInit() {
    // Create an observable to get the job listing.
    const jobListing$ = this.visible$.pipe(
      filter(x => !!x),
      switchMap(() => this.companyId$),
      combineLatestWith(this.jobListingId$),
      switchMap(([companyId, id]) => {
        if (id === 'new') {
          // Return a new job listing.
          return of(createJobListing(companyId));
        } else {
          // Return the job listing from the server.
          return this.clientApiService.getJobListingById(id);
        }
      }),
      takeUntil(this.ngDestroy$),
    );

    // Set the job listing.
    jobListing$.subscribe(listing => {
      this.targetListing = listing!;
      console.log(listing);
    });
  }

  // #region companyId
  private readonly _companyId = new BehaviorSubject<ObjectId>('');
  readonly companyId$ = this._companyId.asObservable();

  /** Gets or sets the ID of the company that the job listing belongs to so
   *   new listings can be initialized properly. */
  @Input({ required: true })
  get companyId(): ObjectId {
    return this._companyId.getValue();
  }

  set companyId(newVal: ObjectId) {
    this._companyId.next(newVal);
  }
  // #endregion

  // #region jobListingId
  private readonly _jobListingId = new BehaviorSubject<ObjectId | 'new'>('new');
  readonly jobListingId$ = this._jobListingId.asObservable();

  /** Gets or sets the ID of the job listing that's being edited. */
  @Input({ required: true })
  get jobListingId(): ObjectId | 'new' {
    return this._jobListingId.getValue();
  }

  set jobListingId(newVal: ObjectId | 'new') {
    this._jobListingId.next(newVal);
  }
  // #endregion

  /** Observable of the JobListing being edited. */
  targetListing!: UpsertDbItem<JobListing>;

  // #region visible
  private readonly _visible = new BehaviorSubject<boolean>(false);
  readonly visible$ = this._visible.asObservable();

  /** Gets or sets a boolean value indicating whether or not this dialog is visible. */
  @Input()
  get visible(): boolean {
    return this._visible.getValue();
  }

  set visible(newVal: boolean) {
    this._visible.next(newVal);
    this.visibleChange.emit(newVal);
  }
  // #endregion

  @Output()
  visibleChange = new EventEmitter<boolean>();

  /** Event called when the form is closed.  A boolean value is emitted to indicate whether or not the form was cancelled. */
  @Output()
  onClosed = new EventEmitter<boolean>();

  /** Gets or sets the current tab index for the tab list. */
  tabIndex = 0;

  /** Saves the changes to the server. */
  async saveListing(): Promise<void> {
    await lastValueFrom(this.clientApiService.upsertJobListing(this.targetListing));
  }

  /** Called when the user clicks OK or cancel. */
  async onCompleteLocal(cancelled: boolean) {
    this.tabIndex = 0;
    
    if (!cancelled) {
      // Save the listing.
      await this.saveListing();
    }

    // Hide the form.
    this.visible = false;

    // Inform the observer.
    this.onClosed.emit(cancelled);
  }
}
