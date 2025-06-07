import { Component } from '@angular/core';
import { ComponentBase } from '../../component-base/component-base.component';
import { ClientApiService } from '../../../services/client-api.service';
import { ApolloService } from '../../../services/apollo.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from '../../../services/company.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { map, Observable } from 'rxjs';
import { LApolloPerson } from '../../../../model/shared-models/apollo/apollo-local.model';

@Component({
  selector: 'app-employee-list',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent extends ComponentBase {
  constructor(
    readonly apiClient: ClientApiService,
    readonly apolloService: ApolloService,
    readonly router: Router,
    readonly route: ActivatedRoute,
    readonly companyService: CompanyService,
  ) {
    super();

  }

  ngOnInit(): void {

  }

}
