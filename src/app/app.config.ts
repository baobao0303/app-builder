import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { BUILDER_CONTEXT, CORE_CONTEXT } from 'builder';
import { AppBuilderContextService } from './services/app-builder-context.service';
import { AppViewContextService, VIEW_CONTEXT } from './services/app-view-context.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    AppBuilderContextService,
    { provide: BUILDER_CONTEXT, useExisting: AppBuilderContextService },
    AppViewContextService,
    { provide: CORE_CONTEXT, useExisting: AppViewContextService },
    { provide: VIEW_CONTEXT, useExisting: AppViewContextService },
  ],
};
