import { Injectable } from '@angular/core';
import { TarotGame } from '../../model/shared-models/tarot-game/tarot-game.model';
import { BehaviorSubject, lastValueFrom, shareReplay } from 'rxjs';
import { ClientApiService } from './client-api.service';
import { ClientChat } from '../../model/shared-models/chat-models.model';
import { SocketService } from './socket.service';
import { ChatService } from './chat.service';
import { TarotCardReference } from '../../model/shared-models/tarot-game/tarot-card.model';
import { ObjectId } from 'mongodb';

@Injectable({
  providedIn: 'root'
})
export class TarotGameService {

  constructor(
    readonly apiClient: ClientApiService,
    readonly socketService: SocketService,
    readonly chatService: ChatService,
  ) {
    this.loadTarotGames();
  }

  private initializeSocketService(): void {
    this.socketService.subscribeToSocketEvent('receiveTarotFlipCard')
      .subscribe(event => {
        this.receiveTarotFlipCard(event.args[0], event.args[1]);
      });
  }

  private readonly _games = new BehaviorSubject<TarotGame[]>([]);
  readonly games$ = this._games.asObservable();

  get games(): TarotGame[] {
    return this._games.getValue();
  }

  set games(newVal: TarotGame[]) {
    this._games.next(newVal);
  }

  /** Gets all games form the server, and overwrites them locally. */
  async loadTarotGames(): Promise<TarotGame[]> {
    const apiCall = this.apiClient.getTarotGames().pipe(shareReplay(1));

    apiCall.subscribe(games => {
      this.games = games;
    });

    return lastValueFrom(apiCall);
  }

  /** Calls the socket.io to create a new tarot game, and returns the game and the new chat. */
  async createNewGame(): Promise<TarotGame | undefined> {
    // Get the new game and the chat.
    const result = await this.socketService.sendMessageWithResponse<{ tarotChat: ClientChat, game: TarotGame; }>('sendStartTarotGame');

    // Exit if we got nothing.
    if (!result) {
      return;
    }

    // Add the chat to the chat service.
    this.chatService.addChat(result.tarotChat);

    // Return the result.
    return result.game;
  }

  /** Receives a flipped card from the server. */
  receiveTarotFlipCard(gameId: ObjectId, cardReference: TarotCardReference): void {
    // Find the game.
    const game = this.games.find(g => g._id === gameId);

    // If not found, we can't do much.
    if (!game) {
      console.error('Received a tarot card, but the game does not exist in the game list.');
      return;
    }

    // Add the reference to the game.
    game.cardsPicked.push(cardReference);
  }
}
