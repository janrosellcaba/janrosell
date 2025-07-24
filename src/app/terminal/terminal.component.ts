import { Component, ViewChild, ElementRef, AfterViewInit, HostListener, OnInit, OnDestroy, Renderer2, Inject, DOCUMENT, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // RouterLink ja estava a la teva plantilla, l'afegeixo als imports per si de cas
import { Subscription } from 'rxjs'; // Encara que no s'utilitza ara, és bona pràctica tenir-la si hi ha subscripcions
import { Meta, Title } from '@angular/platform-browser';

// Tipus per a la sortida de les funcions de comanda
type CommandFunctionResult = { type: 'link'; url: string; text: string } | void | string;
// Tipus per a les funcions de comanda
type CommandHandlerFunction = (args?: string) => CommandFunctionResult; // Modificat per acceptar args opcionals

interface CommandOutput {
  id: number;
  input: string;
  output?: string;
  isHelpIntro?: boolean;
  isLink?: boolean;
  linkUrl?: string;
  linkText?: string;
  isHelpCommands?: boolean;
  showPrompt?: boolean;
}

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule], // Afegit RouterLink
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss']
})
export class TerminalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('commandsContainer') private commandsContainer!: ElementRef;
  @ViewChild('commandInputRef') private commandInputRef!: ElementRef<HTMLInputElement>;

  private availableCommands: Map<string, string | CommandHandlerFunction>;

  commandsDisplay: CommandOutput[] = [];
  commandInput: string = '';
  terminalTitle: string = 'Terminal - jan@portfolio';
  promptUser: string = 'user@janrosell.dev:~';
  promptSymbol: string = '$';

  navCtrl_home_ariaLabel = "Go to Home page";
  navCtrl_themeToggle_ariaLabel = "Change theme";
  private isBrowser: boolean; // Declara la propietat

  currentTheme: 'light' | 'dark' = 'light';
  private prefersDarkSchemeListener: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null = null;
  // private themeSubscription!: Subscription; // No s'està utilitzant actualment

  constructor(
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.availableCommands = new Map<string, string | CommandHandlerFunction>([
      // --- Informació Personal Bàsica ---
      ['name', "Jan Rosell"],
      ['whoami', "A curious Computer Science Engineering student and Software Developer, passionate about technology's role in the world. Always learning, always building."],
      ['contact', () => this.showContactInfo()],
      ['email', (): CommandFunctionResult => ({ type: 'link', url: 'mailto:jan@janrosell.com', text: 'jan@janrosell.com' })],
      ['location', "Barcelona, Catalonia, Spain."],
      ['birthday', "July 29th, 2004."],
      ['languages', "Catalan (Native)\nEnglish (C1)\nSpanish (Native)"],

      // --- Professional i Acadèmic ---
      ['studies', "Currently pursuing a Bachelor's Degree in Computer Science Engineering at FIB, UPC. Specializing in Software Engineering."],
      ['education', () => this.showEducationDetails()], // !!!
      ['job', "CEO at Express My Health & Software Developer at Lanaccess."],
      ['experience', () => this.showExperienceSummary()], // !!!
      ['cv', (): CommandFunctionResult => ({ type: 'link', url: 'src/assets/Jan_Rosell_CV.pdf', text: 'Download CV (PDF)' })], // !!!
      ['resume', "A dedicated developer with experience in full-stack development, project managing, and a keen interest in embedded systems. Quick learner, team player, and problem solver. For more details, type 'cv' or 'experience'."],
      ['linkedin', (): CommandFunctionResult => ({ type: 'link', url: 'https://www.linkedin.com/in/janrosell/', text: 'linkedin.com/in/janrosell' })],
      ['github', (): CommandFunctionResult => ({ type: 'link', url: 'https://github.com/janrosellcaba', text: 'github.com/janrosell03' })],

      // --- Tecnologies i Habilitats ---
      ['skills', () => this.showSkillsList()],
      ['technologies', "My main stack includes: Python, Angular, TypeScript, JavaScript, HTML/CSS, SQL, C/C++, Docker, and Git."],
      ['ide', "Primarily VS Code. Occasionally VIM or Cursor"],
      ['os', "Linux (currently with Fedora and Ubuntu). Proficient with Windows as well."],

      // --- Projectes ---
      ['projects', () => this.showProjectsList()],
      // ['project-portfolio', "This personal website, built with Angular. You're looking at it!"],

      // --- Interessos i Personal ---
      ['hobbies', "Apart from coding: Sports (Tennis, Gym, Boxing), exploring new technologies, and hanging out with friends."],
      ['interests', "Key interests: AI, Cybersecurity, Software Development, and leading impactful projects."],
      ['goals', "Professionally: To contribute to meaningful tech projects. To continuously learn and master new technologies."],
      ['philosophy', "'Code with purpose, design with intent.' Striving for clarity, efficiency, and impact in everything I build."],
      ['quote', () => this.getRandomQuote()],

      // --- Comandes de la Terminal ---
      ['help', () => this.triggerHelpDisplay()],
      ['clear', () => this.clearTerminal()],
      ['date', () => `Current system date: ${new Date().toLocaleString()}`],
      ['time', () => `Current system time: ${new Date().toLocaleTimeString()}`],
      ['pwd', "/home/janrosell/portfolio"],
      ['ls', () => "README.md  projects/  skills.txt  contact.info\n(Just kidding, this is a simulated output!)"],
      ['banner', () => this.showBanner()],
      ['history', () => this.showCommandHistory()],
      ['echo', (args?: string) => args ? args : 'Usage: echo [message]'], // Accepta arguments
      ['exit', () => this.navigateToHome()],
    ]);
  }

  ngOnInit(): void {
    this.titleService.setTitle('Interactive Terminal - Jan Rosell');

    this.metaService.updateTag({
      name: 'description',
      content: 'Explore my skills, experience, and projects through this interactive terminal. A unique feature of Jan Rosell\'s portfolio, built with Angular.'
    });
    this.commandsDisplay.push({ id: Date.now(), input: '', isHelpIntro: true, showPrompt: false });
    if (isPlatformBrowser(this.platformId)) { // Utilitza la dependència injectada
      this.initializeTerminalTheme();
      this.setupPrefersColorSchemeListenerForTerminal();
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) { // Afegeix la comprovació aquí
      this.focusInput();
      this.scrollToBottom();
    }
  }

  initializeTerminalTheme(): void {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let initialTheme: 'light' | 'dark';

    if (storedTheme) {
      initialTheme = storedTheme as 'light' | 'dark';
    } else {
      initialTheme = prefersDark ? 'dark' : 'light';
    }
    this.currentTheme = initialTheme; // Estableix currentTheme per a la icona
    // Aplica el tema al body si és la primera càrrega d'aquesta pàgina
    // i no només per al toggle del botó.
    this.applyThemeToBody(initialTheme);
  }

  applyThemeToBody(theme: 'light' | 'dark'): void {
    if (isPlatformBrowser(this.platformId)) { // Afegeix la comprovació
      this.currentTheme = theme;
      if (theme === 'dark') {
        this.renderer.addClass(this.document.body, 'dark-theme');
      } else {
        this.renderer.removeClass(this.document.body, 'dark-theme');
      }
    }
  }

  toggleTerminalTheme(): void {
    if (isPlatformBrowser(this.platformId)) { // Afegeix la comprovació
      const newTheme = this.document.body.classList.contains('dark-theme') ? 'light' : 'dark';
      this.applyThemeToBody(newTheme);
      localStorage.setItem('theme', newTheme);
    }
  }

  setupPrefersColorSchemeListenerForTerminal(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.prefersDarkSchemeListener = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        this.applyThemeToBody(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', this.prefersDarkSchemeListener);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.commandInputRef && !this.commandInputRef.nativeElement.contains(event.target as Node)) {
      if ((event.target as HTMLElement).tagName?.toLowerCase() !== 'a') {
        // this.focusInput();
      }
    }
  }

  onInput(): void {
    const currentInputText = this.commandInput;
    const पार्ट्स = currentInputText.trim().split(/\s+/); // Divideix per espais (un o més)
    const commandName = पार्ट्स[0].toLowerCase();
    const args = पार्ट्स.slice(1).join(' '); // Reuneix tots els arguments en un string


    if (commandName === '' && currentInputText.trim() === '') { // Només si l'input original estava completament buit o només espais
      this.commandsDisplay.push({
        id: Date.now(),
        input: '',
        showPrompt: true
      });
      this.commandInput = '';
      this.scrollToBottom();
      this.focusInput();
      return;
    }

    const commandEntry: CommandOutput = {
      id: Date.now(),
      input: currentInputText,
      showPrompt: true
    };

    const commandHandler = this.availableCommands.get(commandName);

    if (commandHandler) {
      if (typeof commandHandler === 'function') {
        const result = commandHandler(args); // Passa els arguments
        if (result) {
          if (typeof result === 'string') {
            commandEntry.output = result;
          } else if (result.type === 'link') {
            commandEntry.isLink = true;
            commandEntry.linkUrl = result.url;
            commandEntry.linkText = result.text;
          }
        }
        if (commandName === 'help') {
          commandEntry.isHelpCommands = true;
        }
        if (commandName !== 'clear') {
          this.commandsDisplay.push(commandEntry);
        }
      } else {
        commandEntry.output = commandHandler as string;
        this.commandsDisplay.push(commandEntry);
      }
    } else {
      commandEntry.output = `bash: command not found: ${currentInputText}`;
      this.commandsDisplay.push(commandEntry);
    }

    this.commandInput = '';
    this.scrollToBottom();
    this.focusInput();
  }

  private clearTerminal(): void {
    this.commandsDisplay = [];
    this.commandsDisplay.push({ id: Date.now(), input: '', isHelpIntro: true, showPrompt: false });
  }

  private triggerHelpDisplay(): void {
    return;
  }

  getHelpCommandsList(): string[] {
    return Array.from(this.availableCommands.keys()).sort();
  }

  // --- Funcions Helper per a Comandes (EXPANDIDES) ---

  private showContactInfo(): string {
    return `You can reach me via:
Email:    jan@janrosell.com (or type 'email')
LinkedIn: linkedin.com/in/janrosell (or type 'linkedin')
GitHub:   github.com/janrosellcaba (or type 'github')`;
  }

  private showEducationDetails(): string {
    return `Primary Education:
- B.Sc. Computer Science Engineering - FIB, UPC Barcelona (Expected June 2026)
  Specialization: Software Engineering.
  Key areas: Algorithms, Data Structures, AI, Cybersecurity, Distributed Systems.

Complementary Studies:
- Defense and Security Studies - UPF & other training (Ongoing)
  Focus: Cybersecurity, technology in modern conflicts, geopolitics of tech.`;
  }

  private showExperienceSummary(): string {
    return `Current Role:
- Software Developer at Lanaccess Telecom (Target Feb 2025 - Present)
  Focusing on developing and maintaining impactful software solutions.

For more detailed experience, please see my LinkedIn profile (type 'linkedin') or my CV (type 'cv').`;
  }

  private showSkillsList(): string {
    const mainSkills = [
      "C/C++", "Python", "Java", "SQL", "R",
      "TypeScript", "JavaScript", "HTML/CSS", "Angular", "React", "Vite",
      "UI/UX Design", "Interface Design", "Figma",
      "Git", "Linux", "Docker", "Shell Scripting", "Yocto",
      "REST API Design", "Data Structures", "Algorithms", "UML", "Agile (Scrum)", "Problem Solving"
    ];
    return "Key Skills:\n" + mainSkills.map(skill => `  - ${skill}`).join('\n');
  }

  private showProjectsList(): string {
    const projects = [
      { name: "Personal Portfolio (this website!)", description: "Built with Angular, showcasing my skills and projects. You are here!", linkCmd: "N/A" },
      { name: "Lanaccess Development Projects", description: "Contributing to an important software solution at Lanaccess. (Details are confidential)", linkCmd: "N/A" },
      { name: "University Projects (FIB, UPC)", description: "Various academic projects involving algorithms, data structures, AI, and software engineering principles.", linkCmd: "N/A" },
    ];
    let output = "Featured Projects:\n";
    projects.forEach(p => {
      output += `\n  Project: ${p.name}\n  Description: ${p.description}\n`;
      if (p.linkCmd !== "N/A") {
        output += `  (Type '${p.linkCmd}' for more info/link)\n`;
      }
    });
    return output;
  }

  private getRandomQuote(): string {
    const quotes = [
      "The only way to do great work is to love what you do. - Steve Jobs",
      "Simplicity is the ultimate sophistication. - Leonardo da Vinci",
      "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
      "Strive not to be a success, but rather to be of value. - Albert Einstein",
      "It is not the strongest of the species that survives, nor the most intelligent; it is the one most adaptable to change. - C. Darwin (paraphrased)",
      "Perseverance, secret of all triumphs. - Victor Hugo",
      "The best way to predict the future is to invent it. - Alan Kay"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  private showBanner(): string {
    return `
             ██╗ █████╗ ███╗   ██╗      ██████╗ 
             ██║██╔══██╗████╗  ██║      ██╔══██╗
             ██║███████║██╔██╗ ██║      ██████╔╝
        ██   ██║██╔══██║██║╚██╗██║      ██╔══██╗
        ╚█████╔╝██║  ██║██║ ╚████║      ██║  ██║
         ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝      ╚═╝  ╚═╝

------------------------------------------------------------
     Welcome to Jan Rosell's Interactive Portfolio Terminal
         Type 'help' for a list of available commands.
------------------------------------------------------------
  `;
  }


  private showCommandHistory(): string {
    const userCommands = this.commandsDisplay
      .filter(cmd => cmd.showPrompt && cmd.input.trim() !== '')
      .map(cmd => cmd.input);

    if (userCommands.length === 0) {
      return "No commands in history yet (besides this one!).";
    }
    let historyOutput = "Command History:\n";
    userCommands.forEach((cmdInput, index) => {
      historyOutput += `  ${index + 1}: ${cmdInput}\n`;
    });
    return historyOutput.trim();
  }
  // --- Fi Funcions Helper ---

  private scrollToBottom(): void {
    if (this.isBrowser) { // Comprovació addicional per seguretat
      requestAnimationFrame(() => {
        if (this.commandsContainer) {
          this.commandsContainer.nativeElement.scrollTop = this.commandsContainer.nativeElement.scrollHeight;
        }
      });
    }
  }

  public focusInput(): void {
    if (this.isBrowser) { // Afegeix la comprovació aquí també
      requestAnimationFrame(() => {
        this.commandInputRef?.nativeElement?.focus();
      });
    }
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.prefersDarkSchemeListener) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.removeEventListener('change', this.prefersDarkSchemeListener);
    }
    // Si tinguessis altres subscripcions, les desubscriuries aquí.
    // if (this.themeSubscription) {
    //   this.themeSubscription.unsubscribe();
    // }
  }
}