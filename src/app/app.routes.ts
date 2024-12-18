import { Routes } from '@angular/router';
import { AppointmentComponent } from './components/appointment/appointment.component';

export const routes: Routes = [
    { path: '', redirectTo: '/appointments', pathMatch: 'full' }, // Fixed redirect
    { 
        path: 'appointments',
        loadComponent: () => import('./components/appointment/appointment.component').then(c => c.AppointmentComponent)
    }
];

