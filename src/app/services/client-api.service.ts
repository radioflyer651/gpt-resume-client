import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenPayload } from '../../model/shared-models/token-payload.model';
import { LoginRequest } from '../../model/shared-models/login-request.model';
import { environment } from '../../environments/environment';
import { EMPTY, map, Observable, tap } from 'rxjs';
import { nullToUndefined } from '../../utils/empty-and-null.utils';

// Extract the type of the `post` method from `HttpClient`
type HttpClientPostMethod = HttpClient['post'];

// Extract the type of the `options` parameter from the `post` method
type HttpClientPostOptions = Parameters<HttpClientPostMethod>[2];

// Extract the type of the `post` method from `HttpClient`
type HttpClientGetMethod = HttpClient['get'];

// Extract the type of the `options` parameter from the `post` method
type HttpClientGetOptions = Parameters<HttpClientGetMethod>[1];

type HttpCallOptions = HttpClientGetOptions | HttpClientPostOptions;

/** The key to store/retrieve the auth token on the local machine. */
const tokenStoreKey = 't1';

class HttpOptionsBuilder {
  constructor(public readonly parent: ClientApiService) { }

  /** Shortcut to just return options with the authorization header. */
  withAuthorization(): HttpCallOptions {
    return this.buildOptions().addAuthToken().build();
  }

  buildOptions(): OptionsBuilderInternal {
    return new OptionsBuilderInternal(this);
  }
}

class OptionsBuilderInternal {
  constructor(private readonly parent: HttpOptionsBuilder) { }

  protected _optionsBuilder: Exclude<HttpCallOptions, undefined | null> = {};
  protected _optionsHeaders!: HttpHeaders;


  get parentApiService() {
    return this.parent.parent;
  }

  /** Returns the headers property from the options. */
  private getHeaders(): HttpHeaders {
    if (!this._optionsHeaders) {
      this._optionsHeaders = new HttpHeaders();
      this._optionsBuilder.headers = this._optionsHeaders;
    }

    return this._optionsHeaders;
  }

  addAuthToken() {
    this.getHeaders().set('authorization', this.parentApiService.token);
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
  constructor(private readonly http: HttpClient) { }

  protected readonly optionsBuilder = new HttpOptionsBuilder(this);

  /** The base URL to the API. */
  protected readonly baseUrl = environment.apiBaseUrl;

  /** Combines a specified path with the base URL. */
  private constructUrl(path: string) {
    return this.baseUrl + path;
  }

  /** Gets or sets the auth token to add to the headers of API calls. */
  private _token: string = '';

  /** Returns the auth token to add to the headers of API calls. */
  get token() {
    return this._token;
  }

  /** Sets the token from an external source.  This is primarily
   *   for initializing the application on startup, when the token has been stored. */
  setToken(token: string) {
    this._token = token;
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
    return this.http.post<string>(
      this.constructUrl('login'),
      loginInfo).pipe(
        tap(response => {
          this._token = response;
        }),
        map(response => {
          const payload = this.parseToken(response);
          return payload;
        })
      );
  }

  logout(): Observable<void> {
    this._token = '';
    return EMPTY;
  }

  /** Returns the main chat for the current user. */
  getMainChat() {
    return this.http.get(this.constructUrl('api/chat/main'), this.optionsBuilder.withAuthorization());
  }
}
