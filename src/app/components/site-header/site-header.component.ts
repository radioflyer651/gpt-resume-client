import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { PageSizeService } from '../../services/page-size.service';
import { MenuService } from '../../services/menu.service';
import { RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { LoginComponent } from "../login/login.component";
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-site-header',
  imports: [
    CommonModule,
    ButtonModule,
    RouterModule,
    DialogModule,
    LoginComponent
  ],
  templateUrl: './site-header.component.html',
  styleUrls: ['./site-header.component.scss']
})
export class SiteHeaderComponent {
  constructor(
    readonly userService: UserService,
    readonly pageSizeService: PageSizeService,
    readonly menuService: MenuService,
    readonly tokenService: TokenService,
  ) {

  }

  ngOnInit(): void {
    this.tokenService.tokenPayload$.subscribe(payload => {
      if (payload) {
        // Close the login dialog when the user does login.
        this.isLoginDialogVisible = false;
      }
    });
  }

  logout(): void {
    this.userService.logout();
  }

  /** Controls whether or not the login dialog is visible. */
  isLoginDialogVisible = false;

  /** Shows the login dialog. */
  login(): void {
    this.isLoginDialogVisible = true;
  }

  toggleMenu(): void {
    this.menuService.showMenu = !this.menuService.showMenu;
  }
}
