import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { PageSizeService } from '../../services/page-size.service';
import { MenuService } from '../../services/menu.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-site-header',
  imports: [
    CommonModule,
    ButtonModule,
    RouterModule,
  ],
  templateUrl: './site-header.component.html',
  styleUrls: ['./site-header.component.scss']
})
export class SiteHeaderComponent {
  constructor(
    readonly userService: UserService,
    readonly pageSizeService: PageSizeService,
    readonly menuService: MenuService
  ) {

  }

  logout(): void {
    this.userService.logout();
  }

  toggleMenu(): void {
    this.menuService.showMenu = !this.menuService.showMenu;
  }
}
