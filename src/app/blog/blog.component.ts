// src/app/blog/blog.component.ts

import { Component, OnInit, Inject, PLATFORM_ID, Renderer2, DOCUMENT } from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BlogService, Post } from '../blog.service';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {
  posts: Post[] = [];
  navCtrl_home_ariaLabel = "Go to Home page";
  navCtrl_terminal_ariaLabel = "Open Terminal";
  navCtrl_themeToggle_ariaLabel = "Change theme";
  
  currentTheme: 'light' | 'dark' = 'light';
  private isBrowser: boolean;

  constructor(
    private blogService: BlogService,
    private router: Router,
    private titleService: Title,
    private metaService: Meta,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.posts = this.blogService.getPosts();
    this.titleService.setTitle('The Prompt - Jan Rosell');
    this.metaService.updateTag({
      name: 'description',
      content: 'The Prompt: A collection of articles and thoughts by Jan Rosell on software development, technology, and career.'
    });
    if (this.isBrowser) {
      this.initializeTheme();
    }
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToTerminal(): void {
    this.router.navigate(['/terminal']);
  }

  initializeTheme(): void {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme) {
      this.currentTheme = storedTheme as 'light' | 'dark';
    } else {
      this.currentTheme = prefersDark ? 'dark' : 'light';
    }
    this.applyTheme(this.currentTheme);
  }

  applyTheme(theme: 'light' | 'dark'): void {
    this.currentTheme = theme;
    if (theme === 'dark') {
      this.renderer.addClass(this.document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(this.document.body, 'dark-theme');
    }
  }

  toggleTheme(): void {
    if (this.isBrowser) {
      const newTheme = this.document.body.classList.contains('dark-theme') ? 'light' : 'dark';
      this.applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    }
  }
  
  _currentYear(): number {
    return new Date().getFullYear();
  }
}