import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentBase } from '../../component-base/component-base.component';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { JobListingStatus } from '../../../../model/shared-models/job-tracking/job-listing.model';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CheckboxModule } from 'primeng/checkbox';

export type EditStatusResult = {
  cancelled: boolean;
  newValue: JobListingStatus;
};

@Component({
  selector: 'app-status-dialog',
  imports: [
    CommonModule,
    FormsModule,
    DatePickerModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    FloatLabelModule,
    CheckboxModule,
  ],
  templateUrl: './status-dialog.component.html',
  styleUrls: [
    './status-dialog.component.scss',
    '../../../../buttons.scss',
  ]
})
export class StatusDialogComponent extends ComponentBase {
  constructor() {
    super();
  }

  private _visible: boolean = false;
  /** Controls the visibility of this dialog. */
  @Input({ required: true })
  get visible(): boolean {
    return this._visible;
  }
  set visible(value: boolean) {
    this._visible = value;

    this.visibleChange.emit(value);
  }

  @Output()
  visibleChange = new EventEmitter<boolean>();


  private _value: JobListingStatus = { status: '', statusDate: new Date() };

  /** Gets or sets the initial value being edited. */
  @Input({ required: true })
  get value(): JobListingStatus {
    return this._value;
  }
  set value(value: JobListingStatus) {
    this._value = value;

    // Create a copy of it for editing.
    this.editTarget = { ...value };
  }

  /** Actual model being edited. */
  editTarget: JobListingStatus = { status: '', statusDate: new Date() };

  // @Output()
  // valueChange = new EventEmitter<JobListingStatus>();

  /** Event called when the dialog is closed.  Returns whether or not the dialog was cancelled, and the state of the values when closed. */
  @Output()
  closed = new EventEmitter<EditStatusResult>();

  /** Called when the user clicks OK or Cancel. */
  complete(cancelled: boolean): void {
    this.visible = false;
    this.closed.emit({ cancelled, newValue: this.editTarget });
  }

}
