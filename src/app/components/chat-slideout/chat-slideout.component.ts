import { Component, Input, OnInit } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { ChatSidebarComponent } from "../chat-sidebar/chat-sidebar.component";
import { ObjectId } from 'mongodb';
import { DockModule } from 'primeng/dock';
import { ChatService } from '../../services/chat.service';
import { TooltipModule } from 'primeng/tooltip';;
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { PageSizeService } from '../../services/page-size.service';
import { ComponentBase } from '../component-base/component-base.component';
import { takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-chat-slideout',
  imports: [
    CommonModule,
    DrawerModule,
    ChatSidebarComponent,
    DockModule,
    TooltipModule,
    ButtonModule,
  ],
  templateUrl: './chat-slideout.component.html',
  styleUrl: './chat-slideout.component.scss'
})
export class ChatSlideoutComponent extends ComponentBase {
  constructor(
    readonly chatService: ChatService,
    readonly pageSizeService: PageSizeService,
  ) {
    super();
  }

  ngOnInit() {
  }


  @Input({ required: true })
  chatId!: ObjectId;
}
