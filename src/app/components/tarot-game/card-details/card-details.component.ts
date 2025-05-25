import { Component, Input } from '@angular/core';
import { ClientApiService } from '../../../services/client-api.service';
import { ObjectId } from 'mongodb';
import { BehaviorSubject, combineLatestWith, EMPTY, map, switchMap, takeUntil } from 'rxjs';
import { ComponentBase } from '../../component-base/component-base.component';
import { TarotCard } from '../../../../model/shared-models/tarot-game/tarot-card.model';
import { ReadonlySubject } from '../../../../utils/readonly-subject';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-card-details',
  imports: [
    CommonModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './card-details.component.html',
  styleUrl: './card-details.component.scss'
})
export class CardDetailsComponent extends ComponentBase {
  constructor(
    readonly clientApiService: ClientApiService,
  ) {
    super();
  }

  ngOnInit() {
    // We need to update the details for this dialog whenever
    //  the card ID is changed.
    this._cardDetails = new ReadonlySubject(
      this.ngDestroy$,
      this.cardId$.pipe(
        switchMap(cardIdValue => {
          // If there's no value, then there's nothing to get from the server.
          if (cardIdValue.trim() === '') {
            return EMPTY;
          }

          // Return the value from the server.
          return this.clientApiService.getTarotCardDetails(cardIdValue);
        })
      ));


    this._cardImageUrl = new ReadonlySubject(
      this.ngDestroy$,
      this.cardId$.pipe(
        combineLatestWith(this.cardImageNumber$),
        map(([cardIdValue, cardImageNumber]) => {
          // If there's no value, then there's nothing to get from the server.
          if (cardIdValue.trim() === '') {
            return undefined;
          }

          return `${environment.apiBaseUrl}tarot/images/${this.cardId}/${cardImageNumber}`;
        }),
      ));

  }

  // #region cardImageUrl
  private _cardImageUrl!: ReadonlySubject<string | undefined>;

  get cardImageUrl$() {
    return this._cardImageUrl.observable$;
  }

  get cardImageUrl(): string | undefined {
    return this._cardImageUrl.value;
  }
  // #endregion

  // #region cardImageNumber
  private readonly _cardImageNumber = new BehaviorSubject<number>(1);
  readonly cardImageNumber$ = this._cardImageNumber.asObservable();

  @Input()
  get cardImageNumber(): number {
    return this._cardImageNumber.getValue();
  }

  set cardImageNumber(newVal: number) {
    this._cardImageNumber.next(newVal);
  }
  // #endregion

  // #region cardId
  private readonly _cardId = new BehaviorSubject<ObjectId>('');
  readonly cardId$ = this._cardId.asObservable();

  /** Gets or sets the ID of the tarot card to show the info for. */
  @Input({ required: true })
  get cardId(): ObjectId {
    return this._cardId.getValue();
  }

  set cardId(newVal: ObjectId) {
    this._cardId.next(newVal);
  }
  // #endregion

  // #region cardDetails
  private _cardDetails!: ReadonlySubject<TarotCard | undefined>;

  get cardDetails$() {
    return this._cardDetails.observable$;
  }

  /** Contains the TarotCard details for the specified cardId. */
  get cardDetails(): TarotCard | undefined {
    return this._cardDetails.value;
  }
  // #endregion
}
