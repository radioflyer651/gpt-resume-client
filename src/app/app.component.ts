import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from "./components/site-header/site-header.component";
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MessagingService } from './services/messaging.service';
import { ComponentBase } from './components/component-base/component-base.component';
import { map, Observable, takeUntil } from 'rxjs';
import { LoginComponent } from "./components/login/login.component";
import { UserService } from './services/user.service';
import { CommonModule } from '@angular/common';
import { ChatSidebarComponent } from "./components/chat-sidebar/chat-sidebar.component";
import { ServerEventsService } from './services/server-events.service';
import { PageSizeService } from './services/page-size.service';
import { MenuService } from './services/menu.service';
import { ButtonModule } from 'primeng/button';
import { Chat2Service } from './services/chat2.service';
import { ObjectId } from 'mongodb';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    SiteHeaderComponent,
    RouterOutlet,
    DrawerModule,
    TextareaModule,
    FormsModule,
    ToastModule,
    LoginComponent,
    ChatSidebarComponent,
    ButtonModule,
  ],
  providers: [
    MessageService,
    ServerEventsService,
    PageSizeService,
    Chat2Service,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent extends ComponentBase {
  constructor(
    readonly messagingService: MessagingService,
    readonly messageService: MessageService,
    readonly userService: UserService,
    readonly llmFunctionService: ServerEventsService,
    readonly pageSizeService: PageSizeService,
    readonly menuService: MenuService,
    readonly chatService: Chat2Service,
  ) {
    super();

  }

  ngOnInit() {
    // Subscribe to the message service and show new messages, as toast, when they are received.
    this.messagingService.messageEvent$.pipe(
      takeUntil(this.ngDestroy$)
    ).subscribe(message => {
      this.messageService.add({
        severity: message.level,
        text: message.content,
        closable: true,
        summary: message.content
      });
    });

    // When the user logs in or out, we want the menu to close (assuming it was open).
    this.userService.isUserLoggedIn$.subscribe(value => {
      this.menuService.showMenu = false;
    });

    // Hook up the visibility of the login control.
    this.isLoginVisible$ = this.userService.isUserLoggedIn$;

    this.mainChatId$ = this.chatService.mainChat$.pipe(
      map(c => c?._id)
    );
  }

  mainChatId$!: Observable<ObjectId | undefined>;

  /** Observable emitting a boolean value, indicating whether or not the login
   *   control should be visible. */
  isLoginVisible$!: Observable<boolean>;

  logout(): void {
    this.userService.logout();
  }
}
