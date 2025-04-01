import { Injectable } from '@angular/core';
import { ChatInfo, ChatMessage, ClientChat } from '../../model/shared-models/chat-models.model';
import { ClientApiService } from './client-api.service';
import { MessagingService } from './messaging.service';
import { TokenService } from './token.service';
import { SocketService } from './socket.service';
import { ObjectId } from 'mongodb';
import { BehaviorSubject, filter, from, last, lastValueFrom, map, Observable, shareReplay, Subject, tap } from 'rxjs';
import { ChatTypes } from '../../model/shared-models/chat-types.model';
import { ReadonlySubject } from '../../utils/readonly-subject';

/** Contains the chats currently being worked with by this user.
 *   This service handles interactions occurring with this chat. */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(
    readonly tokenService: TokenService,
    readonly messagingService: MessagingService,
    readonly apiClientService: ClientApiService,
    readonly socketService: SocketService,
  ) {
    this.initialize();
  }

  /** Returns a boolean value indicating whether or not this
   *   service has a chat with the specified chatId. */
  hasChat(chatId: ObjectId): boolean {
    return this.chats.some(c => c._id === chatId);
  }

  /** Adds a new chat to the chats list.  If it already exists,
   *   then it's replaced.  currentChat is also replaced if it is
   *   the chat being replaced. */
  addChat(newChat: ClientChat) {
    // Try to find an existing chat in the chats list.
    const existingChatId = this.chats.findIndex(c => c._id === newChat._id);

    // If found, then remove it.
    if (existingChatId >= 0) {
      this.chats.splice(existingChatId);
    }

    // Add the new chat.
    this.chats.push(newChat);
    this.chats = this.chats;
  }

  readonly _chats$ = new BehaviorSubject<ClientChat[]>([]);
  /** Observable that emits the current chat list. */
  get chats(): ClientChat[] {
    return this._chats$.getValue();
  }

  set chats(newVal: ClientChat[]) {
    this._chats$.next(newVal);
  }

  /** Observable that emits the current chat list. */
  get chats$(): Observable<ClientChat[]> {
    return this._chats$.asObservable();
  }

  // #region mainChat
  private _mainChat!: ReadonlySubject<ClientChat>;

  get mainChat$() {
    return this._mainChat.observable$;
  }

  get mainChat(): ClientChat {
    return this._mainChat.value;
  }
  // #endregion

  /** Returns a chat by the specified ID, and adds it to the chat list. */
  async loadChatById(chatId: ObjectId): Promise<ClientChat> {
    return lastValueFrom(this.apiClientService.getChatById(chatId));
  }

  /** Returns a listing of all chats for the current user. */
  async loadChatListing(): Promise<ChatInfo[]> {
    return lastValueFrom(this.apiClientService.getChatList());
  }

  /** Loads all chats of a specified type to the chats list, and returns them. */
  async loadChatsOfType(chatType: ChatTypes): Promise<ClientChat[]> {
    // Get the chats.
    const result = await lastValueFrom(this.apiClientService.getChatsOfType(chatType));

    // Get existing chats not already in our chat list.
    //  We're filtering out any existing chat that matches one we got in the results.
    const saveChats = this.chats.filter(c => !result.some(rc => rc._id === c._id));

    // Update our chat list with the new chats, and those we're not replacing.
    this.chats = [...saveChats, ...result];

    // Return the results.
    return result;
  }

  /** Gets the main chat for this user from the server. Returns the ID of the main chat.*/
  loadMainChat(): Promise<ObjectId> {
    const serverCall = this.apiClientService.getMainChat().pipe(shareReplay(1));

    // Add the handler for when the call returns.
    serverCall.subscribe(result => {
      this.addChat(result);
      this.messagingService.sendUserMessage({
        level: 'info',
        content: 'Main chat loaded.'
      });
    });

    // Return the object ID that was returned.
    return lastValueFrom(serverCall.pipe(map(v => v._id)));
  }

  /** Returns the main chat for this user. If one doesn't exist, then one is created/loaded from the server.*/
  async getMainChat(): Promise<ClientChat> {
    // Find all main chats, and put them in order from newest to oldest.
    const mainChat = this.chats
      .filter(c => c.chatType === ChatTypes.Main)
      .sort((v1, v2) => v2.creationDate.valueOf() - v1.creationDate.valueOf());

    // If we have one, then return it.
    const lastChat = mainChat[0];
    if (lastChat) {
      return lastChat;
    }

    // Load and return the chat from the server.
    const newChatId = await this.loadMainChat();
    return this.chats.find(c => c._id === newChatId)!;
  }

  /** Starts a new "main" chat, and returns it. */
  async startNewMainChat(): Promise<ObjectId> {
    // Get the chat from the server.
    const newChat = await lastValueFrom(this.apiClientService.startNewMainChat());

    // Add it to the chat list.
    this.chats.push(newChat);
    this.chats = this.chats;

    // Return the ID.
    return newChat._id;
  }

  /** Initializes this service. */
  protected async initialize(): Promise<void> {
    this._mainChat = new ReadonlySubject<ClientChat>(this._chats$.pipe(

      map(chats => {
        const copy = chats.slice();
        const filtered = copy.filter(c => c.chatType === ChatTypes.Main)
          .sort((c1, c2) => c2.creationDate.valueOf() - c1.creationDate.valueOf());

        return filtered[0];
      })));

    this.initializeReceiveChatMessages();

    // Load the main chat for the user, in this application.
    await this.loadMainChat();
  }

  private initializeReceiveChatMessages(): void {
    this.socketService.subscribeToSocketEvent('receiveChatMessage').subscribe(event => {
      // Get the arguments.
      const chatId: ObjectId = event.args[0];
      const message: ChatMessage = event.args[1];

      // Find the chat that this belongs to, if we have one.
      const chat = this.chats.find(c => c._id === chatId);

      // Exit if we couldn't find one.
      if (!chat) {
        return;
      }

      // Add the message to the chat.
      chat.chatMessages.push(message);

      // Invoke the observable watching for new chat messages.
      this._receivedChatMessage.next({ chatId, message });
    });
  }

  private readonly _receivedChatMessage = new Subject<{ chatId: ObjectId, message: ChatMessage; }>();
  /** Observable that emits when a new chat message was received. */
  readonly receivedChatMessage = this._receivedChatMessage.asObservable();

  /** Sends a specified chat message to the server for a specified chat ID. */
  sendChatMessage(chatId: ObjectId, message: string): void {
    // Find the chat for this message.
    const chat = this.chats.find(c => c._id === chatId);
    if (chat) {
      // Add the message to the chat.
      chat.chatMessages.push({
        role: 'user',
        content: message,
      });
    }

    this.socketService.sendMessage('sendChatMessage', chatId, message);
  }

  /** Returns an observable that emits new chat messages for a specified chat Id. */
  subscribeToMessagesFrom(chatId: ObjectId): Observable<ChatMessage> {
    return this.receivedChatMessage.pipe(
      filter(c => c.chatId === chatId),
      map(c => c.message)
    );
  }
}
