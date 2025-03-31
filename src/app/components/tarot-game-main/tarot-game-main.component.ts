import { Component } from '@angular/core';
import { TarotGameService } from '../../services/tarot-game.service';
import { ChatService } from '../../services/chat.service';
import { ObjectId } from 'mongodb';
import { TabsModule } from 'primeng/tabs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tarot-game-main',
  imports: [
    TabsModule,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './tarot-game-main.component.html',
  styleUrl: './tarot-game-main.component.scss',
})
export class TarotGameMainComponent {
  constructor(
    readonly gameService: TarotGameService,
    readonly chatService: ChatService,
  ) { }

  /** Gets or sets the ID of the game tab to show. */
  tabId: number = 0;

}
