import { Injectable } from '@angular/core';

export interface Post {
  title: string;
  date: string;
  slug: string;
  content: string; // Content in Markdown format
  summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private posts: Post[] = [
    {
      title: "Why Angular for My Portfolio? A Developer's Choice",
      date: '2025-09-15',
      slug: 'why-angular-for-my-portfolio',
      summary: 'A deep dive into the technical reasons behind choosing Angular for my personal website, focusing on its powerful features for a scalable and maintainable single-page application.',
      content: `
### The Decision Framework
When building a personal portfolio, the choice of frontend framework is more than just a technical decision—it's a statement. It showcases your expertise, your design philosophy, and your approach to software engineering. I considered several options, including React and Vue, but ultimately chose Angular for its robust and opinionated nature.

### 1. Structure and Scalability with TypeScript
Angular's use of TypeScript is a massive advantage. Static typing helps catch errors early in the development process and makes the code more self-documenting. For a project I intend to maintain and expand (like adding this blog!), TypeScript provides the confidence that my codebase will remain clean and scalable.

### 2. A Comprehensive, All-in-One Ecosystem
Angular is a full-fledged platform, not just a library. It comes with a powerful CLI, a built-in router, an HTTP client, and state management solutions. This integrated ecosystem means less time spent configuring third-party libraries and more time focusing on building features. Everything is designed to work together seamlessly.

### 3. Opinionated Architecture for Consistency
The "opinionated" nature of Angular is often debated, but I see it as a strength. It enforces a consistent project structure and coding style, which is invaluable for long-term maintenance. Components, services, and modules have clear roles, making the application easier to understand and refactor.

### 4. Powerful Features for a Modern Web Experience
My portfolio leverages several of Angular's advanced features:
- **Server-Side Rendering (SSR) with Angular Universal:** Crucial for SEO and faster initial load times.
- **Standalone Components:** Simplifying the architecture by reducing the need for NgModules.
- **Reactive Forms and Animations:** Allowing for complex, interactive user experiences like the terminal feature.

### Conclusion
Choosing Angular was a strategic decision. It provided the structure, tooling, and advanced features necessary to build a portfolio that is not only visually appealing but also robust, maintainable, and ready for future expansion. It's a testament to my belief in building things the right way, with purpose and precision.
      `
    }
  ];

  getPosts(): Post[] {
    return this.posts;
  }

  getPostBySlug(slug: string): Post | undefined {
    return this.posts.find(p => p.slug === slug);
  }
}