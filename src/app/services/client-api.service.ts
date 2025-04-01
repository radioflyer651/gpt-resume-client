import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenPayload } from '../../model/shared-models/token-payload.model';
import { LoginRequest } from '../../model/shared-models/login-request.model';
import { environment } from '../../environments/environment';
import { EMPTY, Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import { ChatInfo, ClientChat } from '../../model/shared-models/chat-models.model';
import { ObjectId } from 'mongodb';
import { TarotGame } from '../../model/shared-models/tarot-game/tarot-game.model';
import { ChatTypes } from '../../model/shared-models/chat-types.model';

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
}
