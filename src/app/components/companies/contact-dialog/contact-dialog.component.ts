import { CommonModule } from '@angular/common';
import { Component, Output, Input, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { ComponentBase } from '../../component-base/component-base.component';
import { ObjectId } from 'mongodb';
import { CompanyContact } from '../../../../model/shared-models/job-tracking/company-contact.data';
import { BehaviorSubject, combineLatestWith, EMPTY, lastValueFrom, of, switchMap, takeUntil } from 'rxjs';
import { ClientApiService } from '../../../services/client-api.service';
import { NewDbItem, UpsertDbItem } from '../../../../model/shared-models/db-operation-types.model';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommentsEditorComponent } from "../../comments-editor/comments-editor.component";
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-contact-dialog',
  imports: [
    RouterModule,
    CommonModule,
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    TableModule,
    ToolbarModule,
    ProgressSpinnerModule,
    ButtonModule,
    DialogModule,
    CommentsEditorComponent,
    TabsModule,
  ],
  templateUrl: './contact-dialog.component.html',
  styleUrls: [
    './contact-dialog.component.scss',
    '../../../../buttons.scss',
  ]
})
export class ContactDialogComponent extends ComponentBase {
  constructor(
    readonly apiClient: ClientApiService,
  ) {
    super();
  }

  ngOnInit() {
    this.contactId$.subscribe(v => {
      console.log(`contactId: ${v}`);
    });

    this.visible$.subscribe(v => {
      console.log(`visible: ${v}`);
    });

    this.companyId$.subscribe(v => {
      console.log(`Company ID: ${v}`);
    });

    // Handles setting the employee whenever the company or contact IDs change.
    const employee$ = this.contactId$.pipe(
      combineLatestWith(this.companyId$, this.visible$),
      switchMap(([id, companyId, visible]) => {
        // If we're hiding the dialog, just exit.
        //  Concerning visibility, we only want to reset the form when we show it.
        if (!visible) {
          return EMPTY;
        }

        // Reset the contact, so the progress spinner will show.
        this.targetContact = undefined;

        if (id === 'new') {
          return of(this.createNewContact(companyId));
        } else {
          return this.apiClient.getCompanyContactById(id);
        }
      }),
      takeUntil(this.ngDestroy$)
    );

    employee$.subscribe(contact => {
      if (contact) {
        this.targetContact = contact;
      } else {
        throw new Error(`ContactId is not valid.`);
      }
    });
  }

  tabIndex: number = 0;

  // #region companyId
  private readonly _companyId = new BehaviorSubject<ObjectId>('');
  readonly companyId$ = this._companyId.asObservable();

  /** Gets or sets the company ID, used for creating new contacts for the company. */
  @Input({ required: true })
  get companyId(): ObjectId {
    return this._companyId.getValue();
  }

  set companyId(newVal: ObjectId) {
    this._companyId.next(newVal);
  }
  // #endregion

  /** Called when the user clicks ok or cancel. */
  @Output()
  onComplete = new EventEmitter<boolean>();

  // #region contactId
  private readonly _contactId = new BehaviorSubject<ObjectId | 'new'>('new');
  readonly contactId$ = this._contactId.asObservable();

  @Input({ required: true })
  /** Gets or sets the ObjectId of the contact being edited - or new if the contact is new. */
  get contactId(): ObjectId | 'new' {
    return this._contactId.getValue();
  }
  set contactId(newVal: ObjectId | 'new') {
    this._contactId.next(newVal);
  }
  // #endregion

  /** Gets or sets the contact that's being edited. */
  targetContact?: UpsertDbItem<CompanyContact>;

  /** Returns a new contact to allow the user to edit and submit it. */
  private createNewContact(companyId: ObjectId): NewDbItem<CompanyContact> {
    return {
      comments: [],
      companyId: companyId,
      email: '',
      firstName: '',
      lastName: '',
      title: '',
      phoneNumbers: []
    };
  }

  get headerText() {
    if (this.contactId === 'new') {
      return 'Create Contact';
    } else {
      return 'Edit Contact';
    }
  }

  // #region visible
  private readonly _visible = new BehaviorSubject<boolean>(false);
  readonly visible$ = this._visible.asObservable();

  /** Controls the visibility of the dialog. */
  @Input()
  get visible(): boolean {
    return this._visible.getValue();
  }

  set visible(newVal: boolean) {
    this._visible.next(newVal);
    this.visibleChange.next(newVal);
  }
  // #endregion

  @Output()
  visibleChange = new EventEmitter<boolean>();

  /** Called when the user clicks the submit or cancel button. */
  async onCompleteLocal(cancelled: boolean): Promise<void> {
    this.tabIndex = 0;

    // Save the updated data if not cancelled.
    if (!cancelled) {
      await lastValueFrom(this.apiClient.upsertContact(this.targetContact!));
    }

    // Close the dialog, and be done with it.
    this.visible = false;
    this.onComplete.next(cancelled);
  }
}
