import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenPayload } from '../model/shared-models/token-payload.model';
import { LoginRequest } from '../model/shared-models/login-request.model';

@Injectable({
  providedIn: 'root',
})
export class ClientApiService {
  constructor(private readonly http: HttpClient) { }

  /** Makes a call to attempt to login the user with their credentials. */
  login(loginInfo: LoginRequest) {
    return this.http.post<TokenPayload>('api/login', loginInfo);
  }
}
