import { Component } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { TarotGameService } from '../../../services/tarot-game/tarot-game.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TarotChatService } from '../../../services/tarot-game/tarot-chat.service';
import { ObjectId } from 'mongodb';
import { ComponentBase } from '../../component-base/component-base.component';
import { first, take, takeUntil } from 'rxjs';

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
export class TarotHomeComponent extends ComponentBase {
  constructor(
    readonly gameService: TarotGameService,
    readonly chatService: ChatService,
    readonly tarotChatService: TarotChatService,
  ) {
    super();
  }

  /** Gets or sets the ID of the game tab to show. */
  private _selectedGameId: ObjectId = '';
  get selectedGameId(): ObjectId {
    return this._selectedGameId;
  }
  set selectedGameId(value: ObjectId) {
    this._selectedGameId = value;

    // Ensure that we have a valid value.
    if (value && value.trim() !== '') {
      this.tarotChatService.currentTarotGameId = value;
    }
  }

  ngOnInit() {
    this.gameService.games$.pipe(
      first(games => games.length > 0),
      takeUntil(this.ngDestroy$)
    ).subscribe(games => {
      this.isLoadingGames = false;
      this.selectedGameId = games[0]._id;
    });

    this.loadGames();
    this.gameService.loadTarotChats();
  }

  /** Boolean value indicating whether or not the games are being loaded. */
  isLoadingGames = true;

  private loadGames() {
    // If the games are already loaded, then don't do anything.
    if (this.gameService.games.length > 0) {
      // Pick the first game int he list so we can show the page.
      if (this.gameService.games.length > 0) {
        this.selectedGameId = this.gameService.games[0]._id;
      }

      // Reset our flag to not loading.
      this.isLoadingGames = false;
      return;
    }

    // Indicate that we're loading the games.
    this.isLoadingGames = true;

    // Watch for the games to be loaded, and reset the flag.
    this.gameService.games$.pipe(
      take(1),
    ).subscribe(games => {
      this.isLoadingGames = false;
      this.selectedGameId = games[0]?._id ?? '';
    });

    // Start the loading of the games.
    this.gameService.loadTarotGames();
  }

}
