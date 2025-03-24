import { Injectable } from '@angular/core';
import { ClientApiService } from './client-api.service';
import { BehaviorSubject, map } from 'rxjs';
import { User } from '../model/shared-models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {
  constructor(private readonly clientApiService: ClientApiService) { }

  private readonly _user = new BehaviorSubject<User | undefined>(undefined);
  readonly user$ = this._user.asObservable();

  /** Gets or sets the currently logged in user. */
  get user(): User | undefined {
    return this._user.getValue();
  }

  set user(newVal: User | undefined) {
    this._user.next(newVal);
  }

  /** Observable that returns a boolean value indicating whether or not a user is currently logged in. */
  readonly isUserLoggedIn$ = this.user$.pipe(
    map(user => !!user)
  );
}
