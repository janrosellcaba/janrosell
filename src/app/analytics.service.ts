import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

declare let gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object // 1. Injecta PLATFORM_ID
  ) {
    // 2. Comprova si estem al navegador abans de subscriure's o executar res
    if (isPlatformBrowser(this.platformId)) {
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        // 3. Ara aquesta crida només s'executarà al navegador
        gtag('config', 'G-CRGV1425LM', {
          'page_path': event.urlAfterRedirects
        });
      });
    }
  }
}