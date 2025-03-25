import { Injectable } from '@angular/core';
import { ClientApiService } from './client-api.service';
import { BehaviorSubject, map, shareReplay, takeUntil } from 'rxjs';
import { LoginRequest } from '../../model/shared-models/login-request.model';
import { MessagingService } from './messaging.service';
import { ComponentBase } from '../component-base/component-base.component';
import { TokenPayload } from '../../model/shared-models/token-payload.model';
import { SiteUser } from '../../model/site-user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService extends ComponentBase {
  constructor(
    private readonly clientApiService: ClientApiService,
    private readonly messagingService: MessagingService
  ) {
    super();
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
      this.clientApiService.login(request).pipe(
        takeUntil(this.ngDestroy$)
      ).subscribe({
        next: (response) => {
          this.user = tokenToUser(response);
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
    this.user = undefined;
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