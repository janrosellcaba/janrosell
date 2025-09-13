import { Routes } from '@angular/router';
import { TerminalComponent } from './terminal/terminal.component';
import { HomeComponent } from './home/home.component';
import { BlogComponent } from './blog/blog.component'; // Import
import { BlogPostComponent } from './blog-post/blog-post.component'; // Import

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'terminal', component: TerminalComponent },
    { path: 'blog', component: BlogComponent }, // Add route
    { path: 'blog/:slug', component: BlogPostComponent } // Add route
];