import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { LoginComponent } from '../login/login.component';
import { ComponentBase } from '../component-base/component-base.component';
import { ObjectId } from 'mongodb';
import { MessageService } from 'primeng/api';
import { map, Observable } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { MenuService } from '../../services/menu.service';
import { MessagingService } from '../../services/messaging.service';
import { PageSizeService } from '../../services/page-size.service';
import { ServerEventsService } from '../../services/server-events.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-app-home',
  imports: [
    CommonModule,
    RouterOutlet,
    DrawerModule,
    TextareaModule,
    FormsModule,
    ToastModule,
    LoginComponent,
    ChatSidebarComponent,
    ButtonModule,
  ],
  templateUrl: './app-home.component.html',
  styleUrl: './app-home.component.scss'
})
export class AppHomeComponent extends ComponentBase {
  constructor(
    readonly messagingService: MessagingService,
    readonly messageService: MessageService,
    readonly userService: UserService,
    readonly llmFunctionService: ServerEventsService,
    readonly pageSizeService: PageSizeService,
    readonly menuService: MenuService,
    readonly chatService: ChatService,
  ) {
    super();

  }

  ngOnInit() {
    this.mainChatId$ = this.chatService.mainChat$.pipe(
      map(c => c?._id)
    );

    // Hook up the visibility of the login control.
    this.isLoginVisible$ = this.userService.isUserLoggedIn$;

    // When the user logs in or out, we want the menu to close (assuming it was open).
    this.userService.isUserLoggedIn$.subscribe(value => {
      this.menuService.showMenu = false;
    });
  }

  mainChatId$!: Observable<ObjectId | undefined>;

  /** Observable emitting a boolean value, indicating whether or not the login
   *   control should be visible. */
  isLoginVisible$!: Observable<boolean>;

  logout(): void {
    this.userService.logout();
  }

  /** Returns a boolean value indicating whether or not
   *   to show the chat window. */
  get showChatWindow() {
    if (!this.userService.isUserLoggedIn) {
      return false;
    }

    if (!this.chatService.mainChat) {
      return false;
    }

    return true;
  }
}
