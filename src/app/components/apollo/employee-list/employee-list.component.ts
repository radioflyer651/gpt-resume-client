import { Component } from '@angular/core';
import { ComponentBase } from '../../component-base/component-base.component';
import { ClientApiService } from '../../../services/client-api.service';
import { ApolloService } from '../../../services/apollo.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-employee-list',
  imports: [],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent extends ComponentBase {
  constructor(
    readonly apiClient: ClientApiService,
    readonly apolloService: ApolloService,
    readonly router: Router,
    readonly route: ActivatedRoute,
  ) {
    super();

  }

  ngOnInit(): void {

  }


}
