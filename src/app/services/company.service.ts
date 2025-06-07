import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientApiService } from './client-api.service';
import { combineLatestWith, distinct, filter, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { ObjectId } from 'mongodb';
import { Company } from '../../model/shared-models/company.model';
import { LApolloOrganization, LApolloPerson } from '../../model/shared-models/apollo/apollo-local.model';
import { JobListing, JobListingLine } from '../../model/shared-models/job-tracking/job-listing.model';
import { CompanyContact } from '../../model/shared-models/job-tracking/company-contact.data';
import { StateObservable } from '../../utils/state-observable.utils';
import { ApolloDataInfo } from '../../model/shared-models/apollo/apollo-data-info.model';

export type CompanyLoadingTypes = 'init' | 'loading' | 'loaded' | 'error' | 'not-available';

export type CompanyServiceStateNames = 'company' | 'jobListings' | 'contact-list' | 'apollo-company' | 'apollo-employee-list' | 'apollo-employee-list-data';

/** Provides company information for the current company, specified by the current route. */
@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  constructor(
    readonly router: Router,
    readonly route: ActivatedRoute,
    readonly apiService: ClientApiService,
  ) {
    this.initialize();

  }

  initialize(): void {
    this.companyId$ = this.route.paramMap.pipe(
      map(params => {
        if (params.has('companyId')) {
          // Get the ID from the route.
          const companyId = params.get('companyId');

          // We can only return an ID if it's a string.
          if (typeof companyId === 'string') {
            return companyId;
          }
        }

        // No ID, or if the ID's not a string, then... what do you do?
        return undefined;
      }),
      distinct(),
    );

    this.company$ = this.getReloadObserver('company', this.companyId$.pipe(
      switchMap(companyId => {
        // We only want a persistent company that can be
        //  represented by an ID.  Even 'new' should not return anything.
        if (!companyId || companyId === 'new') {
          return of(undefined);
        }

        const result = this.apiService.getCompanyById(companyId);
        this.stateObservable.wrapState(result, 'company', 'loading', 'loaded', 'error');
        return result;
      })));

    this.contactList$ = this.getReloadObserver('contact-list', this.companyId$.pipe(
      switchMap(companyId => {
        // We only want a persistent company that can be
        //  represented by an ID.  Even 'new' should not return anything.
        if (!companyId || companyId === 'new') {
          return of(undefined);
        }

        const result = this.apiService.getContactsByCompanyId(companyId);
        this.stateObservable.wrapState(result, 'contact-list', 'loading', 'loaded', 'error');
        return result;
      })));

    this.jobsListings$ = this.getReloadObserver('jobListings', this.companyId$.pipe(
      switchMap(companyId => {
        // We only want a persistent company that can be
        //  represented by an ID.  Even 'new' should not return anything.
        if (!companyId || companyId === 'new') {
          return of(undefined);
        }

        const result = this.apiService.getJobListingsByCompanyId(companyId);
        this.stateObservable.wrapState(result, 'jobListings', 'loading', 'loaded', 'error');
        return result;
      })));

    this.apolloCompanyId$ = this.apolloCompany$.pipe(
      map(company => {
        // If there's no company, then there's no apolloCompany!
        if (!company) {
          return undefined;
        }

        // Return the ID from this.
        return company.apolloAccountId;
      })
    );

    this.apolloCompany$ = this.getReloadObserver('apollo-company', this.apolloCompanyId$.pipe(
      switchMap(aCompanyId => {
        if (!aCompanyId) {
          this.stateObservable.setValue('apollo-company', 'init');
          return of(undefined);
        }

        const result = this.apiService.getApolloCompanyById(aCompanyId);
        return this.stateObservable.wrapState(result, 'apollo-company', 'loading', 'loaded', 'error');
      })
    ));

    this.apolloEmployeeDataState$ = this.getReloadObserver('apollo-employee-list-data', this.apolloCompanyId$.pipe(
      switchMap((aCompanyId) => {
        if (!aCompanyId) {
          this.stateObservable.setValue('apollo-employee-list-data', 'init');
          return of(undefined);
        }

        const result = this.apiService.getApolloEmployeeStatusForApolloCompany(aCompanyId);
        return this.stateObservable.wrapState(result, 'apollo-employee-list-data', 'loading', 'loaded', 'error');
      })
    ));

    this.apolloEmployeeList$ = this.getReloadObserver('apollo-employee-list', this.apolloCompanyId$.pipe(
      combineLatestWith(this.apolloEmployeeDataState$),
      switchMap(([aCompanyId, employeeDataInfo]) => {
        if (!aCompanyId || !employeeDataInfo) {
          this.stateObservable.setValue('apollo-employee-list', 'init');
          return of(undefined);
        }

        if (employeeDataInfo.state !== 'complete') {
          this.stateObservable.setValue('apollo-employee-list', 'init');
          return of(undefined);
        }

        const result = this.apiService.getApolloEmployeesForApolloCompany(aCompanyId);
        return this.stateObservable.wrapState(result, 'apollo-employee-list', 'loading', 'loaded', 'error');
      })
    ));

  }

  private stateObservable = new StateObservable<CompanyServiceStateNames, CompanyLoadingTypes>('init');

  /** Function to provide an Observable to a specified state on this service, which can be
   *   used for subscriptions to data changes. */
  subscribeToState(stateName: CompanyServiceStateNames) {
    return this.stateObservable.subscribeToState(stateName);
  }

  companyId$!: Observable<ObjectId | 'new' | undefined>;

  company$!: Observable<Company | undefined>;

  jobsListings$!: Observable<JobListingLine[] | undefined>;

  contactList$!: Observable<CompanyContact[] | undefined>;

  apolloCompanyId$!: Observable<string | undefined>;

  apolloCompany$!: Observable<LApolloOrganization | undefined>;

  apolloEmployeeList$!: Observable<LApolloPerson[] | undefined>;

  apolloEmployeeDataState$!: Observable<ApolloDataInfo | undefined>;

  /** Trigger observable for reloading the states of this observable. */
  private reloader$ = new Subject<CompanyServiceStateNames>();

  /** Triggers a reload of one (or more) of the states on this service. */
  reloadProperty(propertyName: CompanyServiceStateNames) {
    this.reloader$.next(propertyName);
  }

  /** Provides boiler-plate automate for triggering state reloads. */
  private getReloadObserver<T>(name: CompanyServiceStateNames, observable: Observable<T>): Observable<T> {
    return this.reloader$.pipe(
      filter(x => x === name),
      startWith(undefined)
    ).pipe(switchMap(() => observable));
  }
}
