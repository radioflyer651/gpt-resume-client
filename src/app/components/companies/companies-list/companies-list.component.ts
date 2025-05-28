import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BehaviorSubject, combineLatestWith, lastValueFrom, map, Observable, takeUntil } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Company } from '../../../../model/shared-models/company.model';
import { ClientApiService } from '../../../services/client-api.service';
import { ComponentBase } from '../../component-base/component-base.component';
import { ToolbarModule } from 'primeng/toolbar';
import { ObjectId } from 'mongodb';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-companies-list',
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TableModule,
    ToolbarModule,
    ConfirmDialogModule,
    CheckboxModule,
    FormsModule,
  ],
  templateUrl: './companies-list.component.html',
  styleUrl: './companies-list.component.scss'
})
export class CompaniesListComponent extends ComponentBase {
  constructor(
    readonly apiClient: ClientApiService,
    readonly confirmationService: ConfirmationService,
  ) {
    super();
  }

  ngOnInit() {
    const companies = this.apiClient
      .getAllCompanies().pipe(
        combineLatestWith(this.hideArchived$),
        map(([companies, hideArchived]) => {
          // Hide the archives, if needed.
          if (hideArchived) {
            companies = companies.filter(c => !c.archive);
          }

          companies.sort((c1, c2) => {
            return c1.name.localeCompare(c2.name);
          });

          return companies;
        }),
        takeUntil(this.ngDestroy$));

    companies.subscribe(companies => {
      this.companyList = companies;
    });
  }

  companyList: Company[] = [];

  // #region hideArchived
  private readonly _hideArchived = new BehaviorSubject<boolean>(true);
  readonly hideArchived$ = this._hideArchived.asObservable();

  /** Gets or sets a boolean value indicating whether or not to hide the archived companies in the listing. */
  get hideArchived(): boolean {
    return this._hideArchived.getValue();
  }

  set hideArchived(newVal: boolean) {
    this._hideArchived.next(newVal);
  }
  // #endregion

  private async deleteCompany(company: Company): Promise<void> {
    // Delete the company on the server.
    await lastValueFrom(this.apiClient.deleteCompany(company._id));

    // Remove this company from the company list.
    this.companyList = this.companyList.filter(c => c._id !== company._id);
  }

  deleteCompanyConfirmation(company: Company): void {
    this.confirmationService.confirm({
      message: `Are you sure you wish to delete ${company.name}?`,
      closeOnEscape: true,
      closable: true,
      accept: async () => {
        await this.deleteCompany(company);
      }
    });
  }
}
