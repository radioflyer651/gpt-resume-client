import { Component, Input } from '@angular/core';
import { QuickJobCompanyInfo, QuickJobSetupRequest } from '../../../../model/shared-models/quick-job-setup-request.model';
import { ComponentBase } from '../../component-base/component-base.component';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-quick-job-create',
  imports: [
    CommonModule,
    FormsModule,
    FloatLabelModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
  ],
  templateUrl: './quick-job-create.component.html',
  styleUrl: './quick-job-create.component.scss'
})
export class QuickJobCreateComponent extends ComponentBase {
  constructor(
    private dialogRef: DynamicDialogRef<QuickJobCompanyInfo>
  ) {
    super();
  }

  /** Gets or sets the request data that's being interacted with. */
  @Input({ required: true })
  requestData!: QuickJobSetupRequest;

  get companyInfo(): QuickJobCompanyInfo | undefined {
    if ('companyInfo' in this.requestData) {
      return this.requestData.companyInfo;
    }
    return undefined;
  }

  close() {
    this.dialogRef.close(this.requestData);
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}
