import { Component, Input } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-chat-message',
  imports: [
    CommonModule,
  ],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss'
})
export class ChatMessageComponent {
  constructor(
    readonly userService: UserService,
    readonly sanitizer: DomSanitizer,
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

  get safeMessage(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.message);
  }
}
