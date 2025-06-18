import { Component } from '@angular/core';
import { ComponentBase } from '../../component-base/component-base.component';
import { Company } from '../../../../model/shared-models/company.model';
import { ClientApiService } from '../../../services/client-api.service';
import { NewDbItem, UpsertDbItem } from '../../../../model/shared-models/db-operation-types.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, distinct, filter, lastValueFrom, map, Observable, of, shareReplay, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { CompanyContact } from '../../../../model/shared-models/job-tracking/company-contact.model';
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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { QuickJobServiceService } from '../../../quick-job-service.service';
import { TabsModule } from 'primeng/tabs';
import { ReadonlySubject } from '../../../../utils/readonly-subject';

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
    ProgressSpinnerModule,
    TabsModule,
  ],
  providers: [
    CompanyService,
    QuickJobServiceService,
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
    readonly quickCreateJobService: QuickJobServiceService,
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

    // Handle if the path has a job listing ID in it, and open the
    //  dialog if it does.
    this.route.paramMap.pipe(
      takeUntil(this.ngDestroy$)
    ).subscribe(params => {
      if (params.has('jobListingId')) {
        this.editJobListing(params.get('jobListingId')!);
      }
    });

    this.glassDoorCalculator = new GlassDoorCalculator();
    this.glassDoorCalculator.company = this.editTarget;
  }

  glassDoorCalculator!: GlassDoorCalculator;

  get websiteField(): string {
    return this.editTarget!.website;
  }
  set websiteField(value: string) {
    this.editTarget!.website = value.replace(/^https?:\/\//i, '');
  }

  get jobsSite(): string | undefined {
    return this.editTarget!.jobsSite;
  }
  set jobsSite(value: string) {
    this.editTarget!.jobsSite = value.replace(/^https?:\/\//i, '');
  }

  get jobSiteUrl(): string | undefined {
    if (!this.jobsSite?.trim()) {
      return undefined;
    }

    // Ensure there's no prefix.
    const url = this.jobsSite.replace(/^https?:\/\//i, '');

    // Confirm the format.
    if (!/([\w\d_-]{2,}\.)+([\w\d_-]{2,})/.test(url)) {
      return undefined;
    }

    // Return the URL for the link.
    return `https://${url}`;
  }

  /** Gets or sts the contacts for the company. */
  contacts?: CompanyContact[] = undefined;

  /** Gets or sets the job listings for the company. */
  jobListings?: JobListingLine[] = undefined;


  /** Gets or sets the company that's being edited. */
  private _editTarget: UpsertDbItem<Company> | undefined = undefined;
  get editTarget(): UpsertDbItem<Company> | undefined {
    return this._editTarget;
  }
  set editTarget(value: UpsertDbItem<Company> | undefined) {
    this._editTarget = value;
    this.glassDoorCalculator.company = value;
  }

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

  // #region Job Listing Dialog

  /** Gets or sets the ID (or new) of the job listing to be edited in the editor. */
  editJobListingTargetId: ObjectId | 'new' = 'new';

  private _isEditJobListingVisible: boolean = false;
  /** Controls whether or not the dialog to edit a job listing is open. */
  get isEditJobListingVisible(): boolean {
    return this._isEditJobListingVisible;
  }
  set isEditJobListingVisible(value: boolean) {
    this._isEditJobListingVisible = value;

    // If the dialog is closed, and we're at the path to show the listing, then
    //  we want to navigate back, so we don't have the "listing" path in the URL.
    if (!value && this.route.snapshot.paramMap.has('jobListingId')) {
      // We need to navigate back.
      this.router.navigate(['../../'], { relativeTo: this.route });
    }
  }

  quickCreateJob(): void {
    this.quickCreateJobService.createQuickJob(this.editTarget!._id, true);
  }

  // #endregion
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

  loadApolloEmployees(): void {
    this.isLoadingEmployees = true;
    this.companyService.loadApolloEmployees().subscribe((status) => {
      if (status && status.state === 'complete') {
        this.isApolloEmployeeListVisible = true;
      }

      this.isLoadingEmployees = false;
    });
  }

  resetAndReloadApolloEmployees(): void {
    this.isLoadingEmployees = true;
    this.companyService.resetAndReloadApolloEmployees().subscribe((status) => {
      if (status && status.state === 'complete') {
        this.isApolloEmployeeListVisible = true;
      }

      this.isLoadingEmployees = false;
    });
  }

  isLoadingEmployees: boolean = false;

  isApolloEmployeeListVisible: boolean = false;

  /** Contains the status of whether or not Apollo employee data has been loaded from apollo. */
  apolloEmployeeDataState: ApolloDataInfo | undefined;

  showApolloEmployeeList() {
    this.isApolloEmployeeListVisible = true;
  }

  hideApolloEmployeeList() {
    this.isApolloEmployeeListVisible = false;
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

/** Given a glassdoor average score, and total review count, if the scores were only 1 and 5 star,
 *   this class calculates the number of 5 stars and 1 stars required to produce the inputs.  */
export class GlassDoorCalculator {
  /** Gets or sets the company being worked with. */
  company?: UpsertDbItem<Company>;

  /** Gets or sets the total number of reviews in Glassdoor, for the company. */
  get reviewCount(): number {
    return this.company?.glassDoorNumberOfReviews ?? 0;
  }
  set reviewCount(value: number) {
    if (this.company) {
      this.company.glassDoorNumberOfReviews = value;
    }
  }

  /** Gets or sets the average score in Glassdoor for the company. */
  get averageScore(): number {
    return this.company?.glassDoorAverageScore ?? 0;
  }
  set averageScore(value: number) {
    if (this.company) {
      this.company.glassDoorAverageScore = value;
    }
  }

  /** Internal, returns the total number of stars received. */
  protected get totalScore(): number {
    return this.averageScore * this.reviewCount;
  }

  /** Returns the total number of 5 star reviews required for the company. */
  get fiveStartCount(): number {
    return Math.floor((this.totalScore - this.reviewCount) / 4);
  }

  /** Returns the total number of 1 star reviews required for the company. */
  get oneStarCount(): number {
    return this.reviewCount - this.fiveStartCount;
  }

}