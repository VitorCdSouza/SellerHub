import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./login/login.component').then((modulo) => modulo.LoginComponent),
    title: 'Entrar | SellerHub',
  },
  { path: '**', redirectTo: '' },
];
