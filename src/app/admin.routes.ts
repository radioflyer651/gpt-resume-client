import { Routes } from "@angular/router";
import { AdminHomeComponent } from "./components/admin-home/admin-home.component";
import { CompaniesListComponent } from "./components/companies-list/companies-list.component";

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
                    }
                ]
            },
        ]
    }
];