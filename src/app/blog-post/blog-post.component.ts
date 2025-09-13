// src/app/blog-post/blog-post.component.ts

import { Component, OnInit, Inject, PLATFORM_ID, Renderer2, DOCUMENT } from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BlogService, Post } from '../blog.service';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './blog-post.component.html',
  styleUrls: ['./blog-post.component.scss']
})
export class BlogPostComponent implements OnInit {
  post: Post | undefined;
  postContent: SafeHtml | undefined;
  
  navCtrl_home_ariaLabel = "Go to Home page";
  navCtrl_terminal_ariaLabel = "Open Terminal";
  navCtrl_themeToggle_ariaLabel = "Change theme";

  currentTheme: 'light' | 'dark' = 'light';
  private isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private titleService: Title,
    private metaService: Meta,
    private sanitizer: DomSanitizer,
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
    
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.post = this.blogService.getPostBySlug(slug);
    }

    if (this.post) {
      this.titleService.setTitle(`${this.post.title} - Jan Rosell`);
      this.metaService.updateTag({ name: 'description', content: this.post.summary });
      const htmlContent = marked(this.post.content as string);
      this.postContent = this.sanitizer.bypassSecurityTrustHtml(htmlContent as string);
    } else {
      this.router.navigate(['/blog']); // Redirect if post not found
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
}