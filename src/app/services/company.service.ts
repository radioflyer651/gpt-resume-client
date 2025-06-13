import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientApiService } from './client-api.service';
import { combineLatestWith, EMPTY, filter, map, Observable, of, shareReplay, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ObjectId } from 'mongodb';
import { Company } from '../../model/shared-models/company.model';
import { LApolloOrganization } from '../../model/shared-models/apollo/apollo-local.model';
import { JobListingLine } from '../../model/shared-models/job-tracking/job-listing.model';
import { CompanyContact } from '../../model/shared-models/job-tracking/company-contact.model';
import { StateObservable } from '../../utils/state-observable.utils';
import { ApolloDataInfo } from '../../model/shared-models/apollo/apollo-data-info.model';
import { ReadonlySubject } from '../../utils/readonly-subject';
import { ApolloPerson } from '../../model/shared-models/apollo/apollo-api-response.model';
import { NewDbItem, UpsertDbItem } from '../../model/shared-models/db-operation-types.model';

export type CompanyLoadingTypes = 'init' | 'loading' | 'loaded' | 'error' | 'not-available' | 'linking';

export type CompanyServiceStateNames = 'company' | 'job-listings' | 'contact-list' | 'apollo-company' | 'apollo-employee-list' | 'apollo-employee-list-data';

/* NOTE:
*  ActivatedRoutes don't function properly in a service.  They tend to take the route at upper levels
*   in the component tree, if provided in the root.  Therefore, the service must be provided at the component level
*   using the providers property on the component.
* 
*   Further, since they must be implemented at lower levels, they will be destroyed at those levels too.
*   With that being the case, we need to explicitly clean up the services, through manual means.
*/

/** Provides company information for the current company, specified by the current route. */
@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  constructor(
    readonly router: Router,
    private route: ActivatedRoute,
    readonly apiService: ClientApiService,
  ) {
    this.initialize();
  }

  private ngDestroySubject = new Subject<Observable<void>>();

  /** Set by the owning component, used to cleanup observables on this service. */
  set destroyerObservable(newVal: Observable<void>) {
    this.ngDestroySubject.next(newVal);
  }

  /** Must be called manually. */
  private ngDestroy$ = this.ngDestroySubject.pipe(
    switchMap(destroyer => {
      return destroyer;
    })
  );


  initialize(): void {
    // this.companyId$ = this.route.paramMap.pipe(
    //   map(params => {
    //     if (params.has('companyId')) {
    //       return params.get('companyId') ?? undefined;
    //     }

    //     return undefined;
    //   }),
    //   takeUntil(this.ngDestroy$)
    // );

    this._companyId = new ReadonlySubject(this.ngDestroy$, this.route.paramMap.pipe(
      map(params => {
        if (params.has('companyId')) {
          return params.get('companyId') ?? undefined;
        }

        return undefined;
      }),
      takeUntil(this.ngDestroy$)
    ));


    this._company = new ReadonlySubject(EMPTY, this.getReloadObserver('company', this.companyId$.pipe(
      switchMap(companyId => {
        // We only want a persistent company that can be
        //  represented by an ID.  Even 'new' should not return anything.
        if (!companyId || companyId === 'new') {
          return of(createNewCompany());
        }

        const result = this.apiService.getCompanyById(companyId);
        this.stateObservable.wrapState(result, 'company', 'loading', 'loaded', 'error');
        return result;
      }),
      takeUntil(this.ngDestroy$),
    )));

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
      }),
      takeUntil(this.ngDestroy$),
    ));

    this.jobsListings$ = this.getReloadObserver('job-listings', this.companyId$.pipe(
      switchMap(companyId => {
        // We only want a persistent company that can be
        //  represented by an ID.  Even 'new' should not return anything.
        if (!companyId || companyId === 'new') {
          return of(undefined);
        }

        const result = this.apiService.getJobListingsByCompanyId(companyId);
        this.stateObservable.wrapState(result, 'job-listings', 'loading', 'loaded', 'error');
        return result;
      }),
      takeUntil(this.ngDestroy$),
    ));

    this.apolloCompanyId$ = this.company$.pipe(
      map(company => {
        // If there's no company, then there's no apolloCompany!
        if (!company || !company._id) {
          return undefined;
        }

        // Return the ID from this.
        return company.apolloId;
      }),
      takeUntil(this.ngDestroy$),
    );

    this.apolloCompany$ = this.getReloadObserver('apollo-company', this.apolloCompanyId$.pipe(
      switchMap(aCompanyId => {
        if (!aCompanyId) {
          this.stateObservable.setValue('apollo-company', 'init');
          return of(undefined);
        }

        const result = this.apiService.getApolloCompanyById(aCompanyId);
        return this.stateObservable.wrapState(result, 'apollo-company', 'loading', 'loaded', 'error');
      }),
      takeUntil(this.ngDestroy$),
    ));

    this.apolloEmployeeDataState$ = this.getReloadObserver('apollo-employee-list-data', this.apolloCompanyId$.pipe(
      switchMap((aCompanyId) => {
        if (!aCompanyId) {
          this.stateObservable.setValue('apollo-employee-list-data', 'init');
          return of(undefined);
        }

        const result = this.apiService.getApolloEmployeeStatusForApolloCompany(aCompanyId);
        return this.stateObservable.wrapState(result, 'apollo-employee-list-data', 'loading', 'loaded', 'error');
      }),
      takeUntil(this.ngDestroy$)
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
      }),
      takeUntil(this.ngDestroy$)
    ));

  }

  private stateObservable = new StateObservable<CompanyServiceStateNames, CompanyLoadingTypes>('init');

  /** Function to provide an Observable to a specified state on this service, which can be
   *   used for subscriptions to data changes. */
  subscribeToState(stateName: CompanyServiceStateNames) {
    return this.stateObservable.subscribeToState(stateName);
  }

  // companyId$!: Observable<ObjectId | 'new' | undefined>;

  // #region company
  private _company!: ReadonlySubject<UpsertDbItem<Company> | undefined>;

  get company$() {
    return this._company.observable$;
  }

  get company(): UpsertDbItem<Company> | undefined {
    return this._company.value;
  }
  // #endregion

  // companyId$!: Observable<ObjectId | 'new' | undefined>;

  // #region companyIdd
  private _companyId!: ReadonlySubject<ObjectId | 'new' | undefined>;

  get companyId$() {
    return this._companyId.observable$;
  }

  get companyId(): ObjectId | 'new' | undefined {
    return this._companyId.value;
  }
  // #endregion

  jobsListings$!: Observable<JobListingLine[] | undefined>;

  contactList$!: Observable<CompanyContact[] | undefined>;

  apolloCompanyId$!: Observable<string | undefined>;

  apolloCompany$!: Observable<LApolloOrganization | undefined>;

  apolloEmployeeList$!: Observable<ApolloPerson[] | undefined>;

  apolloEmployeeDataState$!: Observable<ApolloDataInfo | undefined>;

  /** Updates the apollo company on the current company, if one is attached. */
  findApolloCompany() {
    // We musth ave a company to do this.
    if (!this.company || !this.company._id) {
      this.stateObservable.setValue('apollo-company', 'not-available');
      return;
    }

    // Trigger the update.
    const result = this.apiService.updateApolloCompanyForCompany(this.company._id!);
    const wrappedResult = this.stateObservable.wrapState(result, 'apollo-company', 'linking', 'loaded', 'error').pipe(
      tap(value => {
        // This should be set for us to proceed, but stranger things have happened!
        if (!this.company) {
          return;
        }

        // Set the apollo ID on the company.
        this.company.apolloId = value;

        // Trigger a reload of the company.
        this.reloadProperty('apollo-company');
        this.reloadProperty('apollo-employee-list-data');
      }),
      shareReplay(1)
    );

    // If nothing subscribes, then nothing happens.  Let's subscribe to be sure.
    wrappedResult.subscribe(() => { });
    return wrappedResult;
  }

  /** Trigger observable for reloading the states of this observable. */
  private reloader$ = new Subject<CompanyServiceStateNames>();

  /** Triggers a reload of one (or more) of the states on this service. */
  reloadProperty(propertyName: CompanyServiceStateNames) {
    this.reloader$.next(propertyName);
  }

  /** Loads up the employee data from the Apollo. */
  loadApolloEmployees(): Observable<ApolloDataInfo | undefined> {
    if (!this.company?.apolloId) {
      return of(undefined);
    }

    return this.apiService.loadApolloEmployees(this.company.apolloId).pipe(
      tap(() => {
        // I know - inefficient, but reload the employ information.
        this.reloadProperty('apollo-employee-list-data');
      })
    );
  }

  /** Reloads the employee data from the Apollo. */
  resetAndReloadApolloEmployees(): Observable<ApolloDataInfo | undefined> {
    if (!this.company?.apolloId) {
      return of(undefined);
    }

    return this.apiService.resetAndReloadApolloEmployees(this.company.apolloId).pipe(
      tap(() => {
        // I know - inefficient, but reload the employ information.
        this.reloadProperty('apollo-employee-list-data');
      })
    );
  }


  /** Provides boiler-plate automate for triggering state reloads. */
  private getReloadObserver<T>(name: CompanyServiceStateNames, observable: Observable<T>): Observable<T> {
    return this.reloader$.pipe(
      filter(x => x === name),
      startWith(undefined)
    ).pipe(switchMap(() => observable));
  }
}

function createNewCompany(): NewDbItem<Company> {
  return {
    name: '',
    website: '',
    comments: []
  };
}
