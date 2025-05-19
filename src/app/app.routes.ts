import { Routes } from '@angular/router';
import { TerminalComponent } from './terminal/terminal.component';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'terminal', component: TerminalComponent }
];
