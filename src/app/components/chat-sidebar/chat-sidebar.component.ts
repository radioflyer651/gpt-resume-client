import { Component, ElementRef, viewChild, ViewChild } from '@angular/core';
import { PanelModule } from 'primeng/panel';
import { ChatMessageComponent } from "./chat-message/chat-message.component";
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ComponentBase } from '../component-base/component-base.component';
import { ChatService } from '../../services/chat.service';
import { ScrollTopModule } from 'primeng/scrolltop';
import { takeUntil } from 'rxjs';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MessagingService } from '../../services/messaging.service';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-chat-sidebar',
  imports: [
    PanelModule,
    ChatMessageComponent,
    FormsModule,
    CommonModule,
    InputTextModule,
    ButtonModule,
    ScrollPanelModule,
    ScrollTopModule,
    ConfirmDialogModule,
    ConfirmDialog,
    SplitButtonModule
  ],
  providers: [ConfirmationService],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.scss'
})
export class ChatSidebarComponent extends ComponentBase {
  constructor(
    readonly chatService: ChatService,
    readonly confirmationService: ConfirmationService,
    readonly messagingService: MessagingService,
    readonly menuService: MenuService,
  ) {
    super();

  }

  ngOnInit() {
    this.scrollToBottom(1000);

    this.chatService.messageEvents$.pipe(
      takeUntil(this.ngDestroy$)
    ).subscribe((message) => {
      console.log(`Received message: ${message.message}`);
      if (message.message === 'receiveChatMessage') {
        this.scrollToBottom(20);
      }
    });

    // When the menu opens, we want to scroll down.
    this.menuService.showMenu$
      .pipe(takeUntil(this.ngDestroy$))
      .subscribe(visible => {
        if (visible) {
          this.scrollToBottom(500);
        }
      });
  }

  @ViewChild('chatArea')
  messageContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('messageInput')
  messageInput!: ElementRef<HTMLInputElement>;

  scrollToBottom(delay: number = 0): void {
    setTimeout(() => {
      const element = this.messageContainer.nativeElement;
      element.scrollTo({ behavior: 'smooth', top: element.scrollHeight });
    }, delay);
  }

  /** Gets or sets the new message to send to the UI. */
  newMessage = '';

  get canSend() {
    return this.newMessage.trim() !== '' && !!this.chatService.mainChat;
  }

  noMessagesMessage = `Begin your chat here!  Ashlie is the site's AI.  Type her a message to get started.`;

  splitButtonModel = [
    {
      label: 'New Chat',
      command: () => this.newChat()
    }
  ];

  sendMessage(): void {
    if (!this.canSend) {
      this.messagingService.sendUserMessage({
        level: 'error',
        content: 'You must enter a message to send.'
      });
      return;
    }

    this.chatService.sendChatMessage(this.newMessage);
    this.newMessage = '';
    this.messageInput.nativeElement.focus();
    this.scrollToBottom(500);
  }

  newChat(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to start a new chat, and lose your old one?',
      accept: () => {
        this.chatService.startNewMainChat();
      }
    });
  }
}
