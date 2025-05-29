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
import { EditStatusResult, StatusDialogComponent } from "../status-dialog/status-dialog.component";
import { orderJobListingStatuses } from '../../../../model/shared-models/job-tracking/job-listing.functions';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { ChipModule } from 'primeng/chip';
import { SplitButtonModule } from 'primeng/splitbutton';

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
    StatusDialogComponent,
    TextareaModule,
    ChipModule,
    SplitButtonModule,
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
    readonly confirmationService: ConfirmationService,
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

  /** Returns a link that the user may click on, if the URL is valid. */
  get urlLink(): string | undefined {
    if (/https?:\/\/([\w\d\-]+\.)+([\w\d]+)/.test(this.targetListing.urlLink)) {
      return this.targetListing.urlLink;
    }

    if (/([\w\d\-]+\.)+([\w\d]+)/.test(this.targetListing.urlLink)) {
      return 'https://' + this.targetListing.urlLink;
    }

    return undefined;
  }

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
    this.isStatusDialogVisible = false;
    this.visibleChange.emit(newVal);
  }
  // #endregion

  @Output()
  visibleChange = new EventEmitter<boolean>();

  /** Event called when the form is closed.  A boolean value is emitted to indicate whether or not the form was cancelled. */
  @Output()
  onClosed = new EventEmitter<boolean>();

  /** Returns the display status to show in the UI, if any. */
  get displayStatus(): JobListingStatus | undefined {
    if (!this.targetListing?.jobStatuses || this.targetListing.jobStatuses.length < 1) {
      return undefined;
    }

    // Return the last one from the list.
    return this.targetListing.jobStatuses[this.targetListing.jobStatuses.length - 1];
  }

  /** Gets or sets the job status being edited in the dialog. */
  editStatus!: JobListingStatus;

  /** Controls the visibility of the status editor dialog. */
  isStatusDialogVisible: boolean = false;

  /** Gets or sets the mode of the status editor dialog. */
  statusEditMode: 'edit' | 'new' = 'new';

  /** Shows a dialog so the user can update the status of the project. */
  editJobStatus(target: JobListingStatus | 'new'): void {
    // Set the status we're editing, and set the mode.
    if (target === 'new') {
      this.statusEditMode = 'new';
      this.editStatus = { status: 'New Status', statusDate: new Date() };

      if (!this.targetListing.jobStatuses || this.targetListing.jobStatuses.length < 1) {
        this.editStatus.status = 'Applied';
      }

    } else {
      this.statusEditMode = 'edit';
      this.editStatus = target;
    }

    this.isStatusDialogVisible = true;
  }

  /** Called when the job status dialog closes. */
  onStatusDialogClosed({ cancelled, newValue }: EditStatusResult): void {
    // Exit if cancelled.
    if (cancelled) {
      return;
    }

    // Take action, based on the edit mode.
    if (this.statusEditMode === 'edit') {
      // Update the original value.
      this.editStatus.status = newValue.status;
      this.editStatus.statusDate = newValue.statusDate;
    } else {
      // Add the status to the list.
      this.targetListing.jobStatuses.push(newValue);
    }

    // Sort the list to be in date order.
    orderJobListingStatuses(this.targetListing as JobListing);
  }

  /** Confirms and then deletes a specified job status. */
  deleteJobStatus(status: JobListingStatus): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the job status: ${status.status}?`,
      accept: () => {
        // Find the index, then delete it.
        const statusIndex = this.targetListing.jobStatuses.indexOf(status);
        if (statusIndex >= 0) {
          this.targetListing.jobStatuses.splice(statusIndex, 1);
        }
      }
    });
  }

  /** Gets or sets the current tab index for the tab list. */
  tabIndex = 0;

  /** Saves the changes to the server. */
  async saveListing(): Promise<void> {
    const result = await lastValueFrom(this.clientApiService.upsertJobListing(this.targetListing));
    this.targetListing._id = result._id;
  }

  splitButtonModel: MenuItem[] = [
    {
      label: 'Save',
      command: async () => {
        await this.saveListing();
      }
    }
  ];

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

  get analysisRequiredSkills(): string {
    if (!this.targetListing.analysis) {
      return '';
    }
    return this.targetListing.analysis.requiredSkillList.join(', ');
  }

  get analysisOptionalSkills(): string {
    if (!this.targetListing.analysis) {
      return '';
    }
    return this.targetListing.analysis.optionalSkillList.join(', ');
  }

  /** Boolean value indicating whether or not the job's analysis is being updated on the server. */
  isUpdatingAnalysis: boolean = false;

  /** Updates the AI Analysis on this job. */
  async updateAiAnalysis(): Promise<void> {
    this.isUpdatingAnalysis = true;
    // Save first.
    await this.saveListing();

    // Update the analysis.
    const newAnalysis = await lastValueFrom(this.clientApiService.updateJobListingAnalysis(this.jobListingId));

    // Update the value locally.
    this.targetListing.analysis = newAnalysis;

    // Indicate we're done with the operation.
    this.isUpdatingAnalysis = false;
  }
}
