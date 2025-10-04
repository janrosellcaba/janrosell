import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, Renderer2, ElementRef, ChangeDetectorRef, HostListener, DOCUMENT } from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BlogService, Post } from '../blog.service';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
// REMOVED: The static imports for marked and highlight.js are no longer here.
// import { marked, Renderer } from 'marked';
// import hljs from 'highlight.js';
import { PageNavComponent } from '../page-nav/page-nav.component';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, PageNavComponent],
  templateUrl: './blog-post.component.html',
  styleUrls: ['./blog-post.component.scss']
})
export class BlogPostComponent implements OnInit, OnDestroy {
  post: Post | undefined;
  postContent: SafeHtml | undefined;
  readingProgress = 0;
  private isBrowser: boolean;
  private structuredDataScript?: HTMLScriptElement;

  // Your constructor and its dependencies remain unchanged.
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private titleService: Title,
    private metaService: Meta,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2,
    private el: ElementRef,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Your onScroll logic remains unchanged.
  @HostListener('window:scroll', [])
  onScroll(): void {
    if (this.isBrowser) {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      this.readingProgress = (scrollY / totalHeight) * 100;
    }
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.post = this.blogService.getPostBySlug(slug);
    }

    if (this.post) {
      // Your meta tag logic remains unchanged.
      this.titleService.setTitle(`The Journal - Jan Rosell`);
      this.metaService.updateTag({ name: 'description', content: this.post.summary });
      this.metaService.updateTag({ property: 'og:title', content: this.post.title });
      this.metaService.updateTag({ property: 'og:description', content: this.post.summary });
      this.metaService.updateTag({ property: 'og:type', content: 'article' });
      this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
      this.metaService.updateTag({ name: 'twitter:title', content: this.post.title });
      this.metaService.updateTag({ name: 'twitter:description', content: this.post.summary });

      // The markdown processing is now moved into a separate async function
      // that only runs in the browser, enabling lazy loading.
      if (this.isBrowser) {
        this.addArticleSchema();
        this.loadAndRenderMarkdown(); // This is the new call.
      }

    } else {
      this.router.navigate(['/404']);
    }
  }

  /**
   * NEW ASYNC FUNCTION:
   * This function dynamically imports the markdown and highlighting libraries only when needed.
   * All of your existing markdown rendering logic has been moved inside here.
   */
  private async loadAndRenderMarkdown(): Promise<void> {
    // 1. Dynamically import the libraries
    const { marked, Renderer } = await import('marked');
    const hljs = (await import('highlight.js')).default;

    if (!this.post) return; // Safety check

    // 2. Your existing renderer logic is now here
    const renderer = new Renderer();
    renderer.code = ({ text, lang }) => {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlightedCode = hljs.highlight(text, { language }).value;
      return `
          <div class="code-block-wrapper">
            <button class="copy-code-button" aria-label="Copy code to clipboard">Copy</button>
            <pre><code class="hljs ${language}">${highlightedCode}</code></pre>
          </div>
        `;
    };
    marked.use({ renderer });

    // 3. Your existing parsing logic is now here
    const htmlContent = await marked.parse(this.post.content);
    this.postContent = this.sanitizer.bypassSecurityTrustHtml(htmlContent as string);

    // 4. Your listener for the copy buttons is now called *after* rendering is complete
    setTimeout(() => this.addCopyButtonListeners(), 0);
  }

  // All of your other functions remain completely unchanged.
  private addArticleSchema(): void {
    if (!this.post || !this.isBrowser) return; // Added safety check
    this.removeArticleSchema();

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': this.post.title,
      'description': this.post.summary,
      'datePublished': this.post.date,
      'author': {
        '@type': 'Person',
        'name': 'Jan Rosell',
        'url': 'https://www.janrosell.com'
      },
    };

    this.structuredDataScript = this.renderer.createElement('script');
    this.structuredDataScript!.type = 'application/ld+json';
    this.structuredDataScript!.text = JSON.stringify(schema);
    this.renderer.appendChild(this.document.head, this.structuredDataScript); // Used injected document
  }

  private removeArticleSchema(): void {
    if (this.structuredDataScript && this.isBrowser) { // Added safety check
      this.renderer.removeChild(this.document.head, this.structuredDataScript); // Used injected document
    }
  }

  private addCopyButtonListeners(): void {
    const copyButtons = this.el.nativeElement.querySelectorAll('.copy-code-button');
    copyButtons.forEach((button: HTMLElement) => {
      this.renderer.listen(button, 'click', () => {
        const code = button.nextElementSibling?.querySelector('code')?.innerText;
        if (code) {
          navigator.clipboard.writeText(code).then(() => {
            button.innerText = 'Copied!';
            setTimeout(() => {
              button.innerText = 'Copy';
            }, 2000);
          });
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.metaService.updateTag({ name: 'description', content: 'Personal portfolio of Jan Rosell, Co-founder & CEO at Express my Health, Software Developer, and Computer Science Engineering student at UPC.' });
    if (this.isBrowser) {
      this.removeArticleSchema();
    }
  }
}