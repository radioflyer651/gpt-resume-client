import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { MessagingService } from './messaging.service';
import { ChatService } from './chat.service';
import { EMPTY, filter, map, Observable, Subscription, switchMap, takeUntil } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ComponentBase } from '../components/component-base/component-base.component';
import { UserMessage } from '../../model/app-user-message.model';

export type SocketEvent = { message: string, args: any[]; };

/** Provides application services to response to the LLMs messages/functions sent to the UI. */
@Injectable({
  providedIn: 'root'
})
export class LlmFunctionsService extends ComponentBase {

  constructor(private chatService: ChatService, private userService: UserService, private messagingService: MessagingService) {
    super();
    this.initialize();
  }

  initialize(): void {
    // Setup the event handlers on the socket.
    this.socketEvents$ = this.chatService.socket$.pipe(switchMap(socket => {
      // If we have no socket, there's nothing to emit.
      if (!socket) {
        return EMPTY;
      }

      // We have a socket.  Let's return another observable
      //  that will emit when receiving messages
      return new Observable<SocketEvent>((subscriber) => {
        // Create the event handler.
        const handler = (message: string, ...args: any[]) => {
          subscriber.next({ message, args });
        };

        // Subscribe to events.
        socket.onAny(handler);

        // Return the cleanup function to unsubscribe.
        return () => {
          socket.offAny(handler);
        };
      });
    }),
      takeUntil(this.ngDestroy$));

    // Create the observable to response only to the 'receiveToastMessage' message from the socket events.
    this.showToast$ = this.socketEvents$.pipe(
      filter(val => val.message === 'receiveToastMessage'),
      map(val => {
        return val.args[0] as UserMessage;
      })
    );

    // Subscribe to the toast observable to show messages
    //  when they're received.
    this.showToast$.pipe(
      takeUntil(this.ngDestroy$)
    ).subscribe(message => {
      this.messagingService.sendUserMessage(message);
    });
  }

  /** Observable that emits whenever the socket from socket.io emits an event. */
  private socketEvents$!: Observable<SocketEvent>;

  /** Observable that fires whenever the LLM wants to show a toast popup. */
  showToast$!: Observable<UserMessage>;
}
