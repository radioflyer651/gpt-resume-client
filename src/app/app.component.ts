import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from "./components/site-header/site-header.component";
import { ChatPopupService } from './services/chat-popup.service';
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MessagingService } from './services/messaging.service';
import { ComponentBase } from './components/component-base/component-base.component';
import { takeUntil } from 'rxjs';
import { LoginComponent } from "./components/login/login.component";
import { UserService } from './services/user.service';
import { CommonModule } from '@angular/common';
import { ChatService } from './services/chat.service';
import { ChatSidebarComponent } from "./components/chat-sidebar/chat-sidebar.component";

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
    ChatSidebarComponent
],
  providers: [
    MessageService,
    ChatService
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent extends ComponentBase {
  constructor(
    readonly chatPopupService: ChatPopupService,
    readonly messagingService: MessagingService,
    readonly messageService: MessageService,
    readonly userService: UserService,
    readonly chatService: ChatService,
  ) {
    super();

  }

  ngOnInit() {
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
}
