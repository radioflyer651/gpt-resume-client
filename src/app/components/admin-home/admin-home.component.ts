import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChatSlideoutComponent } from '../chat-slideout/chat-slideout.component';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { BehaviorSubject } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { MenuService } from '../../services/menu.service';
import { PageSizeService } from '../../services/page-size.service';
import { ReadonlySubject } from '../../../utils/readonly-subject';
import { ComponentBase } from '../component-base/component-base.component';

@Component({
  selector: 'app-admin-home',
  imports: [
    CommonModule,
    RouterModule,
    ChatSlideoutComponent,
    ChatSidebarComponent,
  ],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.scss'
})
export class AdminHomeComponent extends ComponentBase {
  constructor(
    readonly pageSizeService: PageSizeService,
    readonly menuService: MenuService,
    readonly chatService: ChatService) {
    super();

  }

  ngOnInit() {
    this._showChatWindow = new ReadonlySubject(this.ngDestroy$, this.menuService.showMenu$);
  }

  // #region showChatWindow
  private _showChatWindow!: ReadonlySubject<boolean>;

  get showChatWindow$() {
    return this._showChatWindow.observable$;
  }

  get showChatWindow(): boolean {
    return this._showChatWindow.value;
  }
  // #endregion

  // #region chatId
  private readonly _chatId = new BehaviorSubject<string | undefined>(undefined);
  readonly chatId$ = this._chatId.asObservable();

  get chatId(): string | undefined {
    return this._chatId.getValue();
  }
  set chatId(newVal: string | undefined) {
    this._chatId.next(newVal);
  }
  // #endregion
}
