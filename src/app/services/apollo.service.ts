import { Injectable } from '@angular/core';
import { ClientApiService } from './client-api.service';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { ObjectId } from 'mongodb';
import { MessagingService } from './messaging.service';
import { LApolloOrganization, LApolloPerson } from '../../model/shared-models/apollo/apollo-local.model';

@Injectable({
  providedIn: 'root'
})
export class ApolloService {
  constructor(
    readonly clientApiService: ClientApiService,
    readonly messagingService: MessagingService,
  ) { }

  /** Returns all ApolloCompanies from the server. (simplified form for listing.) */
  getAllCompanies(): Observable<LApolloOrganization[]> {
    return this.clientApiService.getApolloCompanyList();
  }

  getApolloCompanyById(companyId: ObjectId): Observable<LApolloOrganization | undefined> {
    return this.clientApiService.getApolloCompanyById(companyId);
  }

  updateApolloCompanyForCompanyId(localCompanyId: ObjectId): Observable<LApolloOrganization | undefined> {
    return this.clientApiService.updateApolloCompanyForCompany(localCompanyId).pipe(
      switchMap((companyId) => {
        if (!companyId) {
          return of(undefined);
        }

        return this.clientApiService.getApolloCompanyById(companyId);
      }),
      catchError((err) => {
        this.messagingService.sendUserMessage(
          {
            level: 'error',
            title: 'Error updating Apollo Company',
            content: `Failed to update Apollo Company for company ID ${localCompanyId}: ${err.message}`
          }
        );

        return of(undefined);
      }));
  }

  /** Returns all employees for a specified apollo company ID. */
  getEmployeesForApolloCompanyId(apolloCompanyId: string): Observable<LApolloPerson> {
    return this.clientApiService.getApolloEmployeeStatusForApolloCompany(apolloCompanyId);
  }
}
