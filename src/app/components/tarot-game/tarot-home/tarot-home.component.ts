import { Component } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { TarotGameService } from '../../../services/tarot-game.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-tarot-home',
  imports: [
    TabsModule,
    CommonModule,
    FormsModule,
    ButtonModule,
  ],
  templateUrl: './tarot-home.component.html',
  styleUrl: './tarot-home.component.scss'
})
export class TarotHomeComponent {
  constructor(
    readonly gameService: TarotGameService,
    readonly chatService: ChatService,
  ) { }

  /** Gets or sets the ID of the game tab to show. */
  tabId: number = 0;


}
