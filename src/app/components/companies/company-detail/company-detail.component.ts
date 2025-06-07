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
import { ApolloDataInfo, ApolloDataStateTypes } from '../../../../model/shared-models/apollo/apollo-data-info.model';
import { CompanyService } from '../../../services/company.service';
import { EmployeeListComponent } from "../../apollo/employee-list/employee-list.component";
import { DialogModule } from 'primeng/dialog';

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
    EmployeeListComponent,
    DialogModule,
  ],
  providers: [
    CompanyService
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
    readonly companyService: CompanyService,
    readonly apolloService: ApolloService,
  ) {
    super();
    this.companyService.destroyerObservable = this.ngDestroy$;
  }

  ngOnInit() {
    this.companyService.contactList$.pipe(takeUntil(this.ngDestroy$))
      .subscribe(contactList => {
        this.contacts = contactList;
      });

    this.companyService.jobsListings$.pipe(takeUntil(this.ngDestroy$))
      .subscribe(jobListings => {
        this.jobListings = jobListings;
      });

    this.companyService.company$.pipe(takeUntil(this.ngDestroy$))
      .subscribe(company => {
        if (!company) {
          return company;
        }

        this.editTarget = { ...company };
      });

    this.companyService.apolloEmployeeDataState$.subscribe(value => {
      this.apolloEmployeeDataState = value;
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
      this.companyService.reloadProperty('contact-list');
    }
  }

  /** Deletes a specified contact from the server, and the UI. */
  private async deleteContact(contactId: ObjectId): Promise<void> {
    await lastValueFrom(this.clientApi.deleteContactById(contactId));
    // Lazy - reloading the contacts from the server.
    this.companyService.reloadProperty('contact-list');
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
      this.companyService.reloadProperty('job-listings');
    }
  }

  /** Deletes a job listing, specified by its ID, on the server. */
  private async deleteJobListing(jobListingId: ObjectId): Promise<void> {
    // Delete the listing on the server.
    await lastValueFrom(this.clientApi.deleteJobListingById(jobListingId));

    // Lazy - update the job listings.
    this.companyService.reloadProperty('job-listings');
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

  findApolloCompany() {
    this.companyService.findApolloCompany();
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

  isApolloEmployeeListVisible: boolean = false;

  /** Contains the status of whether or not Apollo employee data has been loaded from apollo. */
  apolloEmployeeDataState: ApolloDataInfo | undefined;

  showApolloEmployeeList() {
    this.isApolloEmployeeListVisible = true;
  }

  hideApolloEmployeeList() {
    this.isApolloEmployeeListVisible = false;
  }

}
