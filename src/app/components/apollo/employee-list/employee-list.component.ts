import { Component } from '@angular/core';
import { ComponentBase } from '../../component-base/component-base.component';
import { ClientApiService } from '../../../services/client-api.service';
import { ApolloService } from '../../../services/apollo.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CompanyService } from '../../../services/company.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { BehaviorSubject, combineLatestWith, debounceTime, filter, map, Observable, startWith, takeUntil, tap, withLatestFrom } from 'rxjs';
import { PanelModule } from 'primeng/panel';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ApolloEmployee, ApolloPerson } from '../../../../model/shared-models/apollo/apollo-api-response.model';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ObjectId } from 'mongodb';

@Component({
  selector: 'app-employee-list',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    RouterModule,
    PanelModule,
    FloatLabelModule,
    InputTextModule,
    ProgressSpinnerModule,
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
    this.employeeSearchList$ = this.companyService.apolloEmployeeList$.pipe(
      tap(() => {
        this.isLoading = false;
      }),
      combineLatestWith(this.searchText$),
      debounceTime(250),
      map(([value, searchText]) => {
        searchText = searchText.trim().toLocaleLowerCase();

        if (!value || !searchText) {
          return value;
        }

        const filterOn = (value: string | undefined) => {
          if (!value) {
            return false;
          }


          try {
            const regex = new RegExp(searchText, 'i');
            return regex.test(value);
          } catch (err) {
            console.error(`Search Error: ${err}`);
            return false;
          }
        };

        return value.filter(v => {
          return filterOn(v.name) || filterOn(v.title) || filterOn(v.seniority);
        });
      }),
      takeUntil(this.ngDestroy$),
    );
  }

  isLoading = true;

  // #region searchText
  clearSearch() {
    this.searchText = '';
  }

  private readonly _searchText = new BehaviorSubject<string>('');
  readonly searchText$ = this._searchText.asObservable();

  get searchText(): string {
    return this._searchText.getValue();
  }

  set searchText(newVal: string) {
    this._searchText.next(newVal);
  }
  // #endregion

  employeeSearchList$!: Observable<ApolloPerson[] | undefined>;

  createContactFromEmployee(apolloContact: ApolloEmployee) {
    const apolloId = apolloContact.person_id ?? apolloContact.id;
    this.apiClient.createContactFromApolloId(this.companyService.companyId as ObjectId, apolloId).subscribe(result => {
      this.companyService.reloadProperty('contact-list');
    });
  }
}
