import { Component, Input } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { ChatService } from '../../../services/chat.service';
import { SiteSettingsService } from '../../../services/site-settings.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-chat-message',
  imports: [
    CommonModule,
    ButtonModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss'
})
export class ChatMessageComponent {
  constructor(
    readonly userService: UserService,
    readonly sanitizer: DomSanitizer,
    readonly chatService: ChatService,
    readonly siteSettingsService: SiteSettingsService,
  ) {

  }
  
  /** Gets or sets the owner of the chat. */
  @Input()
  user!: 'assistant' | 'user' | 'system';
  
  /** Returns the name of the person to place at the
   *   top of the chat. */
  get ownerName(): string {
    if (this.user === 'assistant') {
      return 'AI';
    } else {
      return this.userService.user!.name;
    }
  }

  /** Returns the class to apply to the control, based on the user value.
   *   This puts it on the proper side of the page. */
  get sideClass() {
    return this.user === 'assistant'
      ? 'left'
      : 'right';
  }

  /** Gets or sets the message of the chat. */
  @Input()
  message!: string;

  /** Boolean value indicating whether or not this chat message is the last one
   *   in the chat.  This message remains more opac than the others. */
  @Input()
  isLatest?: boolean;

  /** Boolean value indicating that the audio button should not be visible. */
  @Input()
  disableAudio?: boolean;

  get safeMessage(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.message);
  }

  playMessageAudio() {
    this.chatService.sendAudioRequest(this.message);
  }
}
