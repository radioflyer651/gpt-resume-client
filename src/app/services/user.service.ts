import { Injectable } from '@angular/core';
import { ClientApiService } from './client-api.service';
import { BehaviorSubject, map, shareReplay, takeUntil } from 'rxjs';
import { LoginRequest } from '../../model/shared-models/login-request.model';
import { MessagingService } from './messaging.service';
import { TokenPayload } from '../../model/shared-models/token-payload.model';
import { SiteUser } from '../../model/site-user.model';
import { nullToUndefined } from '../../utils/empty-and-null.utils';

/** The key to store/retrieve the auth token on the local machine. */
const tokenStoreKey = 't1';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private readonly clientApiService: ClientApiService,
    private readonly messagingService: MessagingService
  ) {
    this.initialize();
  }

  initialize(): void {
    // TODO: We need to account for when the token is expired.

    // Get the token from the local store, if we have one.
    const token = this.getSavedToken();

    if (token) {
      // Update the token in the client API.
      this.clientApiService.setToken(token);

      // Update the user.
      this.user = tokenToUser(this.clientApiService.parseToken(token));

      // Welcome the user back.  Give it a moment, since the app may not be loaded yet.
      setTimeout(() => {
        this.messagingService.sendUserMessage(
          {
            level: 'info',
            title: 'Welcome!',
            content: `Welcome back ${this.user!.name}`
          }
        );
      });
    }
  }

  private readonly _user = new BehaviorSubject<SiteUser | undefined>(undefined);

  /** Observable emitting the value of the logged in SiteUser. */
  readonly user$ = this._user.asObservable();

  /** Gets or sets the currently logged in user. */
  get user(): SiteUser | undefined {
    return this._user.getValue();
  }

  set user(newVal: SiteUser | undefined) {
    this._user.next(newVal);
  }

  /** Observable that returns a boolean value indicating whether or not a user is currently logged in. */
  readonly isUserLoggedIn$ = this.user$.pipe(
    map(user => !!user),
    shareReplay(1)
  );

  /** Attempts to login with specified user credentials, and then
   *   sets the user upon successful login. */
  login(request: LoginRequest): Promise<void> {
    return new Promise((res, rej) => {
      this.clientApiService.login(request).subscribe({
        next: (response) => {
          // Store the token into the local store.
          this.storeToken(this.clientApiService.token);

          // Convert the response (TokenPayload) to a user.
          this.user = tokenToUser(response);

          // Inform the user they've been logged in.
          this.messagingService.sendUserMessage(
            {
              title: 'Login Success',
              content: `Welcome ${this.user.name} !`,
              level: 'success'
            }
          );
          res();
        },
        error: err => {
          this.messagingService.sendUserMessage(
            {
              level: 'error',
              content: `Sorry, we could not log you in at this time.`,
              title: 'Login Unsuccessful'
            }
          );
        }
      });
    });
  }

  logout(): void {
    this.clientApiService.logout();
    this.clearSavedToken();
    this.user = undefined;
  }

  /** Stores the auth token into the local store. */
  storeToken(token: string): void {
    localStorage.setItem(tokenStoreKey, token);
  }

  /** Returns the auth token from the local store, if there is one. */
  getSavedToken(): string | undefined {
    return nullToUndefined(localStorage.getItem(tokenStoreKey));
  }

  /** Clears any stored token in the local store. */
  clearSavedToken(): void {
    localStorage.removeItem(tokenStoreKey);
  }
}

/** Ensures the specified TokenPayload has a userId, and then returns
 *   the token as a SiteUser. */
function tokenToUser(token: TokenPayload): SiteUser {
  // Ensure we have a user ID.
  if (!token.userId) {
    throw new Error(`Expected userId on TokenPayload, but got none.`);
  }

  return token as SiteUser;
}