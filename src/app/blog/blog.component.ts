import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogService, Post } from '../blog.service';
import { Title, Meta } from '@angular/platform-browser';
import { PageNavComponent } from '../page-nav/page-nav.component'; // Import

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, PageNavComponent], // Add PageNavComponent
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {
  posts: Post[] = [];

  constructor(
    private blogService: BlogService,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.posts = this.blogService.getPosts();
    this.titleService.setTitle('The Journal - Jan Rosell');
    this.metaService.updateTag({
      name: 'description',
      content: 'The Prompt: A collection of articles and thoughts by Jan Rosell on software development, technology, and career.'
    });
  }
  
  _currentYear(): number {
    return new Date().getFullYear();
  }
}