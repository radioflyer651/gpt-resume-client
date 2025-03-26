import { Routes } from '@angular/router';
import { ResumeStaticComponent } from './components/resume-static/resume-static.component';

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
    }
];
