import { Component, OnInit, OnDestroy, AfterViewInit, Renderer2, Inject, HostListener, PLATFORM_ID, ElementRef } from '@angular/core';
import { DOCUMENT, CommonModule, isPlatformBrowser } from '@angular/common'; // Importat CommonModule
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- Variables de Text ---
  // Nav Controls
  navCtrl_terminal_ariaLabel = "Open Terminal";
  navCtrl_themeToggle_ariaLabel = "Change theme";
  navCtrl_navToggle_ariaLabel = "Navigation menu";

  // Nav Overlay Links
  navLink_home = "Home";
  navLink_aboutMe = "About Me";
  navLink_technologies = "Technologies";
  navLink_experience = "Experience";
  navLink_contact = "Contact";

  // Intro Section
  intro_name_jan = "Jan";
  intro_name_rosell = "Rosell";
  intro_subtitle_highlight1 = "Software Developer";
  intro_subtitle_at = "at";
  intro_subtitle_company1 = "Lanaccess";
  intro_subtitle_and = "&";
  intro_subtitle_highlight2 = "Computer Science Engineering Student";
  intro_subtitle_institution1 = "FIB, UPC";
  intro_subtitle_comment = "Exploring modern computing to deliver thoughtful software solutions with purpose and precision.";

  // About Me Section
  aboutMe_heading = "About Jan";

  aboutMe_paragraph1_part1 = "Computer Science Engineering student at";
  aboutMe_paragraph1_institution = "FIB (UPC)";
  aboutMe_paragraph1_part2 = "and";
  aboutMe_paragraph1_role = "Software Developer";
  aboutMe_paragraph1_company = "Lanaccess";
  aboutMe_paragraph1_part3 = ", focused on building robust, well-designed software systems. Driven by curiosity, with a particular interest in understanding complex systems and solving challenging problems.";

  aboutMe_paragraph2_part1 = "A growing interest in";
  aboutMe_paragraph2_field = "Project Management";
  aboutMe_paragraph2_part2 = "provides a complementary perspective to technical training, especially in aligning technology with strategic outcomes and efficient collaboration.";

  aboutMe_formenteraMention = "Born and based in Barcelona, with three years spent living in Ireland, bringing a mindset shaped by engineering rigor and a hands-on drive to craft meaningful, lasting solutions.";


  // Technologies Section
  tech_mainTitle = "Technologies";
  tech_subtitle = "The tools and languages I use to build and innovate in the digital world.";
  tech_category1_title = "Backend & Data";
  tech_category1_skills = [
    "C, C++",
    "Python",
    "Java",
    "R",
    "SQL (PostgreSQL, Oracle)",
    "RESTful API Design",
    "Data Structures & Algorithms",
    "UML"
  ];

  tech_category2_title = "Frontend & UI/UX";
  tech_category2_skills = [
    "HTML5, CSS3, SCSS",
    "TypeScript",
    "JavaScript",
    "React.js",
    "Angular",
    "Vite",
    "UI/UX Design Principles",
    "Figma",
    "Interface Design"
  ];

  tech_category3_title = "DevOps & Tools";
  tech_category3_skills = [
    "Git, GitHub, GitLab",
    "Linux & Shell Scripting",
    "Docker",
    "Yocto",
    "Agile Methodologies (Scrum)",
    "Analytical Problem-Solving",
    "English (C1), Catalan & Spanish (Native)",
  ];

  // Experience & Education Section
  expEdu_title = "Experience_&_Education";
  expEdu_items = [
    {
      id: 1,
      title: "Software Developer",
      organization: "Lanaccess Telecom",
      date: "Feb 2025 - Present",
      detailsType: "list",
      details: [
        "Design and develop low-code software applications to optimize business processes.",
        "Gather and analyze client requirements to create effective technical solutions.",
        "Work collaboratively in Agile teams to deliver high-quality software iteratively.",
        "Maintain and improve existing applications ensuring scalability and reliability."
      ],
      transitionDelay: "0s"
    },
    {
      id: 2,
      title: "Computer Science Student",
      organization: "FIB, UPC Barcelona",
      date: "Sep 2022 - Est. June 2026",
      detailsType: "list",
      details: [
        "Specializing in Software Engineering with courses in AI, cybersecurity, and distributed systems.",
        "Strong foundation in data structures, algorithms, and software development best practices.",
        "Participated in academic projects involving design and implementation of complex systems.",
        "Continually expanding technical knowledge and practical skills through coursework and self-study."
      ],
      transitionDelay: "0.1s"
    },
    {
      id: 3,
      title: "UNICAT Ambassador",
      organization: "EU Careers",
      date: "Feb 2024 - Jun 2025",
      detailsType: "list",
      details: [
        "Promote awareness of EU career opportunities among students and recent graduates.",
        "Conduct research on cybersecurity trends and technological innovation in Europe.",
        "Organize and participate in events related to technology and security policy.",
        "Facilitate communication between students and EU institutions."
      ],
      transitionDelay: "0.2s"
    },
    {
      id: 4,
      title: "Technical Support Scholar",
      organization: "UPC Alumni",
      date: "Feb 2024 - Feb 2025",
      detailsType: "list",
      details: [
        "Provide technical support for alumni projects and initiatives.",
        "Analyze cybersecurity challenges and their implications for modern technology.",
        "Collaborate with teams to improve support workflows and user experience.",
        "Contribute to reports and presentations on technology trends in security."
      ],
      transitionDelay: "0.3s"
    }
  ];

  // Contact Section
  contact_heading_line1 = "Interested?";
  contact_heading_line2 = "Let's_Connect";
  contact_subheading = "Always open to discussing new ideas, challenging projects, or collaboration opportunities.";
  contact_email = "jan@janrosell.com";
  contact_social_github = "GitHub";
  contact_social_linkedin = "LinkedIn";
  contact_social_github_url = "https://github.com/janrosellcaba";
  contact_social_linkedin_url = "https://www.linkedin.com/in/janrosell/";

  // Footer
  footer_text_part1 = "Jan Rosell. Code with purpose, design with intent.";
  // currentYear ja està definit

  // --- Fi Variables de Text ---


  currentYear = new Date().getFullYear();
  currentTheme: 'light' | 'dark' = 'light';
  isNavOverlayOpen = false;

  private observer!: IntersectionObserver;
  private animatedElements!: NodeListOf<Element>;
  private prefersDarkSchemeListener: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null = null;
  private isBrowser: boolean;

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private elRef: ElementRef,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId); // Comprovació si estem al navegador
  }

  ngOnInit(): void {
    if (this.isBrowser) { // Només executa lògica de client al navegador
      this.initializeTheme();
      this.setupPrefersColorSchemeListener();
    }
  }

  // ngAfterViewInit(): void {
  //   if (this.isBrowser) {
  //     this.initializeScrollAnimations();
  //     // Assegurem que s'actualitza després que el tema inicial s'apliqui
  //     this.updateHighlightBackgroundColorRGB();
  //   }
  // }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // En comptes de cridar directament:
      // this.initializeScrollAnimations();

      // Prova amb un petit retard per assegurar que el DOM està completament llest.
      // Això és un "hack", però pot ajudar a diagnosticar si és un problema de timing.
      setTimeout(() => {
        this.initializeScrollAnimations();
        // this.updateHighlightBackgroundColorRGB(); // També pots moure aquesta aquí si sospites d'ella
      }, 100); // Prova amb 100ms, o fins i tot una mica més per a la prova
    }
  }

  navigateToTerminal(): void {
    this.router.navigate(['/terminal']);
    if (this.isNavOverlayOpen) {
      this.closeNav();
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    // Crida DESPRÉS d'aplicar la classe del tema
    // this.updateHighlightBackgroundColorRGB();
  }

  toggleTheme(): void {
    const newTheme = this.document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    this.applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }



  setupPrefersColorSchemeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.prefersDarkSchemeListener = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', this.prefersDarkSchemeListener);
  }

  toggleNav(): void {
    this.isNavOverlayOpen = !this.isNavOverlayOpen;
  }

  closeNav(): void {
    this.isNavOverlayOpen = false;
  }

  onNavOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('nav-overlay')) {
      this.closeNav();
    }
  }

  initializeScrollAnimations(): void {
    // Selecciona tots els elements amb .reveal-on-scroll dins d'aquest component
    // Si aquesta funció està a HomeComponent, és millor acotar la cerca a aquest component.
    const elementsToAnimate = this.elRef.nativeElement.querySelectorAll('.reveal-on-scroll');

    if (elementsToAnimate.length === 0) {
      console.warn('HomeComponent: No elements found with .reveal-on-scroll');
      return;
    }

    const observerOptions = {
      root: null, // Observa la intersecció amb el viewport
      rootMargin: '0px',
      threshold: 0.1, // Un 10% de l'element ha de ser visible
      // Pots ajustar aquest valor. Un valor més petit fa que s'activi abans.
      // Per a les targetes, un 0.1 o 0.2 pot estar bé.
    };

    this.observer = new IntersectionObserver((entries, observerInstance) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderer.addClass(entry.target, 'is-visible');
          observerInstance.unobserve(entry.target); // Deixa d'observar un cop animat
        }
      });
    }, observerOptions);

    elementsToAnimate.forEach((el: Element) => this.observer.observe(el));
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.observer) {
        this.observer.disconnect();
      }
      if (this.prefersDarkSchemeListener) {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.prefersDarkSchemeListener);
      }
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (this.isNavOverlayOpen) {
      this.closeNav();
    }
  }
}