import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { TokenPayload } from '../../model/shared-models/token-payload.model';
import { ReadonlySubject } from '../../utils/readonly-subject';
import { nullToUndefined } from '../../utils/empty-and-null.utils';

/** The key to store/retrieve the auth token on the local machine. */
const tokenStoreKey = 't1';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  // TODO: Handle token expiration.

  constructor() {
    this.initialize();
  }

  /** Sets up the token local storage events. */
  private initialize(): void {
    // When creating, we need to try to get the token from the store.
    //  No observables are hooked up yet, so we don't have to worry
    //  about triggering any of them.
    this.token = this.getSavedToken();

    this.token$.subscribe(value => {
      if (value) {
        // Save the token to the local store.
        this.storeToken(value);
      } else {
        // Ensure we don't have a token value in the store.
        this.clearSavedToken();
      }
    });

  }

  //#region Token Property
  private readonly _token = new BehaviorSubject<string | undefined>(undefined);
  readonly token$ = this._token.asObservable();

  /** Gets or sets the API token used in the application. */
  get token(): string | undefined {
    return this._token.getValue();
  }

  set token(newVal: string | undefined) {
    this._token.next(newVal);
  }

  //#endregion

  private readonly _tokenPayload = new ReadonlySubject<TokenPayload | undefined>(
    this.token$.pipe(
      map(t => {
        if (t) {
          return this.parseToken(t);
        } else {
          return undefined;
        }
      })
    ));

  public readonly tokenPayload$ = this._tokenPayload.observable$;

  public get tokenPayload(): TokenPayload | undefined {
    return this._tokenPayload.value;
  }

  /** Attempts to parse a token, and return the TokenPayload. */
  parseToken(token: string): TokenPayload {
    if (!token) {
      throw new Error(`token was empty.`);
    }

    // Decode the Base64 token.
    return JSON.parse(atob(token.split('.')[1])) as TokenPayload;
  }

  //#region Token Local Storage
  /** Stores the auth token into the local store. */
  private storeToken(token: string): void {
    localStorage.setItem(tokenStoreKey, token);
  }

  /** Returns the auth token from the local store, if there is one. */
  private getSavedToken(): string | undefined {
    return nullToUndefined(localStorage.getItem(tokenStoreKey));
  }

  /** Clears any stored token in the local store. */
  private clearSavedToken(): void {
    localStorage.removeItem(tokenStoreKey);
  }

  //#endregion
}
