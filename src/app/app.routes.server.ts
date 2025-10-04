import { RenderMode, ServerRoute } from '@angular/ssr';
import { inject } from '@angular/core';
import { BlogService } from './blog.service';

export const serverRoutes: ServerRoute[] = [
  // Prerender all static routes
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'terminal', renderMode: RenderMode.Prerender },
  { path: 'blog', renderMode: RenderMode.Prerender },
  { path: '404', renderMode: RenderMode.Prerender },

  // Handle the dynamic blog post routes
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const blogService = inject(BlogService);
      const posts = blogService.getPosts();
      
      return posts.map(post => ({ slug: post.slug }));
    }
  },

  // --- THE FINAL FIX ---
  // Add the missing `renderMode` property to the wildcard route.
  { path: '**', renderMode: RenderMode.Server }
];