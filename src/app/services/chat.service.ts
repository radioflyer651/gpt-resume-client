import { Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { io } from "socket.io-client";
import { TokenService } from './token.service';
import { environment } from '../../environments/environment';
import { ReadonlySubject } from '../../utils/readonly-subject';

type IoSocketType = ReturnType<typeof io>;

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(
    readonly tokenService: TokenService,
  ) {

    this.initializeSocketObservable();
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
        const socket = io(environment.chatSocketIoEndpoint, {
          auth: { token }
        });

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
  private initializeSocket(): void {

  }

  private _socket!: ReadonlySubject<IoSocketType | undefined>;

  get socket$() {
    return this._socket.observable$;
  }

  public get socket(): IoSocketType | undefined {
    return this._socket.value;
  }



}
