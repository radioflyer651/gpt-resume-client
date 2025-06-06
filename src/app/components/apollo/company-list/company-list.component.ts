import { Component } from '@angular/core';
import { ComponentBase } from '../../component-base/component-base.component';
import { ClientApiService } from '../../../services/client-api.service';
import { ApolloCompany } from '../../../../model/apollo/apollo-api-response.model';
import { Observable, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-company-list',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,

  ],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss'
})
export class CompanyListComponent extends ComponentBase {
  constructor(
    readonly apiClient: ClientApiService,
  ) {
    super();
  }

  ngOnInit() {
    // Initialization logic can go here.
    this.apolloCompanies$ = this.apiClient.getApolloCompanyList().pipe(
      takeUntil(this.ngDestroy$)
    );
  }

  apolloCompanies$!: Observable<ApolloCompany[]>;;

}
