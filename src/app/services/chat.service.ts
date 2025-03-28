import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, of, switchMap } from 'rxjs';
import { io } from "socket.io-client";
import { TokenService } from './token.service';
import { environment } from '../../environments/environment';
import { ReadonlySubject } from '../../utils/readonly-subject';
import { ObjectId } from 'mongodb';
import { ChatMessage, ClientChat } from '../../model/shared-models/chat-models.model';
import { MessagingService } from './messaging.service';
import { ClientApiService } from './client-api.service';

type IoSocketType = ReturnType<typeof io>;
export type SocketMessage = { message: string, args: any[]; };

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(
    readonly tokenService: TokenService,
    readonly messagingService: MessagingService,
    readonly apiClientService: ClientApiService,
  ) {
    this.initializeService();
  }

  /** Performs all initializations for this service. */
  private initializeService(): void {
    this.initializeSocketObservable();
    this.initializeMainChatLoadSubscription();
    this.initializeMessageEvents();

    this.socket$.subscribe(s => {
      if (!s) {
        return;
      }

      s.on('disconnected', () => {
        console.warn(`Socket Disconnected.`);
      });

      s.on('connect_error', () => {
        console.warn(`Socket Connection Error.`, (err: any) => {
          console.error(err);
        });
      });

      // s.on('connected', () => {
      //   console.info(`socks connected.`)
      //   this.messagingService.sendUserMessage(
      //     {
      //       level: 'info',
      //       content: 'Socket connected.'
      //     }
      //   );
      // });
    });
  }

  /** Initializes the chat service. */
  private initializeSocketObservable(): void {
    // Create the observable that will create the socket.
    const socket$ = this.tokenService.token$.pipe(
      switchMap(token => {
        // If we don't have a token, then there's nothing to do.
        if (!token) {
          return of(undefined);
        }

        // Create and initialize the new socket.
        console.log(`Connecting to socket: ${environment.chatSocketIoEndpoint}`);
        const socket = io(environment.chatSocketIoEndpoint, {
          path: environment.chatSocketPath,
          // upgrade: true,
          auth: { token },
          // reconnectionAttempts: 5,
          reconnectionDelay: 5000,
          extraHeaders: {
            'Authorization': token
          }
        });

        // Add handlers and such to the socket.
        this.initializeSocket(socket);

        // Create a new observable that carries our new socket.
        return new Observable<IoSocketType>(subscriber => {
          // Emit our socket on this subscriber.
          subscriber.next(socket);

          // Return the cleanup function for this socket.
          //  When a new value comes in, the subscriber will
          //  unsubscribe, and automatically clean up our socket.
          return () => {
            if (socket && socket.connected) {
              socket.removeAllListeners();
              socket.disconnect();
            }
          };
        });
      })
    );

    // Hook this up to the actual socket properties.
    this._socket = new ReadonlySubject<IoSocketType | undefined>(socket$);
  }

  /** Hooks up all of the functions to the socket, when we have one. */
  private initializeSocket(socket: IoSocketType): void {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('receiveChatMessage', (chatId: ObjectId, message: ChatMessage) => {
      if (!this.mainChat) {
        this.messagingService.sendUserMessage({
          level: 'error',
          content: 'An internal error occurred when attempting to send your chat message.  Please try again later.'
        });

        console.error('Chat messaged received from the server, but no chat has been loaded.');

        return;
      }

      // Ensure the chat Ids are the same.
      if (this.mainChat._id === chatId) {
        // Add the chat to the chat log.
        this.mainChat.chatMessages.push(message);
      } else {
        console.warn(`Received main chat message, but chat ID didn't match.`);
      }
    });

    socket.on('receiveServerStatusMessage', (type: 'info' | 'success' | 'warn' | 'error', message: string) => {
      this.messagingService.sendUserMessage({ level: type, content: message, title: 'AI Message' });
    });
  }

  private initializeMessageEvents(): void {
    this.messageEvents$ = this.socket$.pipe(
      switchMap(socket => {
        if (!socket) {
          return EMPTY;
        } else {
          return new Observable<SocketMessage>(subscriber => {
            const handler = (...allArgs: any[]) => {
              // Get the message from the args.
              const [message, ...args] = allArgs;

              // Fire the event.
              subscriber.next({ message, args });
            };

            // Register the handler.
            socket.onAny(handler);

            // Unsubscribe: Cleanup.
            return () => {
              socket.offAny(handler);
            };
          });
        }

      })
    );
  }

  /** Hooks up loading of the main chat when we have tokens. */
  private initializeMainChatLoadSubscription(): void {
    this.tokenService.token$.subscribe(token => {
      if (!token) {
        // Remove the main chat.
        this.mainChat = undefined;
      } else {
        // Load the main chat again.
        this.getMainChat();
      }
    });
  }

  /** Observable that emits the messages received from socket.io. */
  messageEvents$!: Observable<SocketMessage>;

  private _socket!: ReadonlySubject<IoSocketType | undefined>;

  get socket$() {
    return this._socket.observable$;
  }

  public get socket(): IoSocketType | undefined {
    return this._socket.value;
  }

  private readonly _mainChat = new BehaviorSubject<ClientChat | undefined>(undefined);
  readonly mainChat$ = this._mainChat.asObservable();

  /** Gets or sets the main chat log for AI interaction. */
  get mainChat(): ClientChat | undefined {
    return this._mainChat.getValue();
  }

  set mainChat(newVal: ClientChat | undefined) {
    this._mainChat.next(newVal);
  }

  /** Gets the main chat for this user from the server. */
  public getMainChat(): void {
    this.apiClientService.getMainChat()
      .subscribe(result => {
        this.mainChat = result;
        this.messagingService.sendUserMessage({
          level: 'info',
          content: 'Main chat loaded.'
        });
      });
  }

  /** Sends a chat message to the API.  Any responses will
   *   be received through socket.io connections. */
  sendChatMessage(message: string): void {
    if (!this.socket || this.socket.disconnected) {
      this.messagingService.sendUserMessage(
        {
          level: 'error',
          content: 'Unable to send AI messages.  Sockets are disconnected.'
        }
      );
    } else {
      if (!this.mainChat) {
        this.messagingService.sendUserMessage({
          level: 'error',
          content: 'Unable to send AI messages.  Chat is not loaded.'
        });
      } else {
        // Send the message to the server.
        this.socket.emit('sendMainChatMessage', message);

        // Add the message to our chat log.
        this.mainChat.chatMessages.push({
          role: 'user',
          content: message
        });

      }
    }
  }

  /** Tells the server to start a new main chat. */
  startNewMainChat(): void {
    this.apiClientService.startNewMainChat().subscribe({
      next: result => {
        this.mainChat = result;
      },
      error: err => {
        this.messagingService.sendUserMessage({
          level: 'error',
          content: 'An error occurred when attempting to start a new chat.'
        });

        console.error(err);
      }
    });
  }
}
