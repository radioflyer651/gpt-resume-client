import { Component } from '@angular/core';
import { ComponentBase } from '../../component-base/component-base.component';
import { ClientApiService } from '../../../services/client-api.service';
import { BehaviorSubject, combineLatestWith, map, Observable, startWith, Subject, switchMap } from 'rxjs';
import { JobListingLineWithCompany } from '../../../../model/shared-models/job-tracking/job-listing.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DialogModule } from 'primeng/dialog';
import { ObjectId } from 'mongodb';
import { JobListingDialogComponent } from "../job-listing-dialog/job-listing-dialog.component";
import { CheckboxModule } from 'primeng/checkbox';
import { QuickJobServiceService } from '../../../quick-job-service.service';
import { RemainingSizeHelper } from '../../../../utils/remaining-size-helper';

@Component({
  selector: 'app-job-listings',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    PanelModule,
    InputTextModule,
    FloatLabelModule,
    DialogModule,
    JobListingDialogComponent,
    CheckboxModule,
  ],
  templateUrl: './job-listings.component.html',
  styleUrl: './job-listings.component.scss'
})
export class JobListingsComponent extends ComponentBase {
  constructor(
    readonly apiClient: ClientApiService,
    readonly route: ActivatedRoute,
    readonly router: Router,
    readonly quickJobCreateService: QuickJobServiceService,
  ) {
    super();
  }

  ngOnInit() {
    this.jobListings$ = this.reloadJobListings$.pipe(
      startWith(undefined),
      switchMap(() => this.apiClient.getAllJobListings()),
      combineLatestWith(this.searchText$, this.includeClosed$),
      map(([listings, searchText, includeClosed]) => {
        if (!searchText && includeClosed) {
          return listings;
        }

        this.tableSizeHelper.updateSize();

        const filterOn = (value: string | undefined) => {
          if (!value) {
            return false;
          }


          try {
            const regex = new RegExp(searchText, 'i');
            return regex.test(value);
          } catch (err) {
            console.error(`Search Error: ${err}`);
            return false;
          }
        };

        // We'll build off the filtered variable.
        let filtered = listings;

        // Filter out the closed items, if we must.
        filtered = filtered.filter(l => !(!includeClosed && l.currentStatus?.isClosed === true));

        // Perform the search, and return the results.
        if (!!searchText.trim()) {
          filtered = listings.filter(l => {
            // Check the closed filter, first.
            if (!includeClosed && l.currentStatus?.isClosed === true) {
              return false;
            }

            // Now check the filters.
            return filterOn(l.company?.name) || filterOn(l.company?.website) ||
              filterOn(l.jobTitle) || filterOn(l.currentStatus?.status);
          });
        }

        // Return the filtered results.
        return filtered;
      }),
      map(listing => {
        listing.forEach(l => {
          if (l.currentStatus?.statusDate instanceof Date) {
            l.currentStatus.statusDate = new Date(l.currentStatus.statusDate.toLocaleDateString());
          } else if (typeof l.currentStatus?.statusDate === 'string') {
            try {
              l.currentStatus.statusDate = new Date(l.currentStatus.statusDate);
            } catch (err) {
              // We don't care if it fails here... I guess...
              console.error(`Error parsing status date: ${err}`);
            }
          } else if (!!l.currentStatus?.statusDate) {
            // If the status date is not set, we will set it to the current date.
            console.warn(`Status date is not a Date or string, setting to current date.`);
          }
        });

        return listing;
      })
    );
  }

  tableSizeHelper = new RemainingSizeHelper('#table-top-position-helper', this.ngDestroy$);

  // #region includeClosed
  private readonly _includeClosed = new BehaviorSubject<boolean>(false);
  readonly includeClosed$ = this._includeClosed.asObservable();

  /** Gets or sets a boolean value indicating whether or not we will filter out closed job listings. */
  get includeClosed(): boolean {
    return this._includeClosed.getValue();
  }

  set includeClosed(newVal: boolean) {
    this._includeClosed.next(newVal);
  }
  // #endregion

  // #region searchText
  clearSearch() {
    this.searchText = '';
  }

  private readonly _searchText = new BehaviorSubject<string>('');
  readonly searchText$ = this._searchText.asObservable();

  /** Gets or sets the text to search for int he job listings. */
  get searchText(): string {
    return this._searchText.getValue();
  }

  set searchText(newVal: string) {
    this._searchText.next(newVal);
  }
  // #endregion

  /** Observable that will trigger the job listings to be reloaded. */
  reloadJobListings$ = new Subject<void>();

  /** The job listings to be shown on the page. */
  jobListings$!: Observable<JobListingLineWithCompany[]>;

  /** Boolean value indicating whether or not the edit dialog for a job is open. */
  isEditDialogVisible: boolean = false;

  /** Gets or sets the ID of the job to be edited. */
  editJobId?: ObjectId;

  /** Technically, not needed, but required for the job listing dialog. */
  editJobCompanyId?: ObjectId;

  editJob(jobId: ObjectId, jobCompanyId: ObjectId) {
    this.editJobId = jobId;
    this.editJobCompanyId = jobCompanyId;
    this.isEditDialogVisible = true;
  }

  editComplete(cancelled: boolean): void {
    if (!cancelled) {
      this.reloadJobListings$.next();
    }
  };

  createQuickJob(): void {
    this.quickJobCreateService.createQuickJob(undefined, true);
  }
}
