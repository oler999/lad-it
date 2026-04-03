import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { HomePageComponent } from './pages/home-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { ScreenPageComponent } from './pages/screen-page.component';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'login'
	},
	{
		path: 'login',
		component: LoginPageComponent
	},
	{
		path: 'home',
		canActivate: [authGuard],
		component: HomePageComponent
	},
	{
		path: 'category/:id',
		canActivate: [authGuard],
		component: ScreenPageComponent
	},
	{
		path: '**',
		redirectTo: 'login'
	}
];
