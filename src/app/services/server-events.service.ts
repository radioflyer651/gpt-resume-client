import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { MessagingService } from './messaging.service';
import { EMPTY, filter, map, Observable, Subscription, switchMap, takeUntil } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ComponentBase } from '../components/component-base/component-base.component';
import { SocketService } from './socket.service';

/** Provides application services to response to the LLMs messages/functions sent to the UI. */
@Injectable({
  providedIn: 'root'
})
export class ServerEventsService extends ComponentBase {

  constructor(private socketService: SocketService, private userService: UserService, private messagingService: MessagingService) {
    super();
    this.initialize();
  }

  initialize(): void {
    // Trigger a user message when we receive a toast event.
    this.socketService.subscribeToSocketEvent('receiveToastMessage')
      .pipe(takeUntil(this.ngDestroy$))
      .subscribe(event => {
        this.messagingService.sendUserMessage(event.args[0]);
      });
  }
}
