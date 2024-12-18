import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),              // Routing configuration
    provideClientHydration(),           // Ensures compatibility with server-side rendering
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), // Firebase initialization
    provideFirestore(() => getFirestore()) // Firestore setup
  ]
};
