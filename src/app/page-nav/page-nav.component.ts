import { Component, OnInit, OnDestroy, Renderer2, Inject, PLATFORM_ID, DOCUMENT } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-page-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  // --- UPDATED TEMPLATE ---
  // The order of elements has been reversed to change the visual order on screen.
  template: `
    <div class="page-nav-controls">
      <a routerLink="/" class="nav-button home-button-page" [attr.aria-label]="navCtrl_home_ariaLabel">
        <span class="material-symbols-outlined">home</span>
      </a>
      <button class="nav-button theme-toggle" (click)="toggleTheme()" [attr.aria-label]="navCtrl_themeToggle_ariaLabel" [attr.aria-pressed]="currentTheme === 'dark'">
        <span class="material-symbols-outlined icon-sun">light_mode</span>
        <span class="material-symbols-outlined icon-moon">dark_mode</span>
      </button>
      <button class="nav-button terminal-toggle" (click)="navigateToTerminal()" [attr.aria-label]="navCtrl_terminal_ariaLabel">
        <span class="material-symbols-outlined">terminal</span>
      </button>
    </div>
  `,
  styleUrls: ['./page-nav.component.scss']
})
export class PageNavComponent implements OnInit {
  navCtrl_home_ariaLabel = "Go to Home page";
  navCtrl_terminal_ariaLabel = "Open Terminal";
  navCtrl_themeToggle_ariaLabel = "Change theme";

  currentTheme: 'light' | 'dark' = 'light';
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.initializeTheme();
    }
  }

  navigateToTerminal(): void {
    this.router.navigate(['/terminal']);
  }

  initializeTheme(): void {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.currentTheme = (storedTheme as 'light' | 'dark') || (prefersDark ? 'dark' : 'light');
    this.applyTheme(this.currentTheme);
  }

  applyTheme(theme: 'light' | 'dark'): void {
    this.currentTheme = theme;
    if (this.isBrowser) {
      if (theme === 'dark') {
        this.renderer.addClass(this.document.body, 'dark-theme');
      } else {
        this.renderer.removeClass(this.document.body, 'dark-theme');
      }
    }
  }

  toggleTheme(): void {
    if (this.isBrowser) {
      const newTheme = this.document.body.classList.contains('dark-theme') ? 'light' : 'dark';
      this.applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    }
  }
}