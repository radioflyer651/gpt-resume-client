import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BehaviorSubject, combineLatestWith, lastValueFrom, map, startWith, Subject, switchMap, takeUntil } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Company } from '../../../../model/shared-models/company.model';
import { ClientApiService } from '../../../services/client-api.service';
import { ComponentBase } from '../../component-base/component-base.component';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, LazyLoadMeta } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { QuickJobServiceService } from '../../../quick-job-service.service';
import { PaginationHelper } from '../../../../utils/pagination-helper.utils';
import { RemainingSizeHelper } from '../../../../utils/remaining-size-helper';

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
    PanelModule,
    FloatLabelModule,
    InputTextModule,
  ],
  templateUrl: './companies-list.component.html',
  styleUrl: './companies-list.component.scss'
})
export class CompaniesListComponent extends ComponentBase {
  constructor(
    readonly apiClient: ClientApiService,
    readonly confirmationService: ConfirmationService,
    readonly quickJobCreateService: QuickJobServiceService,
  ) {
    super();
  }

  reloadCompanies$ = new Subject<void>();

  ngOnInit() {
    const companies = this.reloadCompanies$.pipe(
      startWith(undefined),
      switchMap(() => {
        return this.apiClient.getAllCompanies().pipe(
          combineLatestWith(this.hideArchived$, this.nameFilter$),
          map(([companies, hideArchived, nameFilter]) => {
            this.tableSizeHelper.updateSize();

            // Remove any leading/trailing whitespace from the filter.
            nameFilter = nameFilter?.trim();

            // Hide the archives, if needed.
            if (hideArchived) {
              companies = companies.filter(c => !c.archive);
            }

            companies.sort((c1, c2) => {
              return c1.name.localeCompare(c2.name);
            });

            nameFilter = (nameFilter?.trim() ?? '').toLocaleLowerCase();

            // Apply the filter, if needed.
            if (nameFilter) {
              companies = companies.filter(c => {
                return c.name.toLocaleLowerCase().includes(nameFilter) || c.website.toLocaleLowerCase().includes(nameFilter);
              });
            }

            return companies;
          }),
        );
      }),
      takeUntil(this.ngDestroy$));

    companies.subscribe(companies => {
      this.companyList = companies;
    });
  }

  tableSizeHelper = new RemainingSizeHelper('#table-top-position-helper', this.ngDestroy$);

  companyList: Company[] = [];

  reloadCompanies(): void {
    this.reloadCompanies$.next();
  }

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

  clearSearch(): void {
    this.nameFilter = '';
  }

  // #region nameFilter
  private readonly _nameFilter = new BehaviorSubject<string>('');
  readonly nameFilter$ = this._nameFilter.asObservable();

  /** Gets or sets the filter string to filter companies by name with. */
  get nameFilter(): string {
    return this._nameFilter.getValue();
  }

  set nameFilter(newVal: string) {
    this._nameFilter.next(newVal);
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

  createQuickJob(): void {
    this.quickJobCreateService.createQuickJob(undefined, true);
  }

  // #region Data Loading

  itemHeight = 38;

  pageSize = 30;

  loadingData: boolean = false;

  scrollOptions = {
    delay: 250,
  };

  loadDataInternal = async (lazyLoadMeta: LazyLoadMeta) => {
    return await lastValueFrom(this.apiClient.getAllCompaniesPaginated(lazyLoadMeta));
  };

  dataLoader = new PaginationHelper<Company>(this.loadDataInternal);


  // #endregion

  getJobSiteUrl(siteName: string) {
    if (!siteName) {
      return '';
    }

    if (!siteName.startsWith('http://') && !siteName.startsWith('https://')) {
      return `https://${siteName}`;
    }

    return siteName;
  }
}
