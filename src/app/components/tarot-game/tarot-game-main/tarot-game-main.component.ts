import { Component } from '@angular/core';
import { TarotGameService } from '../../../services/tarot-game/tarot-game.service';
import { ChatService } from '../../../services/chat.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { ChatSidebarComponent } from "../../chat-sidebar/chat-sidebar.component";
import { TarotChatService } from '../../../services/tarot-game/tarot-chat.service';
import { MessagingService } from '../../../services/messaging.service';

@Component({
  selector: 'app-tarot-game-main',
  imports: [
    RouterModule,
    CommonModule,
    ButtonModule,
    ChatSidebarComponent
  ],
  templateUrl: './tarot-game-main.component.html',
  styleUrl: './tarot-game-main.component.scss',
})
export class TarotGameMainComponent {
  constructor(
    readonly gameService: TarotGameService,
    readonly chatService: ChatService,
    readonly tarotChatService: TarotChatService,
    readonly messagingService: MessagingService,
  ) {
  }

  get chatId() {
    return this.tarotChatService.currentGameChat?._id;
  }

  get isChatSet() {
    return !!this.tarotChatService.currentGameChat;
  }

  async startNewTarotGame() {
    const newGame = await this.gameService.createNewGame();
    this.messagingService.sendUserMessage({
      level: 'info',
      content: 'Tarot Game Created'
    });
  }
}
