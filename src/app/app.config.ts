import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { dateConverterInterceptor } from '../http-interceptor';
import { DialogService } from 'primeng/dynamicdialog';


export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([dateConverterInterceptor])
    ),
    DialogService,
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    providePrimeNG({ theme: { preset: Aura } }),
    provideAnimationsAsync()
  ]
};
