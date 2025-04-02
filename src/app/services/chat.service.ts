import { Injectable } from '@angular/core';
import { ChatInfo, ChatMessage, ClientChat } from '../../model/shared-models/chat-models.model';
import { ClientApiService } from './client-api.service';
import { MessagingService } from './messaging.service';
import { TokenService } from './token.service';
import { SocketService } from './socket.service';
import { ObjectId } from 'mongodb';
import { BehaviorSubject, filter, from, last, lastValueFrom, map, Observable, of, shareReplay, Subject, switchMap, tap } from 'rxjs';
import { ChatTypes } from '../../model/shared-models/chat-types.model';
import { ReadonlySubject } from '../../utils/readonly-subject';
import { constructApiUrl, getApiBaseUrl } from '../../utils/get-api-base-url.utils';
import { PageSizeService } from './page-size.service';

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
    readonly pageSizeService: PageSizeService,
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

  /** Removes the specified chat from the chats list. */
  removeChat(chatId: ObjectId) {
    // Try to find an existing chat in the chats list.
    const existingChatId = this.chats.findIndex(c => c._id === chatId);

    // If found, then remove it.
    if (existingChatId >= 0) {
      this.chats.splice(existingChatId, 1);
      this.chats = this.chats;
    }
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
    this.tokenService.token$.pipe(
      switchMap(token => {
        if (!token) {
          return of(undefined);
        }

        return this.apiClientService.getMainChat();
      })
    ).subscribe(chat => {
      // If none found, then exit.
      if (!chat) {
        return;
      }

      // Remove the existing, if there is one.
      const existingId = this.chats.findIndex(c => c._id === chat?._id);
      if (existingId) {
        this.chats.splice(existingId);
      }

      // Insert the new chat.
      this.chats.push(chat);

      // Inform observers of the update.
      this.chats = this.chats;
    });
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

  /** Sends a request to the chat server to get audio for a specified message. */
  async sendAudioRequest(message: string): Promise<void> {
    // If an audio request is in progress, then block this from happening.
    if (this.isAudioRequestInProgress) {
      this.messagingService.sendUserMessage({
        level: 'error',
        content: 'Wait until the audio for the last request is finished before requesting another.',
      });
      return;
    }

    this.setIsAudioRequestInProgress(true);

    // Request the audio from the server.  A file name will be returned that we can use to play the audio.
    const result = (await this.socketService.sendMessageWithResponse('sendAudioRequest', message)) as string;

    if (!result) {
      return;
    }

    // Create the URL path to the audio file.
    const urlPath = constructApiUrl(`chat/audio/${result}`);

    // Get the token for our request.
    const token = this.tokenService.token;

    // If we don't have one, then we can't move forward.
    if (!token) {
      throw new Error(`No token available.  Please log in first.`);
    }

    try {
      // Play the audio.
      const audio = new Audio();
      // Add event listeners to debug issues
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        console.error('Audio error code:', audio.error?.code);
        console.error('Audio error message:', audio.error?.message);
      });

      // Turn the whole play operation into a promise, so we can block
      //  more input until it's done.
      // This needs to be moved to its own functionality.
      const playWatch = new Promise<void>((resolve) => {
        audio.addEventListener('ended', () => {
          console.log('Audio playback finished');
          resolve();
        });
        audio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          resolve(); // Resolve even on error to avoid hanging
        });
      });
      audio.src = `${urlPath}?token=${encodeURIComponent(token)}`;
      await audio.play();
      await playWatch;
    } finally {
      this.setIsAudioRequestInProgress(false);
    }
  }

  // #region isAudioRequestInProgress
  private readonly _isAudioRequestInProgress = new BehaviorSubject<boolean>(false);
  readonly isAudioRequestInProgress$ = this._isAudioRequestInProgress.asObservable();

  /** Gets or sets a boolean value indicating whether or not an audio request is being requested
   *   from the server, or currently playing.  */
  get isAudioRequestInProgress(): boolean {
    return this._isAudioRequestInProgress.getValue();
  }

  private setIsAudioRequestInProgress(newVal: boolean) {
    this._isAudioRequestInProgress.next(newVal);
  }
  // #endregion

  private readonly _receivedChatMessage = new Subject<{ chatId: ObjectId, message: ChatMessage; }>();
  /** Observable that emits when a new chat message was received. */
  readonly receivedChatMessage = this._receivedChatMessage.asObservable();

  /** Sends a specified chat message to the server for a specified chat ID. */
  async sendChatMessage(chatId: ObjectId, message: string): Promise<void> {
    // Find the chat for this message.
    const chat = this.chats.find(c => c._id === chatId);
    if (chat) {
      // Add the message to the chat.
      chat.chatMessages.push({
        role: 'user',
        content: message,
      });
    }

    // this.socketService.sendMessage('sendChatMessage', chatId, message);
    return await this.socketService.sendMessageWithResponse('sendChatMessage', chatId, message);
  }

  /** Returns an observable that emits new chat messages for a specified chat Id. */
  subscribeToMessagesFrom(chatId: ObjectId): Observable<ChatMessage> {
    return this.receivedChatMessage.pipe(
      filter(c => c.chatId === chatId),
      map(c => c.message)
    );
  }

  // #region isChatSlideoutOpen
  private readonly _isChatSlideoutOpen = new BehaviorSubject<boolean>(false);
  readonly isChatSlideoutOpen$ = this._isChatSlideoutOpen.asObservable();

  /** Controls the flyout of the chat window for small screens. */
  get isChatSlideoutOpen(): boolean {
    return this._isChatSlideoutOpen.getValue();
  }

  set isChatSlideoutOpen(newVal: boolean) {
    this._isChatSlideoutOpen.next(newVal);
  }
  // #endregion
}
