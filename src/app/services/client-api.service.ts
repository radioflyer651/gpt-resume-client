import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenPayload } from '../../model/shared-models/token-payload.model';
import { LoginRequest } from '../../model/shared-models/login-request.model';
import { environment } from '../../environments/environment';
import { EMPTY, map, Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import { ChatInfo, ClientChat } from '../../model/shared-models/chat-models.model';
import { ObjectId } from 'mongodb';
import { TarotGame } from '../../model/shared-models/tarot-game/tarot-game.model';
import { ChatTypes } from '../../model/shared-models/chat-types.model';
import { SiteSettings } from '../../model/shared-models/site-settings.model';
import { TarotCard, TarotCardDetails } from '../../model/shared-models/tarot-game/tarot-card.model';
import { Company } from '../../model/shared-models/company.model';
import { CompanyListingInfo } from '../../model/shared-models/company-listing.model';
import { CompanyContact } from '../../model/shared-models/job-tracking/company-contact.data';
import { JobListing, JobListingLine } from '../../model/shared-models/job-tracking/job-listing.model';
import { UpsertDbItem } from '../../model/shared-models/db-operation-types.model';
import { JobAnalysis } from '../../model/shared-models/job-tracking/job-analysis.model';
import { ApolloCompany } from '../../model/apollo/apollo-api-response.model';
import { LApolloOrganization } from '../../model/shared-models/apollo-local.model';

// Extract the type of the `post` method from `HttpClient`
type HttpClientPostMethod = HttpClient['post'];

// Extract the type of the `options` parameter from the `post` method
type HttpClientPostOptions = Parameters<HttpClientPostMethod>[2];

// Extract the type of the `post` method from `HttpClient`
type HttpClientGetMethod = HttpClient['get'];

// Extract the type of the `options` parameter from the `post` method
type HttpClientGetOptions = Parameters<HttpClientGetMethod>[1];

type HttpCallOptions = HttpClientGetOptions | HttpClientPostOptions;

class HttpOptionsBuilder {
  constructor(
    readonly parent: ClientApiService,
    readonly tokenService: TokenService,
  ) {
  }

  /** Shortcut to just return options with the authorization header. */
  withAuthorization(): HttpCallOptions {
    return this.buildOptions().addAuthToken().build();
  }

  buildOptions(): OptionsBuilderInternal {
    return new OptionsBuilderInternal(this);
  }
}

class OptionsBuilderInternal {
  constructor(
    readonly parent: HttpOptionsBuilder
  ) { }

  protected _optionsBuilder: Exclude<HttpCallOptions, undefined | null> = {};

  /** Returns the TokenService from the parent. */
  get tokenService() {
    return this.parent.tokenService;
  }

  /** Returns the API service from the parent. */
  get parentApiService() {
    return this.parent.parent;
  }

  /** Returns the headers property from the options. */
  private getHeaders(): { [key: string]: string; } {
    if (!this._optionsBuilder.headers) {
      this._optionsBuilder.headers = {} as { [key: string]: string; };
    }

    return this._optionsBuilder.headers as { [key: string]: string; };
  }

  /** Adds a token to the headers. */
  addAuthToken() {
    if (this.tokenService.token) {
      this.getHeaders()['Authorization'] = this.tokenService.token;
    }
    return this;
  }


  build(): HttpCallOptions {
    return this._optionsBuilder;
  }
}

@Injectable({
  providedIn: 'root',
})
export class ClientApiService {
  constructor(
    protected readonly http: HttpClient,
    protected readonly tokenService: TokenService,
  ) {
    this.optionsBuilder = new HttpOptionsBuilder(this, this.tokenService);
  }

  protected readonly optionsBuilder: HttpOptionsBuilder;

  /** The base URL to the API. */
  protected readonly baseUrl = environment.apiBaseUrl;

  /** Combines a specified path with the base URL. */
  private constructUrl(path: string) {
    return this.baseUrl + path;
  }

  /** Attempts to parse a token, and return the TokenPayload. */
  parseToken(token: string): TokenPayload {
    if (!token) {
      throw new Error(`token was empty.`);
    }

    // Decode the Base64 token.
    return JSON.parse(atob(token.split('.')[1])) as TokenPayload;
  }

  /** Makes a call to attempt to login the user with their credentials. */
  login(loginInfo: LoginRequest) {
    return this.http.post<string>(this.constructUrl('login'), loginInfo)
      .pipe(
        tap(response => {
          this.tokenService.token = response;
        })
      );
  }

  logout(): Observable<void> {
    this.tokenService.token = undefined;
    return EMPTY;
  }

  /** Returns the main chat for the current user. */
  getMainChat() {
    const options = this.optionsBuilder.withAuthorization();
    return this.http.get<ClientChat>(this.constructUrl('chat/main'), options);
  }

  startNewMainChat() {
    const options = this.optionsBuilder.withAuthorization();
    return this.http.get<ClientChat>(this.constructUrl('chat/main/start-new'), options);
  }

  /** Returns a chat specified by its ID. */
  getChatById(chatId: ObjectId): Observable<ClientChat> {
    return this.http.get<ClientChat>(this.constructUrl(`chat/${chatId}`),
      this.optionsBuilder.withAuthorization());
  }

  /** Gets all chats for the current user. */
  getChatList(): Observable<ChatInfo[]> {
    return this.http.get<ChatInfo[]>(this.constructUrl(`chat/for-user`), this.optionsBuilder.withAuthorization());
  }

  /** Returns all chats of a specified type from the server. */
  getChatsOfType(chatType: ChatTypes): Observable<ClientChat[]> {
    return this.http.get<ClientChat[]>(this.constructUrl(`chats-by-type/${chatType}`), this.optionsBuilder.withAuthorization());
  }

  getTarotGames(): Observable<TarotGame[]> {
    return this.http.get<TarotGame[]>(this.constructUrl(`tarot/games`), this.optionsBuilder.withAuthorization());
  }

  /** Deletes a game by its specified ID. */
  deleteGameById(gameId: ObjectId): Observable<void> {
    return this.http.delete<void>(this.constructUrl(`tarot/games/${gameId}`), this.optionsBuilder.withAuthorization());
  }

  /** Returns the site settings from the server, indicating what abilities the site has turned off or on. */
  getSiteSettings(): Observable<SiteSettings> {
    return this.http.get<SiteSettings>(this.constructUrl(`site/settings`), this.optionsBuilder.withAuthorization());
  }

  /** Returns details about a tarot card, specified by its ID. */
  getTarotCardDetails(cardId: ObjectId): Observable<TarotCard> {
    return this.http.get<TarotCard>(this.constructUrl(`tarot/card-details/${cardId}`), this.optionsBuilder.withAuthorization());
  }

  /** Returns all company listings in the system. */
  getAllCompanies(): Observable<CompanyListingInfo[]> {
    return this.http.get<CompanyListingInfo[]>(this.constructUrl('companies'), this.optionsBuilder.withAuthorization());
  }

  /** Returns a specified company from the server. */
  getCompanyById(companyId: ObjectId): Observable<Company> {
    return this.http.get<Company>(this.constructUrl(`companies/${companyId}`), this.optionsBuilder.withAuthorization());
  }

  getContactsByCompanyId(companyId: ObjectId): Observable<CompanyContact[]> {
    return this.http.get<CompanyContact[]>(this.constructUrl(`companies/${companyId}/contacts`), this.optionsBuilder.withAuthorization());
  }

  getJobListingsByCompanyId(companyId: ObjectId): Observable<JobListingLine[]> {
    return this.http.get<JobListingLine[]>(this.constructUrl(`companies/${companyId}/job-listings`), this.optionsBuilder.withAuthorization());
  }

  /** Returns all job listings in a shortened format. */
  getAllJobListings(): Observable<JobListingLine[]> {
    return this.http.get<JobListingLine[]>(this.constructUrl('job-listings'), this.optionsBuilder.withAuthorization());
  }

  getCompanyContactById(contactId: ObjectId): Observable<CompanyContact | undefined> {
    return this.http.get<CompanyContact | undefined>(this.constructUrl(`companies/contacts/${contactId}`), this.optionsBuilder.withAuthorization());
  }

  getJobListingById(jobListingId: ObjectId): Observable<JobListing | undefined> {
    return this.http.get<JobListing | undefined>(this.constructUrl(`companies/job-listings/${jobListingId}`), this.optionsBuilder.withAuthorization());
  }

  upsertContact(contact: UpsertDbItem<CompanyContact>): Observable<CompanyContact> {
    return this.http.post<CompanyContact>(this.constructUrl(`companies/contacts`), contact, this.optionsBuilder.withAuthorization());
  }

  upsertJobListing(jobListing: UpsertDbItem<JobListing>): Observable<JobListing> {
    return this.http.post<JobListing>(this.constructUrl(`companies/job-listings`), jobListing, this.optionsBuilder.withAuthorization());
  }

  /** Updates a specified company object on the server. */
  upsertCompany(company: UpsertDbItem<Company>): Observable<Company> {
    return this.http.post<Company>(this.constructUrl(`companies`), company, this.optionsBuilder.withAuthorization()).pipe(
      map(newVal => {
        // Ensure the original company has the new _id.
        //  If the company was being updated, then it should already
        //  have the original ID, and no actual change is made.
        company._id = newVal._id;

        return company as Company;
      })
    );
  }

  /** Deletes a company, specified by its ID, and all of its job descriptions and contacts. */
  deleteCompany(companyId: ObjectId): Observable<void> {
    return this.http.delete<void>(this.constructUrl(`companies/${companyId}`), this.optionsBuilder.withAuthorization());
  }

  /** Deletes a specified contact by their ID. */
  deleteContactById(contactId: ObjectId): Observable<void> {
    return this.http.delete<void>(this.constructUrl(`companies/contacts/${contactId}`), this.optionsBuilder.withAuthorization());
  }

  deleteJobListingById(listingId: ObjectId): Observable<void> {
    return this.http.delete<void>(this.constructUrl(`companies/job-listings/${listingId}`), this.optionsBuilder.withAuthorization());
  }

  /** Performs an AI Analysis on a specified Job, and returns the analysis to the caller.  This should be attached to the job itself when done. */
  updateJobListingAnalysis(jobId: ObjectId): Observable<JobAnalysis> {
    return this.http.get<JobAnalysis>(this.constructUrl(`job-listings/get-updated-analysis/${jobId}`), this.optionsBuilder.withAuthorization());
  }

  /** Returns a listing of all ApolloCompany objects in the database. */
  getApolloCompanyList(): Observable<LApolloOrganization[]> {
    return this.http.get<LApolloOrganization[]>(this.constructUrl(`apollo/companies`), this.optionsBuilder.withAuthorization());
  }

  /** Updates the Apollo database with the company data for the company that has the same domain as the one specified by id. */
  updateApolloCompanyForCompany(companyId: ObjectId): Observable<ObjectId> {
    return this.http.post<ObjectId>(this.constructUrl(`apollo/companies/update-for-company/${companyId}`), undefined, this.optionsBuilder.withAuthorization());
  }

  /** Given a specified id for an ApolloCompany, returns the company data in the databse, if it exists. */
  getApolloCompanyById(apolloCompanyId: ObjectId): Observable<LApolloOrganization | undefined> {
    return this.http.get<LApolloOrganization | undefined>(this.constructUrl(`apollo/companies/${apolloCompanyId}`), this.optionsBuilder.withAuthorization());
  }
}
