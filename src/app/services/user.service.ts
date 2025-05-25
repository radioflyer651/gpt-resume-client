import { Injectable } from '@angular/core';
import { ClientApiService } from './client-api.service';
import { BehaviorSubject, map, Observable, shareReplay, takeUntil } from 'rxjs';
import { LoginRequest } from '../../model/shared-models/login-request.model';
import { MessagingService } from './messaging.service';
import { TokenPayload } from '../../model/shared-models/token-payload.model';
import { SiteUser } from '../../model/site-user.model';
import { TokenService } from './token.service';
import { ReadonlySubject } from '../../utils/readonly-subject';
import { Router } from '@angular/router';
import { ComponentBase } from '../components/component-base/component-base.component';

@Injectable({
  providedIn: 'root'
})
export class UserService extends ComponentBase {
  constructor(
    readonly clientApiService: ClientApiService,
    readonly messagingService: MessagingService,
    readonly tokenService: TokenService,
    readonly router: Router,
  ) {
    super();

    // Setup the user property.
    this._user = new ReadonlySubject<SiteUser | undefined>(
      this.ngDestroy$,
      tokenService.tokenPayload$.pipe(
        map(token => {
          if (token) {
            return tokenToUser(token);
          } else {
            return undefined;
          }
        })
      )
    );
    this.user$ = this._user.observable$;

    this._isUserLoggedIn = new ReadonlySubject(
      this.ngDestroy$,
      this.user$.pipe(
        map(v => !!v)
      ));
    this.isUserLoggedIn$ = this._isUserLoggedIn.observable$;
  }


  //#region User Property

  private readonly _user: ReadonlySubject<SiteUser | undefined>;

  public readonly user$: Observable<SiteUser | undefined>;

  /** Returns the SiteUser from the logged in user info. */
  public get user(): SiteUser | undefined {
    return this._user.value;
  }

  //#endregion

  /** Observable that returns a boolean value indicating whether or not a user is currently logged in. */

  private readonly _isUserLoggedIn: ReadonlySubject<boolean>;

  public readonly isUserLoggedIn$: Observable<boolean>;

  public get isUserLoggedIn(): boolean {
    return this._isUserLoggedIn.value;
  }


  /** Attempts to login with specified user credentials, and then
   *   sets the user upon successful login. */
  login(request: LoginRequest): Promise<void> {
    return new Promise((res, rej) => {
      this.clientApiService.login(request).subscribe({
        next: (response) => {
          // Inform the user they've been logged in.
          if (this.user) {
            this.messagingService.sendUserMessage(
              {
                title: 'Login Success',
                content: `Welcome ${this.user.name} !`,
                level: 'success'
              }
            );

          }
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
    this.router.navigate(['/']);
    this.clientApiService.logout();
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