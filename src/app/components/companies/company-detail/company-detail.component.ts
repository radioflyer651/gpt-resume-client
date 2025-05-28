import { Component } from '@angular/core';
import { ComponentBase } from '../../component-base/component-base.component';
import { Company } from '../../../../model/shared-models/company.model';
import { ClientApiService } from '../../../services/client-api.service';
import { NewDbItem, UpsertDbItem } from '../../../../model/shared-models/db-operation-types.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { distinct, lastValueFrom, map, Observable, of, startWith, Subject, switchMap, takeUntil } from 'rxjs';
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
  ) {
    super();

  }

  /** Company ID obtained from the route parameters. */
  companyId$!: Observable<ObjectId>;

  /** Triggered when the contact list is changed. */
  contactsChanged$ = new Subject<void>();

  /** Emitted when the job listings have changed. */
  jobListingsChanged$ = new Subject<void>();

  ngOnInit() {
    // Observable to get the company ID from the route.
    this.companyId$ = this.route.paramMap.pipe(
      map(pm => pm.get('companyId')!),
      distinct(),
      takeUntil(this.ngDestroy$)
    );

    // Get the company from the ID.
    const companyFromId$ = this.companyId$.pipe(switchMap(id => {
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
    }));

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
    if (/^([\w\d\-]+\.){2,}/i.test(value)) {
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
    await this.clientApi.deleteJobListingById(jobListingId);

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

}
