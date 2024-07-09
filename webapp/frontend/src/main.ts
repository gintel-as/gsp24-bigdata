import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import routeConfig  from './app/routes';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routeConfig),provideHttpClient(), provideAnimationsAsync()]
})
  .catch(err => console.error(err));
