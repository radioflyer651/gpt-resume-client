import { Component } from '@angular/core';
import { PanelModule } from 'primeng/panel';
import { ChatMessageComponent } from "./chat-message/chat-message.component";
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ComponentBase } from '../component-base/component-base.component';
import { ChatService } from '../../services/chat.service';

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
  ],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.scss'
})
export class ChatSidebarComponent extends ComponentBase {
  constructor(
    readonly chatService: ChatService,

  ) {
    super();

  }

  ngOnInit() {

  }

  /** Gets or sets the new message to send to the UI. */
  newMessage = '';

  get canSend() {
    return this.newMessage.trim() !== '' && !!this.chatService.mainChat;
  }

  sendMessage(): void {
    this.chatService.sendChatMessage(this.newMessage);
    this.newMessage = '';
  }
}
