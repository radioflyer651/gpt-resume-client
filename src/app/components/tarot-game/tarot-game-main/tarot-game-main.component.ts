import { Component } from '@angular/core';
import { TarotGameService } from '../../../services/tarot-game.service';
import { ChatService } from '../../../services/chat.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tarot-game-main',
  imports: [
    RouterModule,
    CommonModule,
    ButtonModule,
  ],
  templateUrl: './tarot-game-main.component.html',
  styleUrl: './tarot-game-main.component.scss',
})
export class TarotGameMainComponent {
  constructor(
    readonly gameService: TarotGameService,
    readonly chatService: ChatService,
  ) { }

  
}
