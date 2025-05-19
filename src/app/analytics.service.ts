import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

declare let gtag: Function;


@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      gtag('config', 'G-CRGV1425LM', {
        'page_path': event.urlAfterRedirects
      });
    });
  }
}
