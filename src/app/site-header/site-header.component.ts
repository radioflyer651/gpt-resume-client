import { Component } from '@angular/core';
import { ChatPopupServiceService } from '../chat-popup-service.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-site-header',
  imports: [
    ButtonModule
  ],
  templateUrl: './site-header.component.html',
  styleUrls: ['./site-header.component.scss']
})
export class SiteHeaderComponent {
  constructor(readonly chatPopupService: ChatPopupServiceService) {

  }

  showActorPopup(actor: string): void {
    this.chatPopupService.showChatWindow = true;
    this.chatPopupService.chatActor = actor;
  }
}
