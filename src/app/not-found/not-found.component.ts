import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PageNavComponent } from '../page-nav/page-nav.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, PageNavComponent],
  template: `
    <app-page-nav></app-page-nav>
    <div class="not-found-container">
      <div class="content">
        <h1 class="status-code">404</h1>
        <p class="message">Page Not Found</p>
        <p class="suggestion">The page you're looking for doesn't exist or has been moved.</p>
        <a routerLink="/" class="home-link">Return to Home</a>
      </div>
    </div>
  `,
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {}