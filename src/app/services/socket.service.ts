import { Injectable } from '@angular/core';
import { switchMap, of, Observable, EMPTY } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { ReadonlySubject } from '../../utils/readonly-subject';
import { ClientApiService } from './client-api.service';
import { MessagingService } from './messaging.service';
import { TokenService } from './token.service';
import { IoSocketType } from '../../model/io-sockets.model';
import { SocketEvent } from '../../model/socket-event.model';

/** This service handles socket.io management, and is responsible
 *   for advertising sockets as they are connected and disconnected. */
@Injectable({
  providedIn: 'root'
})
export class SocketService {

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

    this.socket$.subscribe(s => {
      if (!s) {
        return;
      }

      s.on('connected', () => {
        console.log('Connected.');
      });

      s.on('disconnected', () => {
        console.warn(`Socket Disconnected.`);
      });

      s.on('connect_error', (err) => {
        console.warn(`Socket Connection Error.`, err);
      });

      // Log reconnect attempts for debugging
      s.io.on("reconnect_attempt", (attempt) => {
        console.log(`Socket reconnection attempt: ${attempt}`);
      });

      s.io.on("reconnect", (attempt) => {
        console.log(`Socket reconnected after ${attempt} attempts`);
      });
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
        let socket = io(environment.chatSocketIoEndpoint, {
          path: environment.chatSocketPath,
          auth: { token },
          reconnectionDelay: 5000,
          reconnection: true,
          forceNew: true,
          extraHeaders: {
            'Authorization': token
          }
        });

        console.log('Creating new socket connection');

        // Add handlers and such to the socket.
        this.initializeSocket(socket);

        // Create a new observable that carries our new socket.
        return new Observable<IoSocketType>(subscriber => {
          // Emit our socket on this subscriber.
          subscriber.next(socket);

          // Return the cleanup function for this socket.
          return () => {
            console.log('Cleaning up socket connection');
            if (socket) {
              socket.removeAllListeners();
              socket.disconnect();
              socket.close();
            }
          };
        });
      })
    );

    // Hook this up to the actual socket properties.
    this._socket = new ReadonlySubject<IoSocketType | undefined>(EMPTY, socket$);
  }

  /** Hooks up all of the functions to the socket, when we have one. */
  private initializeSocket(socket: IoSocketType): void {
    if (!socket.connected) {
      socket.connect();
    }
  }

  private _socket!: ReadonlySubject<IoSocketType | undefined>;

  protected get socket$() {
    return this._socket.observable$;
  }

  protected get socket(): IoSocketType | undefined {
    return this._socket.value;
  }

  /** Sends a message on the socket, if we have one. */
  sendMessage(messageName: string, ...args: any[]): void {
    // If we don't have a socket, we can't do anything.
    if (!this.socket) {
      console.error(`Attempted to send a message, but no socket exists to send it on.`);
      return;
    }

    // Send the message.
    this.socket.emit(messageName, ...args);
  }

  /** Sends a message on the socket, if we have one, and expects a response back. */
  async sendMessageWithResponse<T>(messageName: string, ...args: any[]): Promise<T | undefined> {
    // If we don't have a socket, we can't do anything.
    if (!this.socket) {
      console.error(`Attempted to send a message, but no socket exists to send it on.`);
      return undefined;
    }

    // Send and return the message, and return the response.
    return this.socket.emitWithAck(messageName, ...args);
  }

  /** Subscribes to a specified event from NEW sockets connecting to the system. */
  subscribeToSocketEvent(event: string): Observable<SocketEvent> {
    return this.socket$.pipe(
      switchMap(socket => {
        // If we don't have a socket, then we won't have any events.
        if (!socket) {
          return EMPTY;
        }

        // We have a socket.  Return an observable to watch
        //  for events of the specified type.
        return new Observable<SocketEvent>(subscriber => {
          const subscriptionFunction = (...args: any[]) => {
            // copy the argument list, so we don't alter it.
            const argsCopy = args.slice();

            // If the last item in the argument list is a callback, then collect
            //  that separately.  Also, remove it from the argument list.
            let resolverCallback: ((value: any) => void) | undefined;
            if (argsCopy.length > 0) {
              if (typeof argsCopy[argsCopy.length - 1] === 'function') {
                resolverCallback = argsCopy.pop();
              }
            }

            const onComplete = () => {
              subscriber.complete();
            };

            subscriber.next({
              message: event,
              args: argsCopy,
              resultCallback: resolverCallback,
            });

            // We need to disconnect when the socket disconnects.
            socket.on('disconnect', onComplete);

            // Send the cleanup function.
            return () => {
              // Remove the event handlers.
              socket.off('disconnect', onComplete);
              socket.off(event, subscriptionFunction);
            };
          };

          // Add the subscription to the socket.
          socket.on(event, subscriptionFunction);
        });
      })
    );
  }

}
