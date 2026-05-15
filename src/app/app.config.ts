import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';

function initializeAuthFactory(authService: AuthService) {
    return () => authService.initialized;
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideAnimations(),
        { provide: APP_INITIALIZER, useFactory: initializeAuthFactory, deps: [AuthService], multi: true },
    ]
};
