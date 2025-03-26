import { Component } from '@angular/core';
import { ChatPopupService } from '../../services/chat-popup.service';
import { ButtonModule } from 'primeng/button';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-site-header',
  imports: [
    CommonModule,
    ButtonModule
  ],
  templateUrl: './site-header.component.html',
  styleUrls: ['./site-header.component.scss']
})
export class SiteHeaderComponent {
  constructor(
    readonly chatPopupService: ChatPopupService,
    readonly userService: UserService,
  ) {

  }

  showActorPopup(actor: string): void {
    this.chatPopupService.showChatWindow = true;
    this.chatPopupService.chatActor = actor;
  }

  logout(): void {
    this.userService.logout();
  }
}
