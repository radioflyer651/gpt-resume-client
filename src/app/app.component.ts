import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from "./site-header/site-header.component";
import { ChatPopupServiceService } from './chat-popup-service.service';
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    SiteHeaderComponent,
    DrawerModule,
    TextareaModule,
    FormsModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(readonly chatPopupService: ChatPopupServiceService) {

  }

  value = '';
}
