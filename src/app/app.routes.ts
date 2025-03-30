import { Routes } from '@angular/router';
import { ResumeStaticComponent } from './components/resume-static/resume-static.component';
import { TarotGameMainComponent } from './components/tarot-game-main/tarot-game-main.component';

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
        pathMatch: 'full',
        component: TarotGameMainComponent
    }
];
