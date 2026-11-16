import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowser } from '@angular/platform-browser';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import 'zone.js'

if (environment.production) {
  enableProdMode();
}

const bootstrapOptions = {
  applicationProviders: [provideZoneChangeDetection()],
} as NonNullable<Parameters<ReturnType<typeof platformBrowser>['bootstrapModule']>[1]>;

platformBrowser().bootstrapModule(AppModule, bootstrapOptions)
  .catch(err => console.error(err));
