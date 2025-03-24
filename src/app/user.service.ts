import { Injectable } from '@angular/core';
import { ClientApiService } from './client-api.service';
import { BehaviorSubject } from 'rxjs';
import { User } from '../model/shared-models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {
  constructor(private readonly clientApiService: ClientApiService) { }

  private readonly _user = new BehaviorSubject<User | undefined>(undefined);
  readonly user$ = this._user.asObservable();

  public get user(): User | undefined {
    return this._user.getValue();
  }

  public set user(newVal: User | undefined) {
    this._user.next(newVal);
  }

}
