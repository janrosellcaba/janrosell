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

        You'll notice the site has two distinct sides. The [**homepage**](https://janrosell.com/) is the clean, professional front door. It's the summary of my skills and experience, designed to give you a clear picture of what I do.
        
        <br />

        But if you're like me, you're probably more curious about *how* things work. That's why I built the interactive [**terminal**](https://janrosell.com/terminal). It's the workshop behind the showroom. It's a playful, more detailed space where you can dig deeper, run a few commands, and get a feel for my personality beyond a formal CV. It represents the hands-on, problem-solving drive that sits at the heart of everything I build.
        
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
    {
      title: "Optimism and hard work as a strategy",
      date: '2025-11-02',
      slug: 'optimism-and-hard-work',
      summary: "My secret to handling stress: stay positive and never give up.",
      content: `
        People often ask me how I manage to juggle a Computer Science degree, a job at Lanaccess, and the intensity of building Express My Health as a CEO—all while keeping a smile on my face.

        <br />

        The truth is, problems are a constant. Whether it's a segmentation fault in C++, a server going down, or a difficult exam week, obstacles are guaranteed. You can't control the chaos, but you can control your reaction to it.

        **For me, optimism isn't just a mood. It's a strategy.**

        <br />

        If you approach a bug or a business hurdle thinking it's going to be a disaster, it probably will be. But if you approach it with the absolute confidence that you will figure it out, the solution usually follows. I believe a lot in myself, not because I know everything, but because I know I have the resilience to learn whatever I'm missing.

        <br />

        I keep two quotes in the back of my mind constantly.

        &nbsp; -   The first is from Steve Jobs: **_"Make a dent in the universe."_** This is the fuel. It's why I'm not just writing code, but trying to build solutions that actually help people communicate. It reminds me that the work has a purpose larger than just passing a class or closing a ticket.

        &nbsp; -   The second is a bit tougher: **_"Don't stop when you are tired, stop when you are done."_** This is the discipline. Optimism doesn't mean things are easy; it means you have the energy to push through the hard parts. There are nights when I am exhausted, but I know the mission isn't finished.

        <br />

        So, that's my "secret." I work hard, I confront problems head-on, and I do it with a smile. Because if you're going to try to change the world, you might as well enjoy the ride.

        <br />
        
        Let's get back to work.

        <br />

        — Jan`
    },
    {
      title: "Why the best coder doesn't always win",
      date: '2025-11-20',
      slug: 'code-is-not-enough',
      summary: "The person who knows how to sell themselves will always beat the genius who can't. Code is not enough.",
      content: `
        I spend a lot of my life looking at screens. I love the technical side of things—diving into code, figuring out complex architectures, and optimizing databases. I am an engineer at heart.

        <br />

        But I've realized something that schools don't usually teach us: **Being the best coder in the room doesn't matter if you can't sell yourself.**

        <br />

        We tend to think that if we write perfect code, success will just happen. But that's not true. I believe that a good developer with great soft skills will always beat a genius developer who can't communicate.

        Why? Because the person who can tell a story, who can connect with others, and who can sell their ideas is the one who actually gets the opportunities.

        <br />

        **The real differentiator isn't how well you talk to the machine. It's how well you talk to the people.**

        <br />

        Building *Express My Health* has taught me this. You can have the best technology in the world, but if you can't communicate the vision to your team, listen to your users, or handle a tough meeting with a smile, the technology doesn't matter.

        Hard skills are linear. You study, you practice, you get better.
        **Soft skills are exponential. They are the multiplier.**

        <br />

        If you can code *and* you can understand people, you become unstoppable. So, don't just focus on the syntax. Focus on how you present yourself to the world. That is how you win.

        <br />

        — Jan`
    },
    {
      title: "Slowing down to speed up",
      date: '2025-12-08',
      slug: 'slowing-down-to-speed-up',
      summary: "Why slowing down is the only way to speed up. True discipline isn't just about the grind, but knowing when to recharge.",
      content: `
        I am not the kind of person who likes to stop. If you know me, you know I'm obsessed with progress. I love the grind, I love building, and I honestly enjoy working my ass off to make things happen.
            
        <br />
            
        But recently, I learned a lesson the hard way.
            
        For a few weeks, I was pushing the limits. I was pulling 12-hour days, jumping between university exams, shipping features at Lanaccess, and running the strategy for Express My Health. I felt unstoppable. Until I wasn't. The next morning, I woke up completely drained and feeling sick. My body just forced me to reboot.
            
        <br />
            
        **That is when I realized I was getting the definition of "discipline" wrong.**
            
        <br />
            
        We usually think discipline means never stopping. We think it means caffeine, late nights, and zero breaks. But that's not discipline—that's just bad management.
            
        If you want to operate at a high level, you have to be strategic. You have to combine the hard work with smart recovery. It's like Formula 1: you drive the car at maximum speed, but you *must* take the pitstop. If you skip the pitstop, you don't win the race; you crash the car.
            
        <br />
            
        My new philosophy is simple: **Stop the least amount possible, but when you do stop, make it count.**
            
        <br />
            
        You have to be disciplined enough to work when you don't feel like it, but also disciplined enough to rest when you *need* it. It is about longevity. I want to be building great things for the next 40 years, not just the next 4 weeks.
            
        So, with the holidays coming up, I am going to take my own advice. I'm going to use this time to fully disconnect and recharge the battery. Not because I'm lazy, but because I want to come back in January with enough energy to crush every single goal I have set.
            
        <br />
            
        I wish you all a Merry Christmas, happy holidays, and a great New Year. Enjoy the time off with your people.

        <br />
            
        Let's get ready to work harder than ever in 2026.

        <br />
            
        — Jan`
    }
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