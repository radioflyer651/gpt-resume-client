import { Injectable } from '@angular/core';
import { ClientApiService } from './services/client-api.service';
import { Router } from '@angular/router';
import { QuickJobSetupRequest } from '../model/shared-models/quick-job-setup-request.model';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { QuickJobCreateComponent } from './components/companies/quick-job-create/quick-job-create.component';
import { ObjectId } from 'mongodb';
import { LoadingService } from './services/loading.service';

@Injectable({
  providedIn: 'root'
})
export class QuickJobServiceService {
  constructor(
    readonly apiClient: ClientApiService,
    readonly router: Router,
    readonly dialogService: DialogService,
    readonly loadingService: LoadingService,
  ) { }

  dialogReference!: DynamicDialogRef<QuickJobCreateComponent>;

  /** Opens the QuickJobCreateComponent, and takes responsibility for collecting the info, and
   *   performing the creation of the job if the user doesn't cancel. */
  createQuickJob(companyId: ObjectId | undefined, autoNavigate: boolean): void {
    // Open the dialog.
    this.dialogReference = this.dialogService.open(QuickJobCreateComponent, {
      header: 'Quick Create Job',
      inputValues: { requestData: createNewQuickJobProps(companyId) },
      appendTo: 'body',
      closable: true,
    });

    this.dialogReference.onClose.subscribe((result: QuickJobSetupRequest | undefined) => {
      // If we don't have a value, then we just close and do nothing.
      if (!result) {
        return;
      }

      // We need to setup a new job:

      // Set the loading state of the application.
      const loadingId = this.loadingService.setLoading();

      // Make the API call.
      this.apiClient.createAutomatedJobListing(result).subscribe({
        next: (apiResult) => {
          // Always need to set the loading state.
          this.loadingService.setNotLoading(loadingId);

          // Navigate if we need to.
          if (autoNavigate) {
            this.router.navigate([`/admin/companies/edit/${apiResult.companyId}/job-listing/${apiResult.jobDescriptionId}`]);
          }
        },
        complete: () => {
          // Always need to set the loading state.
          this.loadingService.setNotLoading(loadingId);
        }
      });
    });
  }
}

/** Creates/returns a new QuickJobSetupRequest with default values. */
function createNewQuickJobProps(companyId?: ObjectId): QuickJobSetupRequest {
  if (companyId) {
    return {
      _id: companyId,
      jobDescription: '',
      jobLink: ''
    };
  } else {
    return {
      companyInfo: {
        companyWebsite: '',
        companyName: '',
        companyJobsSite: '',
      },
      jobDescription: '',
      jobLink: '',
    };
  }
}
