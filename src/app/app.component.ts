import { Component, ContentChild, TemplateRef } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from "./components/site-header/site-header.component";
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MessagingService } from './services/messaging.service';
import { ComponentBase } from './components/component-base/component-base.component';
import { takeUntil } from 'rxjs';
import { LoginComponent } from "./components/login/login.component";
import { UserService } from './services/user.service';
import { CommonModule } from '@angular/common';
import { ServerEventsService } from './services/server-events.service';
import { PageSizeService } from './services/page-size.service';
import { MenuService } from './services/menu.service';
import { ButtonModule } from 'primeng/button';
import { ChatService } from './services/chat.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DockModule } from 'primeng/dock';
import { DialogModule } from 'primeng/dialog';
import { LoginService } from './services/login.service';
import { LoadingComponent } from "./components/loading/loading.component";

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
    ButtonModule,
    RouterModule,
    ConfirmDialogModule,
    DockModule,
    DialogModule,
    LoadingComponent
],
  providers: [
    MessageService,
    ConfirmationService,
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
    readonly chatService: ChatService,
    readonly loginService: LoginService,
  ) {
    super();

  }

  @ContentChild('#rightGutterContent')
  rightGutterTemplate?: TemplateRef<any>;

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
  }

  closeMenu(): void {
    this.menuService.showMenu = false;
  }

  logout(): void {
    this.userService.logout();
  }

  /** Toggles whether or not the chat window is open. */
  toggleChatSlideout() {
    this.chatService.isChatSlideoutOpen = !this.chatService.isChatSlideoutOpen;
  }

  login(): void {
    this.loginService.login();
  }
}
