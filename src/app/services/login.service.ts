import { Injectable } from '@angular/core';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    readonly tokenService: TokenService,
  ) {
    this.initialize();
  }

  initialize(): void {
    this.tokenService.tokenPayload$.subscribe(payload => {
      if (payload) {
        // Close the login dialog when the user does login.
        this.isLoginDialogOpen = false;
      }
    });
  }

  /** Controls the state of the login dialog. */
  login(): void {
    this.isLoginDialogOpen = true;
  }

  /** Controls whether or not the login dialog is open. */
  isLoginDialogOpen: boolean = false;
}
