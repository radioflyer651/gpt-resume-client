import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ComponentBase } from '../component-base/component-base.component';
import { Company } from '../../../model/shared-models/company.model';
import { map, Observable, takeUntil } from 'rxjs';
import { ClientApiService } from '../../services/client-api.service';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-companies-list',
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TableModule,
  ],
  templateUrl: './companies-list.component.html',
  styleUrl: './companies-list.component.scss'
})
export class CompaniesListComponent extends ComponentBase {
  constructor(readonly apiClient: ClientApiService) {
    super();
  }

  ngOnInit() {
    this.companies = this.apiClient
      .getAllCompanies().pipe(
        map(companies => {
          companies.sort((c1, c2) => {
            return c1.name.localeCompare(c2.name);
          });

          return companies;
        }),
        takeUntil(this.ngDestroy$));
  }

  /** Returns all of the companies to be listed. */
  companies!: Observable<Company[]>;
}
