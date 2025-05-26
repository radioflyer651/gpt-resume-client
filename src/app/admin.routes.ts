import { Routes } from "@angular/router";
import { AdminHomeComponent } from "./components/admin-home/admin-home.component";
import { CompaniesListComponent } from "./components/companies-list/companies-list.component";
import { CompanyDetailComponent } from "./components/companies/company-detail/company-detail.component";

export const TarotRoutes: Routes = [
    {
        path: '',
        component: AdminHomeComponent,
        children: [
            {
                path: 'companies',
                children: [
                    {
                        path: '',
                        redirectTo: 'list',
                        pathMatch: 'full'
                    },
                    {
                        path: 'list',
                        component: CompaniesListComponent
                    },
                    {
                        path: 'edit/:companyId',
                        component: CompanyDetailComponent
                    }
                ]
            },
        ]
    }
];