import { Routes } from '@angular/router';
import { TerminalComponent } from './terminal/terminal.component';
import { HomeComponent } from './home/home.component';
import { BlogComponent } from './blog/blog.component';
import { BlogPostComponent } from './blog-post/blog-post.component';
import { NotFoundComponent } from './not-found/not-found.component'; // Import

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'terminal', component: TerminalComponent },
    { path: 'blog', component: BlogComponent },
    { path: 'blog/:slug', component: BlogPostComponent },
    { path: '404', component: NotFoundComponent }, // Add 404 route
    { path: '**', redirectTo: '/404' } // Wildcard route redirects to 404
];