import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { UserMessage } from '../../model/app-user-message.model';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  constructor() { }

  /** Controls the observable for sending notifications to the user in the UI. */
  private readonly _messagingSubject = new Subject<UserMessage>();

  /** Observable that emits UserMessage objects when a new message is sent. */
  readonly messageEvent$ = this._messagingSubject.asObservable();

  /** Emits a new user message to inform the user of some application information. */
  sendUserMessage(message: UserMessage): void {
    this._messagingSubject.next(message);
  }

}
