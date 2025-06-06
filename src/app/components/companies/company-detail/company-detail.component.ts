import { Component } from '@angular/core';
import { ComponentBase } from '../../component-base/component-base.component';
import { Company } from '../../../../model/shared-models/company.model';
import { ClientApiService } from '../../../services/client-api.service';
import { NewDbItem, UpsertDbItem } from '../../../../model/shared-models/db-operation-types.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, distinct, lastValueFrom, map, Observable, of, shareReplay, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { CompanyContact } from '../../../../model/shared-models/job-tracking/company-contact.data';
import { JobListingLine } from '../../../../model/shared-models/job-tracking/job-listing.model';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ContactDialogComponent } from "../contact-dialog/contact-dialog.component";
import { ObjectId } from 'mongodb';
import { JobListingDialogComponent } from "../job-listing-dialog/job-listing-dialog.component";
import { ConfirmationService } from 'primeng/api';
import { CommentsEditorComponent } from "../../comments-editor/comments-editor.component";
import { PanelModule } from 'primeng/panel';
import { CheckboxModule } from 'primeng/checkbox';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ApolloService } from '../../../services/apollo.service';
import { LApolloOrganization } from '../../../../model/shared-models/apollo/apollo-local.model';
import { ApolloDataStateTypes } from '../../../../model/shared-models/apollo/apollo-data-info.model';

type ApolloEmployeeLoadedStateTypes = ApolloDataStateTypes | 'not-ready';

@Component({
  selector: 'app-company-detail',
  imports: [
    RouterModule,
    CommonModule,
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    TableModule,
    ToolbarModule,
    ButtonModule,
    ContactDialogComponent,
    JobListingDialogComponent,
    CommentsEditorComponent,
    PanelModule,
    CheckboxModule,
    SplitButtonModule,
  ],
  templateUrl: './company-detail.component.html',
  styleUrls: [
    './company-detail.component.scss',
    '../../../../buttons.scss',
  ]
})
export class CompanyDetailComponent extends ComponentBase {
  constructor(
    readonly clientApi: ClientApiService,
    readonly router: Router,
    readonly route: ActivatedRoute,
    readonly confirmationService: ConfirmationService,
    readonly apolloService: ApolloService,
  ) {
    super();

  }

  /** Company ID obtained from the route parameters. */
  companyId$!: Observable<ObjectId>;

  /** Triggered when the contact list is changed. */
  contactsChanged$ = new Subject<void>();

  /** Emitted when the job listings have changed. */
  jobListingsChanged$ = new Subject<void>();

  apolloCompanyChanged$ = new Subject<undefined | 'linking' | 'complete'>();



  ngOnInit() {
    // Observable to get the company ID from the route.
    this.companyId$ = this.route.paramMap.pipe(
      map(pm => pm.get('companyId')!),
      distinct(),
      takeUntil(this.ngDestroy$)
    );

    // Get the company from the ID.
    const companyFromId$: Observable<UpsertDbItem<Company>> = this.companyId$.pipe(
      switchMap(id => {
        // If it's 'new', then we have to create a new company.
        //  Otherwise, we have to get it from the server.
        if (id === 'new') {
          // Return a new company.
          return of(this.createNewCompany());

        } else {
          // Clear the current company, for initialization sake.
          this.editTarget = undefined;
          return this.clientApi.getCompanyById(id);
        }
      }),
      shareReplay(1),
    );

    // Get the contacts for the id.
    const contactsFromId$ = this.companyId$.pipe(
      switchMap(id => {
        // If the ID is new, then we don't have any contacts.
        if (id === 'new') {
          return of([]);
        } else {
          // Clear the property while it's being retrieved from the server.
          //  If another call is made, this part should be synchronous, and ultimately
          //  be resolved by the next call.
          this.contacts = undefined;
          return this.contactsChanged$.pipe(
            startWith(undefined), // Trigger the first update to get the contacts from the server.
            switchMap(() => this.clientApi.getContactsByCompanyId(id)),
          );
        }
      }));

    /** Get the job listings for this company. */
    const jobListingsFromId$ = this.companyId$.pipe(switchMap(id => {
      // If the ID is new, then we don't have any contacts.
      if (id === 'new') {
        return of([]);
      } else {
        // Clear the property while it's being retrieved from the server.
        //  If another call is made, this part should be synchronous, and ultimately
        //  be resolved by the next call.
        this.jobListings = undefined;
        return this.jobListingsChanged$.pipe(
          startWith(undefined), // Make sure we trigger the first update.
          switchMap(() => this.clientApi.getJobListingsByCompanyId(id)), // Return the API call.
        );
      }
    }));

    // Yes yes yes... we're subscribing in a completely separate step - not inline.  Sue me.
    //  NOTE: The takeUntil on companyId$ handles unsubscribing for all of these.
    companyFromId$.subscribe(company => {
      if (!company) {
        throw new Error(`No company exists for the ID.`);
      }
      this.editTarget = company;
    });

    contactsFromId$.subscribe(contacts => {
      this.contacts = contacts;
    });

    jobListingsFromId$.subscribe(jobs => {
      this.jobListings = jobs;
    });

    this.apolloCompany$ = companyFromId$.pipe(
      switchMap((company) => {
        return this.apolloCompanyChanged$.pipe(
          startWith(undefined),
          switchMap((changedValue) => {
            // If we're linking the company, then show "loading".
            if (changedValue === 'linking') {
              return of('loading' as const);
            }

            // If there's no ID, then we can't get it.
            if (!company?.apolloId) {
              return of(undefined);
            }

            // Otherwise, we'll load the company.  Let the loading status
            //  be controlled by the following observable.
            return this.apolloService.getApolloCompanyById(company.apolloId!)
              .pipe(
                startWith('loading' as const)
              );
          })
        );
      }),
      takeUntil(this.ngDestroy$),
    );

    this.apolloCompanyValue$ = this.apolloCompany$.pipe(
      map(c => {
        if (typeof c === 'object') {
          return c;
        }

        return undefined;
      })
    );

    this.hasApolloCompany$ = this.apolloCompany$.pipe(
      map(company => {
        return typeof company === 'object';
      }),
      takeUntil(this.ngDestroy$),
    );

    this.apolloEmployeeLoadState$ = this.apolloCompanyValue$.pipe(
      switchMap(company => {
        return this.apolloEmployeeLoadStateChanged$.pipe(
          startWith(undefined), // Trigger the first update.
          switchMap(_ => {
            // If we don't have a company, then we're not ready.
            if (!company) {
              return of('not-ready' as ApolloEmployeeLoadedStateTypes);
            }

            return this.clientApi.getApolloEmployeeStatusForApolloCompany(company._id).pipe(
              map(status => {
                return status.state as ApolloEmployeeLoadedStateTypes;
              }),
              catchError(err => {
                return of('new' as ApolloEmployeeLoadedStateTypes);
              }),
            );
          }),
          startWith('not-ready' as ApolloEmployeeLoadedStateTypes),
        );
      }),
      takeUntil(this.ngDestroy$),
    );
  }

  get websiteField(): string {
    return this.editTarget!.website;
  }
  set websiteField(value: string) {
    this.editTarget!.website = value.replace(/^https?:\/\//i, '');
  }

  /** Gets or sts the contacts for the company. */
  contacts?: CompanyContact[] = undefined;

  /** Gets or sets the job listings for the company. */
  jobListings?: JobListingLine[] = undefined;

  /** Gets or sets the company that's being edited. */
  editTarget: UpsertDbItem<Company> | undefined;

  get canNavigateWebsite(): boolean {
    return this.navigationWebsite !== '';
  }

  /** Value to navigate to if an appropriate website is provided for the company. */
  get navigationWebsite(): string {
    if (!this.editTarget) {
      return '';
    }

    let value = this.editTarget.website.replace(/^https?:\/\//, '');
    if (/^([\w\d\-]+\.)+[\w\d]+/i.test(value)) {
      return `https://${value}`;
    }

    return '';
  }

  navigateWebsite(): void {
    if (!this.canNavigateWebsite) {
      return;
    }

    // Open the URL in a new tab and give it focus
    const newWindow = window.open(this.navigationWebsite, '_blank');

    // Focus the new window if it was successfully created
    if (newWindow) {
      newWindow.focus();
    }
  }

  /** Returns a boolean value indicating whether or not we're editing a new company. */
  get isNewCompany(): boolean {
    return !this.editTarget?._id;
  }

  private createNewCompany(): NewDbItem<Company> {
    return {
      name: '',
      website: '',
      comments: []
    };
  }

  /** Controls the visibility of the new contact dialog. */
  isEditContactVisible = false;

  editContactTargetId: ObjectId | 'new' = 'new';

  /** Called to edit or create a new contact. */
  editContact(id: ObjectId | 'new') {
    this.editContactTargetId = id;
    this.isEditContactVisible = true;
  }

  onNewContactClosed(cancelled: boolean): void {
    if (!cancelled) {
      // Trigger a refresh on the contact list.
      this.contactsChanged$.next();
    }
  }

  /** Deletes a specified contact from the server, and the UI. */
  private async deleteContact(contactId: ObjectId): Promise<void> {
    await lastValueFrom(this.clientApi.deleteContactById(contactId));
    // Lazy - reloading the contacts from the server.
    this.contactsChanged$.next();
  }

  deleteContactClicked(contact: CompanyContact): void {
    this.confirmationService.confirm({
      message: `Are you sure you wish to delete the contact: ${contact.firstName} ${contact.lastName}?`,
      accept: async () => {
        // Delete the contact from the server.
        await this.deleteContact(contact._id);
      }
    });
  }

  /** Gets or sets the ID (or new) of the job listing to be edited in the editor. */
  editJobListingTargetId: ObjectId | 'new' = 'new';

  /** Controls whether or not the dialog to edit a job listing is open. */
  isEditJobListingVisible: boolean = false;

  /** Sets the ID of the job listing to edit, and opens the editor dialog. */
  editJobListing(id: ObjectId | 'new') {
    this.editJobListingTargetId = id;
    this.isEditJobListingVisible = true;
  }

  /** Called when the editor for the job listing detail is closed. */
  async onListingDetailClosed(cancelled: boolean) {
    if (!cancelled) {
      // We need to reload the listings.
      this.jobListingsChanged$.next();
    }
  }

  /** Deletes a job listing, specified by its ID, on the server. */
  private async deleteJobListing(jobListingId: ObjectId): Promise<void> {
    // Delete the listing on the server.
    await lastValueFrom(this.clientApi.deleteJobListingById(jobListingId));

    // Lazy - update the job listings.
    this.jobListingsChanged$.next();
  }

  deleteJobListingClicked(jobListing: JobListingLine): void {
    this.confirmationService.confirm({
      message: `Are you sure you wish to delete the listing: ${jobListing.jobTitle}?`,
      accept: async () => {
        await this.deleteJobListing(jobListing._id);
      }
    });
  }

  /** Saves the company back to the server. */
  async saveCompanyInfo(): Promise<void> {
    if (!this.editTarget!._id) {
      delete this.editTarget!._id;
    }

    // Update the company on the server.
    await lastValueFrom(this.clientApi.upsertCompany(this.editTarget!));

    // Navigate to this company.  It might be jarring, but we need the
    //  new ID in the URL.
    this.router.navigate(['..', this.editTarget!._id!], { relativeTo: this.route });
  }

  async saveCompanyInfoAndReturn(): Promise<void> {
    if (!this.editTarget!._id) {
      delete this.editTarget!._id;
    }

    // Update the company on the server.
    await lastValueFrom(this.clientApi.upsertCompany(this.editTarget!));

    // Navigate to this company.  It might be jarring, but we need the
    //  new ID in the URL.
    this.router.navigate(['../..', 'list'], { relativeTo: this.route });
  }

  saveSplitMenu = [
    {
      label: 'Save',
      command: async () => {
        await this.saveCompanyInfo();
      }
    }
  ];

  // #region Apollo Company

  apolloCompany$!: Observable<LApolloOrganization | undefined | 'loading'>;

  apolloCompanyValue$!: Observable<LApolloOrganization | undefined>;

  hasApolloCompany$!: Observable<boolean>;

  findApolloCompany() {
    // Ensure we have a company to link.
    if (!this.editTarget?._id) {
      return;
    }

    // Indicate that we're linking the company.
    this.apolloCompanyChanged$.next('linking');
    this.apolloService.updateApolloCompanyForCompanyId(this.editTarget._id).subscribe((value) => {
      // If we have a value, set it on the edit target.
      if (value) {
        this.editTarget!.apolloId = value._id;
      }

      // Indicate that we're done.
      this.apolloCompanyChanged$.next('complete');
    });
  }

  // #endregion

  // #region Apollo Employees

  apolloEmployeeLoadState$!: Observable<ApolloEmployeeLoadedStateTypes>;

  apolloEmployeeLoadStateChanged$ = new Subject<void>();

  loadApolloEmployees(): void {
    if (!this.editTarget?.apolloId) {
      return;
    }

    this.clientApi.loadApolloEmployees(this.editTarget.apolloId).subscribe((result) => {
      // I know - inefficient, but reload the employ information.
      this.apolloEmployeeLoadStateChanged$.next();
    });
  }

  // #endregion

  get glassDoorLink(): string {
    if (!this.editTarget?.name) {
      return '';
    }

    // Get the domain-only.
    const domain = /([\w\d_\-]+\.[\w\d]+\b(?!\.))/.exec(this.editTarget.website);
    if (!domain) {
      return '';
    }

    return `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURI(domain[0])}`;
  }

}
