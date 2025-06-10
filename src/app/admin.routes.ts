import { Routes } from "@angular/router";
import { AdminHomeComponent } from "./components/admin-home/admin-home.component";
import { CompanyDetailComponent } from "./components/companies/company-detail/company-detail.component";
import { CompaniesListComponent } from "./components/companies/companies-list/companies-list.component";
import { JobListingsComponent } from "./components/companies/job-listings/job-listings.component";

export const adminRoutes: Routes = [
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
                        path: 'edit/:companyId/job-listing/:jobListingId',
                        component: CompanyDetailComponent
                    },
                    {
                        path: 'edit/:companyId',
                        component: CompanyDetailComponent
                    }
                ]
            },
            {
                path: 'jobs',
                children: [
                    {
                        path: '',
                        redirectTo: 'list',
                        pathMatch: 'full'
                    },
                    {
                        path: 'list',
                        component: JobListingsComponent,
                    }
                ]
            }
        ]
    }
];