import { Component, ElementRef, Input, viewChild, ViewChild } from '@angular/core';
import { PanelModule } from 'primeng/panel';
import { ChatMessageComponent } from "./chat-message/chat-message.component";
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ComponentBase } from '../component-base/component-base.component';
import { ScrollTopModule } from 'primeng/scrolltop';
import { BehaviorSubject, combineLatest, map, takeUntil, tap } from 'rxjs';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MessagingService } from '../../services/messaging.service';
import { MenuService } from '../../services/menu.service';
import { SocketService } from '../../services/socket.service';
import { ChatService } from '../../services/chat.service';
import { ObjectId } from 'mongodb';
import { ClientChat } from '../../../model/shared-models/chat-models.model';
import { SocketMessage } from '../../../model/io-sockets.model';
import { ReadonlySubject } from '../../../utils/readonly-subject';
import { ChatTypes } from '../../../model/shared-models/chat-types.model';
import { ProgressBarModule } from 'primeng/progressbar';
import { PageSizeService } from '../../services/page-size.service';

@Component({
  selector: 'app-chat-sidebar',
  imports: [
    PanelModule,
    ChatMessageComponent,
    FormsModule,
    CommonModule,
    InputTextModule,
    ButtonModule,
    ScrollPanelModule,
    ScrollTopModule,
    ConfirmDialogModule,
    ConfirmDialog,
    SplitButtonModule,
    ProgressBarModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.scss'
})
export class ChatSidebarComponent extends ComponentBase {
  constructor(
    readonly socketService: SocketService,
    readonly chatService: ChatService,
    readonly confirmationService: ConfirmationService,
    readonly messagingService: MessagingService,
    readonly menuService: MenuService,
    readonly pageSizeService: PageSizeService,
  ) {
    super();

  }

  ngOnInit() {
    this.scrollToBottom(1000);

    this.socketService.subscribeToSocketEvent('receiveChatMessage')
      .pipe(takeUntil(this.ngDestroy$))
      .subscribe((message: SocketMessage) => {
        this.scrollToBottom(20);
      });

    // When the menu opens, we want to scroll down.
    this.chatService.isChatSlideoutOpen$
      .pipe(takeUntil(this.ngDestroy$))
      .subscribe(visible => {
        if (visible) {
          this.scrollToBottom(500);
        }
      });

    this._chat = new ReadonlySubject(
      this.ngDestroy$,
      combineLatest([this.chatId$, this.chatService.chats$])
        .pipe(
          map(([chatId, chats]) => chats.find(c => c._id === chatId))
        ));

    // When the chat changes, we need to scroll down.
    this.chat$.pipe(
      takeUntil(this.ngDestroy$)
    ).subscribe(chat => {
      this.scrollToBottom();
    });
  }

  // #region chatId
  private readonly _chatId = new BehaviorSubject<ObjectId>('');
  readonly chatId$ = this._chatId.asObservable();

  /** Contains the ID of the chat that this component is interacting with. */
  @Input({ required: true })
  get chatId(): ObjectId {
    return this._chatId.getValue();
  }

  set chatId(newVal: ObjectId) {
    this._chatId.next(newVal);
  }
  // #endregion

  @ViewChild('chatArea')
  messageContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('messageInput')
  messageInput!: ElementRef<HTMLInputElement>;

  // #region chat
  private _chat!: ReadonlySubject<ClientChat | undefined>;

  /** Observable that returns the selected chat. */
  get chat$() {
    return this._chat.observable$;
  }

  get chat(): ClientChat | undefined {
    return this._chat.value;
  }
  // #endregion

  scrollToBottom(delay: number = 0): void {
    setTimeout(() => {
      const element = this.messageContainer.nativeElement;
      element.scrollTo({ behavior: 'smooth', top: element.scrollHeight });
    }, delay);
  }

  /** Gets or sets the new message to send to the UI. */
  newMessage = '';

  get canSend() {
    return this.newMessage.trim() !== '' && !!this.chatService.hasChat(this.chatId);
  }

  noMessagesMessage = `Begin your chat here!  Ashlie is the site's AI.  Type her a message to get started.`;

  splitButtonModel = [
    {
      label: 'New Chat',
      command: () => this.newChat()
    }
  ];

  async sendMessage(): Promise<void> {
    if (this.newMessage.trim() === '') {
      this.messagingService.sendUserMessage({
        level: 'error',
        content: 'You must enter a message to send.'
      });
      return;
    }

    const newMessage = this.newMessage;
    this.newMessage = '';
    this.messageInput.nativeElement.focus();
    this.isAwaitingResponse = true;
    this.scrollToBottom(500);

    await this.chatService.sendChatMessage(this.chatId, newMessage);
    this.isAwaitingResponse = false;
  }

  /** Controls the warning message on the top of the chat dialog. */
  showWarningMessage = false;

  /** Boolean value indicating whether or not we have a chat message in flight
   *   and we're awaiting a reply.
   */
  isAwaitingResponse: boolean = false;

  /** Returns whether or not we can shoe the "Start New Chat" button. */
  get canStartNewChat(): boolean {
    return this.chat?.chatType === ChatTypes.Main;
  }

  newChat(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to start a new chat, and lose your old one?',
      accept: async () => {
        this.chatId = await this.chatService.startNewMainChat();
      }
    });
  }
}
