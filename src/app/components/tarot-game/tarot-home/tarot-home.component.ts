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
import { bufferCount, distinct, distinctUntilChanged, first, map, take, takeUntil, tap } from 'rxjs';
import { TarotCardComponent } from "../tarot-card/tarot-card.component";
import { MessagingService } from '../../../services/messaging.service';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-tarot-home',
  imports: [
    TabsModule,
    CommonModule,
    FormsModule,
    ButtonModule,
    TarotCardComponent
  ],
  templateUrl: './tarot-home.component.html',
  styleUrl: './tarot-home.component.scss'
})
export class TarotHomeComponent extends ComponentBase {
  constructor(
    readonly gameService: TarotGameService,
    readonly chatService: ChatService,
    readonly tarotChatService: TarotChatService,
    readonly messagingService: MessagingService,
    readonly confirmationService: ConfirmationService,
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

    this.gameService.games$.pipe(
      // We want to watch the counts of the games.
      map(games => games.length),
      distinctUntilChanged(),
      // We need the last value and the current value for this operation.
      bufferCount(2),
      takeUntil(this.ngDestroy$),
    ).subscribe(([previousCount, count]) => {
      // When we add a new game, and we didn't have a game before, then make the new game the selected game.
      if (previousCount === 0 && count > 0) {
        this.selectedGameId = this.gameService.games[0]._id;
      }
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

  async startNewTarotGame() {
    // Let's limit them to 5 games.  They have to delete some if they want to play more.
    if (this.gameService.games.length >= 5) {
      this.messagingService.sendUserMessage({
        level: 'error',
        title: 'Too Many Tarot Games',
        content: 'You cannot have more than 5 tarot games.  Please delete some before starting any new games.'
      });

      return;
    }

    await this.gameService.createNewGame();
    this.messagingService.sendUserMessage({
      level: 'info',
      content: 'Tarot Game Created'
    });
  }

  async deleteGame(gameId: ObjectId) {
    // Confirm the user wants to delete the game.
    await this.confirmationService.confirm({
      message: 'Are you sure you want to delete this game?',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: async () => {
        // Delete the game.
        await this.gameService.deleteTarotGame(gameId);

        this.messagingService.sendUserMessage({
          level: 'info',
          content: 'Tarot Game Deleted'
        });

        // Move to the first game in the list.
        this.selectedGameId = this.gameService.games[0]?._id ?? '';
      }
    });

  }
}
