import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from "./site-header/site-header.component";
import { ChatPopupService } from './chat-popup.service';
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MessagingService } from './messaging.service';
import { ComponentBase } from './component-base/component-base.component';
import { takeUntil } from 'rxjs';
import { LoginComponent } from "./login/login.component";
import { UserService } from './user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    SiteHeaderComponent,
    DrawerModule,
    TextareaModule,
    FormsModule,
    ToastModule,
    LoginComponent
],
  providers: [MessageService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent extends ComponentBase {
  constructor(
    readonly chatPopupService: ChatPopupService,
    readonly messagingService: MessagingService,
    readonly messageService: MessageService,
    readonly userService: UserService,
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
