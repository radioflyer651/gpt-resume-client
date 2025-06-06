import { Injectable } from '@angular/core';
import { ClientApiService } from './client-api.service';
import { ApolloCompany } from '../../model/apollo/apollo-api-response.model';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { ObjectId } from 'mongodb';
import { MessageService } from 'primeng/api';
import { MessagingService } from './messaging.service';

@Injectable({
  providedIn: 'root'
})
export class ApolloService {
  constructor(
    readonly clientApiService: ClientApiService,
    readonly messagingService: MessagingService,
  ) { }

  /** Returns all ApolloCompanies from the server. (simplified form for listing.) */
  getAllCompanies(): Observable<ApolloCompany[]> {
    return this.clientApiService.getApolloCompanyList();
  }

  getApolloCompanyById(companyId: ObjectId): Observable<ApolloCompany | undefined> {
    return this.clientApiService.getApolloCompanyById(companyId);
  }

  updateApolloCompanyForCompanyId(localCompanyId: ObjectId): Observable<ApolloCompany | undefined> {
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
}
