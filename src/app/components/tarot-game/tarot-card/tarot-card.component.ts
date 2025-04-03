import { Component, Input } from '@angular/core';
import { ComponentBase } from '../../component-base/component-base.component';
import { environment } from '../../../../environments/environment';
import { TarotCardReference } from '../../../../model/shared-models/tarot-game/tarot-card.model';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardDetailsComponent } from "../card-details/card-details.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tarot-card',
  imports: [
    DialogModule,
    ButtonModule,
    CardDetailsComponent,
    CommonModule,
],
  templateUrl: './tarot-card.component.html',
  styleUrl: './tarot-card.component.scss'
})
export class TarotCardComponent extends ComponentBase {
  constructor() {
    super();
  }

  @Input()
  cardReference?: TarotCardReference;

  get url() {
    if (!this.cardReference?._id || !this.cardReference?.imageNumber) {
      return '';
    }
    return `${environment.apiBaseUrl}tarot/images/${this.cardReference!._id}/${this.cardReference!.imageNumber}`;
  }

  get cardName() {
    return this.cardReference?.cardName;
  }

  get cardUrl() {
    if (!this.cardReference?._id || !this.cardReference?.imageNumber) {
      return '';
    }

    return `url('${this.url}')`;
  }

  /** Controls the visibility of the detail dialog. */
  isCardDetailDialogVisible = false;

  /** Shows the card detail dialog to the user. */
  showDetailDialog(): void {
    this.isCardDetailDialogVisible = true;
  }

  /** Closes the card detail dialog. */
  closDetailsDialog(): void {
    this.isCardDetailDialogVisible = false;
  }
}
