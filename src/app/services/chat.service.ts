import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { ClientApiService } from './client-api.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Chat } from '../../model/shared-models/chat-models.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(
    readonly userService: UserService,
    readonly clientApi: ClientApiService
  ) { }

  /** Initializes this service, setting up any timers and observables that may be necessary. */
  private initialize(): void {

  }

  private readonly _mainChat = new BehaviorSubject<Chat | undefined>(undefined);
  readonly mainChat$ = this._mainChat.asObservable();

  /** Gets or sets the main chat to use on the site for this user. */
  get mainChat(): Chat | undefined {
    return this._mainChat.getValue();
  }

  set mainChat(newVal: Chat | undefined) {
    this._mainChat.next(newVal);
  }

  /** Executes a chat API call, to the main chat for this user. */
  performMainChat(message: string, functionDefinitions?: any): Observable<string> {
    
  }
}
