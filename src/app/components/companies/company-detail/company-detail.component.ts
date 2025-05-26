import { Component } from '@angular/core';
import { ComponentBase } from '../../component-base/component-base.component';
import { Company } from '../../../../model/shared-models/company.model';
import { ClientApiService } from '../../../services/client-api.service';
import { NewDbItem, UpsertDbItem } from '../../../../model/shared-models/db-operation-types.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { map, Observable, of, startWith, Subject, switchMap, takeUntil } from 'rxjs';
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
  ],
  templateUrl: './company-detail.component.html',
  styleUrl: './company-detail.component.scss'
})
export class CompanyDetailComponent extends ComponentBase {
  constructor(
    readonly clientApi: ClientApiService,
    readonly router: Router,
    readonly route: ActivatedRoute,
  ) {
    super();

  }

  /** Company ID obtained from the route parameters. */
  companyId$!: Observable<ObjectId>;

  /** Triggered when the contact list is changed. */
  contactsChanged$ = new Subject<void>();

  ngOnInit() {
    // Observable to get the company ID from the route.
    this.companyId$ = this.route.paramMap.pipe(
      map(pm => pm.get('companyId')!),
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
    const contactsFromId$ = this.companyId$.pipe(switchMap(id => {
      // If the ID is new, then we don't have any contacts.
      if (id === 'new') {
        return of([]);
      } else {
        // Clear the property while it's being retrieved from the server.
        //  If another call is made, this part should be synchronous, and ultimately
        //  be resolved by the next call.
        this.contacts = undefined;
        return this.clientApi.getContactsByCompanyId(id);
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
        return this.contactsChanged$.pipe(
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

  /** Gets or sts the contacts for the company. */
  contacts?: CompanyContact[] = undefined;

  /** Gets or sets the job listings for the company. */
  jobListings?: JobListingLine[] = undefined;

  /** Gets or sets the company that's being edited. */
  editTarget: UpsertDbItem<Company> | undefined;

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
  isNewContactVisible = false;

  editContactTargetId: ObjectId | 'new' = 'new';

  /** Called to edit or create a new contact. */
  editContact(id: ObjectId | 'new') {
    this.editContactTargetId = id;
    this.isNewContactVisible = true;
  }

  onNewContactClosed(cancelled: boolean): void {
    if (!cancelled) {
      // Trigger a refresh on the contact list.
      this.contactsChanged$.next();
    }
  }
}
