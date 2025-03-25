import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatDialog } from '../model/chat-dialog.model';

@Injectable({
  providedIn: 'root'
})
export class ChatPopupService {
  constructor() {
    this.chatActor = 'David Spade';
  }

  /** Map of ChatDialogs with the actor names as their keys. */
  private chats = new Map<string, ChatDialog>();

  /** Boolean value indicating whether or not to show the chat window. */
  showChatWindow = false;

  private _chatActor!: string;
  /** Gets or sets the name of the actor being chatted with in the chat window. */
  get chatActor(): string {
    return this._chatActor;
  }
  set chatActor(value: string) {
    // Validate the input.
    if (!value || value.trim() === '') {
      throw new Error('chatActor cannot be undefined or empty.');
    }

    this._chatActor = value;

    // Set the dialog for this actor.
    this.setChatActor(value);
  }

  private setChatActor(actorName: string): void {
    // Validate the input.
    if (!actorName || actorName.trim() === '') {
      throw new Error('Invalid actorName.');
    }

    // Try to get the chat for this actor.
    let chat = this.chats.get(actorName);

    // If not set, then create one and add it to the map.
    if (!chat) {
      chat = {
        chatActor: actorName,
        dialog: ''
      };

      this.chats.set(actorName, chat);
    }

    // Set the current chat to this one.
    this._currentChatDialog = chat;
  }

  private _currentChatDialog!: ChatDialog;

  get currentChatDialog() {
    return this._currentChatDialog;
  }
}
