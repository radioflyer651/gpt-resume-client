import { Routes } from '@angular/router';
import { ResumeStaticComponent } from './components/resume-static/resume-static.component';
import { AppHomeComponent } from './components/app-home/app-home.component';
import { TestPageComponent } from './components/test-page/test-page.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'prefix',
        children: [
            {
                path: '',
                component: AppHomeComponent,
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        component: ResumeStaticComponent
                    },
                    {
                        path: 'test',
                        component: TestPageComponent
                    },
                ]
            }
        ]
    },
    {
        path: 'admin',
        loadChildren: () => import('./admin.routes').then(m => m.adminRoutes)
    },
    {
        path: 'tarot-game',
        loadChildren: () => import('./components/tarot-game/tarot-game.routes').then(m => m.tarotRoutes)
    },
    {
        path: '**',
        redirectTo: ''
    },
];
