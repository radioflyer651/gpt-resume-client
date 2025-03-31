import { Routes } from '@angular/router';
import { ResumeStaticComponent } from './components/resume-static/resume-static.component';
import { TarotGameMainComponent } from './components/tarot-game/tarot-game-main/tarot-game-main.component';
import { TarotHomeComponent } from './components/tarot-game/tarot-home/tarot-home.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/static-resume'
    },
    {
        path: 'static-resume',
        pathMatch: 'full',
        component: ResumeStaticComponent
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
