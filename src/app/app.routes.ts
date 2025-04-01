import { Routes } from '@angular/router';
import { ResumeStaticComponent } from './components/resume-static/resume-static.component';
import { AppHomeComponent } from './components/app-home/app-home.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
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
                ]
            }
        ]
    },
    {
        path: 'tarot-game',
        loadChildren: () => import('./components/tarot-game/tarot-game.routes').then(m => m.TarotRoutes)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
