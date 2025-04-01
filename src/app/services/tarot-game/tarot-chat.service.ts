import { Injectable } from '@angular/core';
import { TarotGameService } from './tarot-game.service';
import { ObjectId } from 'mongodb';
import { ClientChat } from '../../../model/shared-models/chat-models.model';
import { ChatService } from '../chat.service';
import { BehaviorSubject, combineLatest, combineLatestWith, map, Observable, withLatestFrom } from 'rxjs';
import { TarotGame } from '../../../model/shared-models/tarot-game/tarot-game.model';
import { ReadonlySubject } from '../../../utils/readonly-subject';

@Injectable({
  providedIn: 'root'
})
export class TarotChatService {

  constructor(
    readonly tarotGameService: TarotGameService,
    readonly chatService: ChatService,
  ) {
    this.initialize();
  }

  initialize() {
    this._currentTarotGame = new ReadonlySubject<TarotGame | undefined>(
      combineLatest([this.currentTarotGameId$, this.tarotGameService.games$]).pipe(
        map(([currentGameId, games]) => {
          return games.find(g => g._id === currentGameId);
        })
      )
    );

    this._currentGameChat = new ReadonlySubject<ClientChat | undefined>(
      combineLatest([this.currentTarotGame$, this.chatService.chats$]).pipe(
        map(([currentGame, chats]) => {
          return chats.find(c => c._id === currentGame?.gameChatId);
        })
      )
    );
  }

  //#region currentTarotGameId
  private readonly _currentTarotGameId = new BehaviorSubject<ObjectId | undefined>(undefined);
  readonly currentTarotGameId$ = this._currentTarotGameId.asObservable();

  /** Gets or sets the ID of the current tarot game being interacted with */
  get currentTarotGameId(): ObjectId | undefined {
    return this._currentTarotGameId.getValue();
  }

  set currentTarotGameId(newVal: ObjectId | undefined) {
    this._currentTarotGameId.next(newVal);
  }
  //#endregion

  //#region currentTarotGame
  private _currentTarotGame!: ReadonlySubject<TarotGame | undefined>;

  get currentTarotGame$() {
    return this._currentTarotGame.observable$;
  }

  public get currentTarotGame(): TarotGame | undefined {
    return this._currentTarotGame?.value;
  }
  //#endregion

  // #region currentGameChat
  private _currentGameChat!: ReadonlySubject<ClientChat | undefined>;

  get currentGameChat$() {
    return this._currentGameChat.observable$;
  }

  get currentGameChat(): ClientChat | undefined {
    return this._currentGameChat?.value;
  }
  // #endregion

}
