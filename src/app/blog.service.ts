import { Injectable } from '@angular/core';

export interface Post {
  title: string;
  date: string;
  slug: string;
  content: string;
  summary: string;
  readingTime: number;
}

/**
 * THE DEFINITIVE SOLUTION
 * This new helper function reliably removes leading whitespace from a block of text.
 * It works by taking the indentation of the first line of content as the "base"
 * and removing that same amount of space from every subsequent line.
 * This ensures the Markdown parser sees your text with zero indentation,
 * allowing it to correctly identify paragraphs, headings, and lists.
 */
function correctIndentation(text: string): string {
  // Split the text into lines
  const lines = text.split('\n');

  // Remove the very first line if it's empty (due to the opening backtick `)
  if (lines[0].trim() === '') {
    lines.shift();
  }

  if (lines.length === 0) {
    return '';
  }

  // Determine the indentation from the first line of actual content
  const indent = lines[0].match(/^\s*/)?.[0] ?? '';

  if (indent.length > 0) {
    // Remove the same indentation from all lines
    return lines.map(line => line.startsWith(indent) ? line.slice(indent.length) : line).join('\n');
  }

  return text; // Return original text if there's no indentation
}


@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private postsData = [
    {
      title: "Hello, World!",
      date: '2025-10-04',
      slug: 'hello-world',
      summary: " Booting up my new blog. An introduction to my corner of the internet, where I'll be sharing my journey in tech, from the classroom at UPC to the startup grind at Express my Health.",
      content: `
        If you're reading this, you've found your way to my new corner of the internet. Welcome! My name is **Jan Rosell**, and this website is my digital home — a place to document my work, share my ideas, and connect with others who are passionate about building technology with purpose.

        <br />

        For a while now, I've been operating in three parallel worlds. In one, I'm a **Computer Science student** at UPC, diving deep into the theory of complex systems. In another, I'm a **Software Developer** at Lanaccess, applying that knowledge to build robust, real-world products. And in the third, I'm the **Co-founder and CEO** of Express My Health, a startup driven by a mission to solve communication barriers in the health world.
        
        <br />

        This website is my attempt to unify those worlds. It's more than just a portfolio; it's a reflection of my core philosophy:

        > **Building solutions, not just software.**
        
        <br />

        You'll notice the site has two distinct sides. The [**homepage**](https://janrosell.com/) is the clean, professional front door. It’s the summary of my skills and experience, designed to give you a clear picture of what I do.
        
        <br />

        But if you're like me, you're probably more curious about *how* things work. That's why I built the interactive [**terminal**](https://janrosell.com/terminal). It’s the workshop behind the showroom. It’s a playful, more detailed space where you can dig deeper, run a few commands, and get a feel for my personality beyond a formal CV. It represents the hands-on, problem-solving drive that sits at the heart of everything I build.
        
        <br />

        This blog is the next step on that journey. Here, I plan to share what I'm learning as I navigate the intersection of academia, corporate tech, and the startup grind. You can expect to see:

        &nbsp; -   **Technical Deep Dives:** Exploring challenges I'm solving at Express my Health and Lanaccess.

        &nbsp; -   **Startup Stories:** The unfiltered reality of building a company from the ground up while still in university.
        
        &nbsp; -   **Productivity & Growth:** How I manage my time, what I'm reading, and the lessons I'm learning along the way.

        <br />

        My goal is to create a space for **fellow builders, curious students, and aspiring founders. A place to share the journey, learn from each other, and navigate the exciting chaos of building new things.**

        <br />

        So, have a look around. Explore the homepage, play with the terminal, and feel free to reach out.

        <br />

        Let's build something great.

        <br />

        — Jan`
    },
  ];

  private posts: Post[] = [];

  constructor() {
    this.posts = this.postsData.map(post => {
      // The new, correct function is applied here.
      const content = correctIndentation(post.content);

      const wordsPerMinute = 200;
      // Note: we calculate reading time on the corrected content.
      const text = content.replace(/<[^>]*>/g, '');
      const wordCount = text.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / wordsPerMinute);

      return { ...post, content, readingTime };
    });
  }

  getPosts(): Post[] {
    return this.posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getPostBySlug(slug: string): Post | undefined {
    return this.posts.find(p => p.slug === slug);
  }
}