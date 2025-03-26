import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenPayload } from '../../model/shared-models/token-payload.model';
import { LoginRequest } from '../../model/shared-models/login-request.model';
import { environment } from '../../environments/environment';
import { EMPTY, Observable, tap } from 'rxjs';
import { TokenService } from './token.service';

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
  ) { }

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
  protected _optionsHeaders!: HttpHeaders;

  /** Returns the TokenService from the parent. */
  get tokenService() {
    return this.parent.tokenService;
  }

  /** Returns the API service from the parent. */
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

  /** Adds a token to the headers. */
  addAuthToken() {
    if (this.tokenService.token) {
      this.getHeaders().set('authorization', this.tokenService.token);
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
    readonly http: HttpClient,
    readonly tokenService: TokenService,
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
    return this.http.get(this.constructUrl('api/chat/main'), this.optionsBuilder.withAuthorization());
  }
}
