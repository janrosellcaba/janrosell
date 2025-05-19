import { Component, OnInit, OnDestroy, AfterViewInit, Renderer2, Inject, HostListener, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, CommonModule, isPlatformBrowser } from '@angular/common'; // Importat CommonModule
import { Router, RouterOutlet } from '@angular/router';
import { AnalyticsService } from './analytics.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
    constructor(private analyticsService: AnalyticsService) {}
}