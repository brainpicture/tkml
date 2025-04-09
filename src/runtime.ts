import { BaseComponent, Component } from "./components";
import { TKML, TKMLOptions } from "./index";
import { Parser } from "./parser";
import { isServer, isBrowser, safeDOM, safeWindow } from './util';

// Runtime class to handle all TKML actions
export class Runtime {
    private instanceId: number;
    private static counter = 0;
    private tkmlInstance: TKML;
    private cache: Map<string, string> = new Map();
    //currentHost: string = '';
    public currentUrl: string = '';
    private initialUrl: string | null = null;
    private static highlightJsLoaded = false;
    private static loadingPromise: Promise<void> | null = null;
    private observers: Map<string, IntersectionObserver> = new Map();
    private footerState: Map<string, { lastScrollY: number, direction: 'up' | 'down' }> = new Map();
    private aborted: boolean = false;
    private URLControl: boolean = false;
    public options: TKMLOptions;
    public isServer: boolean;
    public isBrowser: boolean;
    public onServerLoad: string[] = [];
    private beforeRender: (() => void)[] = [];
    public pluginUrls: string[] = [];
    public menuLeft: HTMLElement | null = null;
    public menuRight: HTMLElement | null = null;
    public menuOverlay: HTMLElement | null = null;
    private leftMenuContentUrl: string | null = null;
    public leftMenuTriggerId: string | null = null;
    public leftMenuOpened: boolean = false;
    private handleResizeBound: (() => void) | null = null;
    private loadedMenuContentUrl: string | null = null;
    private highlightJsInitialized: boolean = false;
    private initializedFunctions: Set<string> = new Set();

    constructor(tkmlInstance: TKML, options: TKMLOptions = {}) {
        this.instanceId = options.instanceId || ++Runtime.counter;
        this.tkmlInstance = tkmlInstance;
        this.options = options;
        this.isServer = options.isServer || isServer;
        this.isBrowser = isBrowser;

        // Добавляем обработчик навигации по истории только в браузере
        if (this.isBrowser) {
            safeDOM.addEventListener(window, 'popstate', (event) => {
                let path;
                if (this.options.URLControl) {
                    path = safeWindow.location.pathname;
                } else {
                    path = safeWindow.location.hash.slice(1);
                }

                const fullUrl = this.getFullUrl(path)
                if (this.hasCache(fullUrl)) {
                    this.popCache(fullUrl);
                } else {
                    this.load(path, false);
                }
            });
        }

        // Add resize event handler for page updates if not already added
        if (this.isBrowser) {
            window.addEventListener('resize', () => this.onPageUpdate());

            // Add scroll event handler only for the scrolled-to-bottom class
            window.addEventListener('scroll', () => {
                this.updateFooterScrollState();
            });
        }

        // Add scroll event handler for footer updates
        /*if (this.isBrowser) {
            window.addEventListener('scroll', () => {
                this.updateFooterPosition();
            });
        }*/
    }

    private hasCache(url: string): boolean {
        return this.cache.has(url);
    }

    private getCache(url: string): string | undefined {
        return this.cache.get(url);
    }

    public setCache(url: string, content: string) {
        this.cache.set(url, content);
    }

    private resetState(): void {
        this.aborted = false;
    }

    private abort(): Runtime {
        this.aborted = true;
        return this;
    }

    public setCacheForCurrentUrl(content: string) {
        let url = this.getLocation();
        let fullUrl = this.getFullUrl(url);
        this.setCache(fullUrl, content);
    }

    public go(url: string, noCache: boolean = false, target?: string, rootElement?: Component): void {
        if (this.aborted) {
            this.resetState();
            return;
        }
        url = decodeURIComponent(url);
        if (target) {
            noCache = true;
        }
        url = this.fixUrl(url)
        this.load(url, true, undefined, noCache, target, rootElement);
    }

    public post(url: string | null, params: Record<string, string>, target?: string) {
        if (url) {
            url = decodeURIComponent(url);
            url = this.fixUrl(url)
        }
        this.load(url, true, params, undefined, target);
    }

    private formatUrl(url: string): string {
        url = url.replace(/^https?:\/\//, '//');
        return url;
    }

    private popCache(url: string, target?: string, rootElement?: Component | string) {
        const content = this.getCache(url)!;
        let parser: Parser;

        this.onServerLoad = []; // clear onload
        if (rootElement && typeof rootElement === 'string') {
            let rootDomEl = document.getElementById(rootElement);
            parser = new Parser(rootDomEl, this, target);
        } else { // for a load more feature – loads instead of component
            parser = new Parser(target && this.isBrowser ? document.getElementById(target)! : this.tkmlInstance.root, this, target, rootElement ? rootElement as Component : undefined);
        }


        parser.add(content);

        this.beforeRender.forEach(fn => fn());

        parser.finish();
    }

    // fix url will add subpath from current location or host and path if needed, but this url will
    // be still relative, getFullUrl is needed to use to get full url
    public fixUrl(url: string): string {
        let currentHost = ''
        if (url.match(/^https?:\/\//)) {
            return url.replace(/^https?:\/\//, '//');
        }

        // Если URL абсолютный - обрабатываем как раньше
        if (url.startsWith('//')) {
            return url
        }

        let baseHost = ''//currentHost || (this.isBrowser ? window.location.origin : '');

        // currentUrl us previously loaded url, wich we can step from
        let currentPath = this.currentUrl;
        if (currentPath.startsWith('//')) {
            const hostMatch = currentPath.match(/^\/\/[^\/?]+/);
            if (hostMatch) {
                baseHost = hostMatch[0];
            }
        }


        // If url starts from  / its probably from root no url adjustment needed
        if (url.startsWith('/')) {
            return baseHost + url;
        }


        if (currentPath) {
            // Check if currentPath ends with .tkml, ignoring any query parameters
            currentPath = currentPath.split('?')[0];
            const lastSlashIndex = currentPath.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
                let basePath = currentPath.substring(0, lastSlashIndex + 1);
                return basePath + url;
            }
        }

        return '/' + url;
    }

    public getFullUrl(url: string): string {
        // this url is already fixed
        if (url.startsWith('//')) {
            if (url.startsWith('//localhost')) {
                return 'http:' + url;
            }
            return 'https:' + url;
        }
        if (!url.startsWith('/')) {
            url = '/' + url
        }
        const baseHost = this.isBrowser ? window.location.origin : ''
        return baseHost + url;
    }

    public pageChanged(url: string, fullUrl: string, target?: string) {
        //let historyUrl = (!this.currentHost || this.currentHost == window.location.origin) ? url : fullUrl;
        let historyUrl = url
        if (historyUrl.match(/^https?:\/\//)) {
            historyUrl = historyUrl.replace(/^https?:\/\//, '//');
        }
        if (this.options.URLControl) {
            window.history.pushState({ url: fullUrl }, '', historyUrl);
        } else {
            // Обновляем hash с форматированным URL без кодирования
            const formattedUrl = this.formatUrl(url);
            window.history.pushState({ url: fullUrl }, '', '#' + historyUrl);
        }

        if (this.currentUrl != url) {
            if (!target && this.isBrowser) {
                window.scrollTo({ top: 0 });
                // Close menu only on narrow screens during page change
                if (this.leftMenuContentUrl) {
                    if (!this.isWideScreen()) {
                        this.closeMenu();
                    }
                }
            }
        }
        console.log('this.leftMenuTriggerId', this.leftMenuTriggerId)
        if (!this.leftMenuTriggerId) {
            console.log('close Menu here')
            this.closeMenu();
            this.leftMenuContentUrl = null;
        }
        this.currentUrl = url // now update current url

        this.updateFooterPosition();
    }

    // rootElement can be a component (which should be replaced with content) or a string (dom id of element which would be updated with the result)
    public load(url: string | null, updateHistory: boolean = false, postData?: Record<string, any>, noCache?: boolean, target?: string, rootElement?: Component | string, callback?: () => void) {
        // В серверном окружении просто возвращаем
        if (this.isServer) return;

        // Store initial URL on first load
        if (!this.initialUrl) {
            this.initialUrl = url;
        }

        let fullUrl;
        if (url === null) {
            url = this.currentUrl;
            fullUrl = url
        } else {
            fullUrl = this.getFullUrl(url)
        }

        if (updateHistory && !rootElement) {
            this.leftMenuTriggerId = null;
        }


        // Check cache first
        if (!postData && !noCache && this.hasCache(fullUrl)) {
            this.popCache(fullUrl, target, rootElement);
            if (updateHistory && !rootElement) {
                this.pageChanged(url, fullUrl, target);
            }
            callback && callback();
            return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open(postData ? 'POST' : 'GET', fullUrl, true);
        xhr.setRequestHeader('Accept', 'application/tkml');
        let processedLength = 0;

        if (postData) {
            xhr.setRequestHeader('Content-Type', 'application/json');
        }

        // rootElement is needed for a loader component
        // load more feature
        let parser: Parser;
        this.onServerLoad = []; // clear onload
        // for menu – allow to render content in a custom element
        if (typeof rootElement === 'string') {
            let rootDomEl = document.getElementById(rootElement);
            parser = new Parser(rootDomEl, this, target);
        } else { // for a load more feature – loads instead of component
            parser = new Parser(this.tkmlInstance.root, this, target, rootElement);
        }

        xhr.onprogress = () => {
            parser.add(xhr.responseText.substring(processedLength));
            processedLength = xhr.responseText.length;
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                this.beforeRender.forEach(fn => fn());
                parser.finish();
                if (!postData) {
                    this.setCache(fullUrl, xhr.responseText);
                }
                if (callback) {
                    callback();
                }

                if (updateHistory && !rootElement) {
                    this.pageChanged(url, fullUrl, target);
                }

                // Call the page update method after loading
                setTimeout(() => this.onPageUpdate(), 0);
            } else {
                parser.failed(new Error(`Failed to load URL: ${fullUrl}`));
            }
        };

        xhr.onerror = () => {
            parser.failed(new Error(`Network error while loading URL: ${fullUrl}`));
        };

        if (postData) {
            xhr.send(JSON.stringify(postData));
        } else {
            xhr.send();
        }
    }

    public getLocation(): string {
        if (this.isBrowser) {
            if (this.options.URLControl) {
                return window.location.pathname;
            } else {
                return window.location.hash.slice(1);
            }
        }
        return '';
    }

    public fromText(text: string): string {
        this.onServerLoad = []; // clear onload
        const parser = new Parser(this.tkmlInstance.root, this);
        parser.add(text);
        return parser.finish() || '';
    }

    public loader(element: HTMLElement): Runtime {
        if (this.aborted) return this;
        element.classList.add('loading');
        this.beforeRender.push(() => {
            element.classList.remove('loading');
        });

        return this;
    }

    public getId(): number {
        return this.instanceId;
    }

    public preload(url: string) {
        if (this.isServer) return this;
        url = decodeURIComponent(url);
        url = this.fixUrl(url)
        // Handle relative URLs
        let fullUrl = this.getFullUrl(url)

        if (this.hasCache(fullUrl)) return this;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', fullUrl, true);
        xhr.setRequestHeader('Accept', 'application/tkml');

        xhr.onload = () => {
            if (xhr.status === 200) {
                this.setCache(fullUrl, xhr.responseText);
            }
        };

        xhr.send();
        return this;
    }

    public loadHighlightJs(): Promise<void> {
        // Устанавливаем флаг, что инициализация была запрошена
        this.highlightJsInitialized = true;

        if (this.isServer) return Promise.resolve();
        if (Runtime.loadingPromise) return Runtime.loadingPromise;

        Runtime.loadingPromise = new Promise((resolve) => {
            if (Runtime.highlightJsLoaded) {
                resolve();
                return;
            }

            // Load CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
            document.head.appendChild(link);

            // Load JS
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
            script.onload = () => {
                Runtime.highlightJsLoaded = true;
                resolve();
            };
            document.head.appendChild(script);
        });

        return Runtime.loadingPromise;
    }

    public observeLoader(component: Component, url: string) {
        if (this.isServer) return;
        if (!component.id) return;
        const element = document.getElementById(component.id);
        if (!element) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Отключаем observer после первого срабатывания
                    observer.disconnect();
                    this.observers.delete(element.id);

                    // Загружаем контент
                    element.classList.add('loading');
                    //this.go(url, true, undefined, component);
                    url = decodeURIComponent(url);
                    url = this.fixUrl(url)
                    this.load(url, false, undefined, true, undefined, component);
                }
            });
        }, {
            rootMargin: '100px'
        });

        this.observers.set(element.id, observer);
        observer.observe(element);
    }

    // Очистка observers при необходимости
    public cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }

    public observeFooter(footerId: string, autohide: boolean = false): void {
        if (this.isServer) return;
        const footer = document.getElementById(footerId);
        if (!footer) return;
        if (footer.parentElement?.id !== 'cont-' + this.getId()) return;

        let lastScrollY = window.scrollY;
        let ticking = false;
        let currentDirection: 'up' | 'down' = 'up';

        const updateFooter = () => {
            const currentScrollY = window.scrollY;
            const newDirection = currentScrollY > lastScrollY ? 'down' : 'up';

            // Проверяем, достигли ли конца страницы
            const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;

            if (isAtBottom) {
                // Если достигли конца - показываем футер
                footer.classList.remove('hidden');
                footer.classList.add('down');
            } else {
                footer.classList.remove('down');
                if (newDirection !== currentDirection) {
                    // Иначе обрабатываем направление скролла
                    currentDirection = newDirection;
                    if (currentDirection === 'down') {
                        footer.classList.add('hidden');
                    } else {
                        footer.classList.remove('hidden');
                    }
                }
            }

            lastScrollY = currentScrollY;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (autohide) {
                if (!ticking) {
                    window.requestAnimationFrame(updateFooter);
                    ticking = true;
                }
            }
            //this.updateFooterPosition();
            this.updateFooterScrollState();
        });

        if (autohide) {
            // Инициализируем начальное состояние
            updateFooter();
            this.footerState.set(footerId, { lastScrollY, direction: 'down' });
        }
    }

    public observeHeader(headerId: string): void {
        if (this.isServer) return;
        const header = document.getElementById(headerId);
        if (!header) return;
        if (header.parentElement?.id !== 'cont-' + this.getId()) return;

        let ticking = false;
        const updateHeader = () => {
            const scrollY = window.scrollY;
            if (scrollY > 0) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateHeader);
                ticking = true;
            }
        });

        // Инициализируем начальное состояние
        updateHeader();
    }

    public validateFields(fields: string): Runtime {
        if (this.aborted || this.isServer) return this;

        const fieldList = fields.split(',').map(f => f.trim());
        let firstError: HTMLElement | null = null;

        fieldList.forEach(field => {
            const input = document.querySelector(`[name='${field}']`) as HTMLInputElement | null;
            if (input && !input.value.trim()) {
                input.classList.add('error');
                if (!firstError) firstError = input as HTMLElement;

                const removeError = () => {
                    input.classList.remove('error');
                    input.removeEventListener('input', removeError);
                    input.removeEventListener('focus', removeError);
                };

                input.addEventListener('input', removeError);
                input.addEventListener('focus', removeError);
            }
        });

        if (firstError) {
            (firstError as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.abort();
        }

        return this;
    }

    compile(tkml: string): string {
        this.onServerLoad = [`tkmlr(${this.instanceId}).onPageUpdate();`]; // clear onload
        const parser = new Parser(null, this);
        parser.add(tkml);
        let content = parser.finish() || '';

        return `<div id="container-${this.instanceId}" class="tkml-cont">
<div class="menu menu-left" id="menu-left-${this.instanceId}"></div>
<div class="menu menu-right" id="menu-right-${this.instanceId}"></div>
<div class="menu-overlay" id="menu-overlay-${this.instanceId}"></div>
<div id="cont-${this.instanceId}">${content}</div>
</div>`
    }

    // Add a new universal method for page updates
    public onPageUpdate(): void {
        if (this.isServer) return;

        // Update footer position based on scroll presence
        this.updateFooterPosition();

        // Handle menu state and content after page update
        if (this.menuLeft && this.menuOverlay) {
            const isWideScreen = this.isWideScreen();
            // Determine if the menu should be visible based on state or screen width

            // --- Step 1: Ensure Correct Open/Closed State ---
            if (isWideScreen) {
                // Ensure menu is open if it should be (based on having an initialized trigger)
                if (this.leftMenuTriggerId && !this.leftMenuOpened) {
                    // Use toggleMenu to handle opening. It will also handle the initial load
                    // and update loadedMenuContentUrl via its callback.
                    console.log("onPageUpdate: Re-opening menu on wide screen.");
                    // Use setTimeout to avoid potential conflicts if called too early
                    setTimeout(() => this.openMenu(this.leftMenuTriggerId!, this.leftMenuContentUrl || ''), 0);
                }
                // Ensure overlay is closed on wide screens
                if (this.menuOverlay.classList.contains('open')) {
                    this.menuOverlay.classList.remove('open');
                    document.body.style.overflow = '';
                }
            }
        }
    }


    // Private method to update footer position (called on resize)
    private updateFooterPosition(): void {
        // Find all footers on the page
        const footers = document.querySelectorAll('.footer');
        if (!footers.length) return;

        // Get viewport height
        const viewportHeight = window.innerHeight;

        footers.forEach(footer => {
            // Get footer's current position
            const footerElement = footer as HTMLElement;
            const footerRect = footerElement.getBoundingClientRect();
            const footerTop = window.scrollY + footerRect.top;
            const footerHeight = footerRect.height;

            // Calculate how much space is available above the footer
            const availableSpace = footerTop;

            // If available space is less than viewport height, add margin to push footer to bottom
            if (availableSpace < viewportHeight - footerHeight) {
                const marginNeeded = Math.max(0, viewportHeight - availableSpace - footerHeight);
                footerElement.style.marginTop = `${marginNeeded}px`;
            } else {
                footerElement.style.marginTop = '0';
            }
        });

        // Also update the scroll state
        this.updateFooterScrollState();
    }

    // Private method to update footer scroll state (called on scroll)
    private updateFooterScrollState(): void {
        const footers = document.querySelectorAll('.footer');
        if (!footers.length) return;

        // Check if scrolled to bottom (with a small threshold)
        const isScrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10;

        // Add or remove 'scrolled-to-bottom' class based on scroll position
        footers.forEach(footer => {
            if (isScrolledToBottom) {
                footer.classList.add('scrolled-to-bottom');
            } else {
                footer.classList.remove('scrolled-to-bottom');
            }
        });
    }

    public openMenu(triggerId: string, contentUrl: string = ''): void {
        if (this.isServer || !this.menuLeft || !this.menuOverlay || this.leftMenuOpened) {
            return;
        }

        this.leftMenuOpened = true;
        this.tkmlInstance.wrap?.classList.add('menu-left-active');
        // Update current trigger/URL immediately for state tracking

        // Load content if URL is provided AND it's different from what's loaded
        const targetFixedUrl = contentUrl ? this.fixUrl(decodeURIComponent(contentUrl)) : null;

        this.leftMenuContentUrl = targetFixedUrl;
        const isWideScreen = this.isWideScreen();

        if (!isWideScreen) {
            this.menuOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        } else {
            this.menuOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }


        if (targetFixedUrl && targetFixedUrl !== this.loadedMenuContentUrl) {
            this.menuLeft.innerHTML = ''; // Clear before loading
            // Use the loader's callback to update loadedMenuContentUrl
            this.loader(this.menuLeft).load(targetFixedUrl, false, undefined, false, undefined, this.menuLeft.id, () => {
                this.loadedMenuContentUrl = targetFixedUrl; // Update tracker *after* load
            });
        } else if (!targetFixedUrl && this.loadedMenuContentUrl) {
            // Opening menu without a URL, clear if old content exists
            this.menuLeft.innerHTML = '';
            this.loadedMenuContentUrl = null;
        } else if (targetFixedUrl && targetFixedUrl === this.loadedMenuContentUrl) {
            // Content is already correct, do nothing to the innerHTML
        } else {
            // Opening without URL, and no old content was loaded.
            this.menuLeft.innerHTML = ''; // Ensure it's empty
            this.loadedMenuContentUrl = null;
        }
    }

    // Close menu method - closes any active menu (left or right)
    public closeMenu(): void {
        if (this.isServer || !this.menuOverlay || !this.leftMenuOpened) {
            return;
        }
        // Don't close if we are on a wide screen where it should stay open
        /*if (this.isWideScreen()) {
            console.log("closeMenu: Skipped closing on wide screen.");
            return;
        }*/

        // Deactivate both left and right menus if they exist
        if (this.menuLeft) this.tkmlInstance.wrap?.classList.remove('menu-left-active');

        this.menuOverlay.classList.remove('open');
        document.body.style.overflow = ''; // Restore scrolling

        this.leftMenuOpened = false;
        // Do NOT reset loadedMenuContentUrl here, onPageUpdate needs it for comparison.
    }

    // Simplified menu toggle method
    public toggleMenu(triggerId: string, contentUrl: string = ''): void {
        if (!this.leftMenuOpened) {
            this.openMenu(triggerId, contentUrl);
        } else {
            // Closing the menu
            this.closeMenu();
        }
    }

    public isWideScreen(): boolean {
        return window.innerWidth > 900;
    }

    // Auto-open menu on page load for wide screens
    public initializeMenu(triggerId: string, contentUrl: string = ''): void {
        if (this.isServer || !this.menuLeft) return;

        this.leftMenuTriggerId = triggerId;

        // Update runtime state with the details from the *current* page's menu component
        // This is crucial for onPageUpdate to know the *intended* state after navigation
        contentUrl = this.fixUrl(decodeURIComponent(contentUrl)) || '';

        console.log(`initializeMenu: Setting leftMenuTriggerId=${triggerId}, leftMenuContentUrl=${contentUrl}, oldURL=${this.leftMenuContentUrl}`);
        if (contentUrl !== this.leftMenuContentUrl) {
            this.leftMenuContentUrl = contentUrl;
            this.loader(this.menuLeft).load(contentUrl, false, undefined, false, undefined, this.menuLeft.id, () => {
                if (this.menuLeft) {
                    this.menuLeft.scrollTop = 0;
                }
                if (this.isWideScreen()) {
                    this.openMenu(triggerId, contentUrl);
                }
            })
        }


        // Setup resize listener (ensure only one)
        window.removeEventListener('resize', this.handleResizeBound!);
        this.handleResizeBound = () => this.handleMenuResize();
        window.addEventListener('resize', this.handleResizeBound);
        this.handleMenuResize();
    }

    // Handle menu resize
    private handleMenuResize(): void {
        // This primarily ensures the *visual state* (open/closed/overlay) is correct on resize.
        // Content loading decisions are mainly handled by toggleMenu and onPageUpdate.
        if (this.isServer || !this.menuLeft || !this.menuOverlay) return;

        const isWideScreen = this.isWideScreen();

        if (isWideScreen) {
            // Ensure overlay is closed if it somehow became open
            if (this.menuOverlay.classList.contains('open')) {
                this.menuOverlay.classList.remove('open');
                document.body.style.overflow = '';
            }
            if (!this.tkmlInstance.wrap?.classList.contains('wide-screen')) {
                this.tkmlInstance.wrap?.classList.add('wide-screen');
                if (this.leftMenuTriggerId) {
                    console.log('openMenu on resize to wide screen', this.leftMenuTriggerId, this.leftMenuContentUrl)
                    this.openMenu(this.leftMenuTriggerId, this.leftMenuContentUrl || '');
                }
            }
        } else {
            // Narrow screen: If menu is open, ensure overlay is open and body scroll is hidden
            if (this.leftMenuOpened) {
                //if (!this.menuOverlay.classList.contains('open')) {
                //    this.menuOverlay.classList.add('open');
                //}
                //document.body.style.overflow = 'hidden';
                this.closeMenu();
            }
            this.tkmlInstance.wrap?.classList.remove('wide-screen');
        }
    }

    // Helper method to parse querystring to object
    public parseQueryString(queryString: string): Record<string, string> {
        const params: Record<string, string> = {};

        if (!queryString || queryString.trim() === '') {
            return params;
        }

        queryString.split('&').forEach(pair => {
            if (pair.trim()) {
                const parts = pair.split('=');
                const key = decodeURIComponent(parts[0]);
                const value = parts.length > 1 ? decodeURIComponent(parts[1]) : '';
                params[key] = value;
            }
        });

        return params;
    }

    private parsePostData(postData: string): Record<string, string> {
        // Try parsing as JSON first
        try {
            return JSON.parse(postData);
        } catch {
            // Not JSON, treat as comma-separated field names
            const fields = postData.split(',').map(f => f.trim());
            const formData: Record<string, string> = {};

            fields.forEach(field => {
                const input = document.querySelector(`[name="${field}"]`) as HTMLInputElement | HTMLTextAreaElement;
                if (input && 'value' in input) {
                    formData[field] = input.value;
                }
            });

            return formData;
        }
    }

    public loadPost(url: string | null, postData: string, target?: string): Runtime {
        if (this.aborted) return this;

        // Parse the post data string into an object
        const parsedData = this.parsePostData(postData);

        // Call the post method with the parsed data
        this.post(url, parsedData, target);
        return this;
    }

    // Add this method to the Runtime class
    public initializeDropdown(dropdownId: string): void {
        if (this.isServer) return;

        const dropdown = document.getElementById(dropdownId);
        if (!dropdown || dropdown.classList.contains('disabled')) return;

        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        const input = dropdown.querySelector('input[type="hidden"]') as HTMLInputElement;
        const display = dropdown.querySelector('.dropdown-display');
        const isSearchable = dropdown.classList.contains('searchable');
        const searchInput = dropdown.querySelector('.dropdown-search-input') as HTMLInputElement;
        const searchClear = dropdown.querySelector('.dropdown-search-clear');
        const optionsContainer = dropdown.querySelector('.dropdown-options');
        const noResults = dropdown.querySelector('.dropdown-no-results');

        // Define filterOptions function at a higher scope so it can be accessed by multiple handlers
        const filterOptions = (query: string) => {
            if (!isSearchable) return;

            const options = dropdown.querySelectorAll('.option');
            let hasVisibleOptions = false;

            options.forEach(option => {
                const text = option.textContent?.toLowerCase() || '';
                if (text.includes(query.toLowerCase())) {
                    (option as HTMLElement).style.display = '';
                    hasVisibleOptions = true;
                } else {
                    (option as HTMLElement).style.display = 'none';
                }
            });

            // Show/hide no results message
            if (noResults) {
                (noResults as HTMLElement).style.display = hasVisibleOptions ? 'none' : 'block';
            }
        };

        // Toggle dropdown menu
        toggle?.addEventListener('click', function (e) {
            e.preventDefault();
            dropdown.classList.toggle('open');

            // Focus search input when dropdown is opened
            if (isSearchable && dropdown.classList.contains('open')) {
                setTimeout(() => {
                    searchInput?.focus();
                }, 100);
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!dropdown.contains(e.target as Node)) {
                dropdown.classList.remove('open');

                // Only clear search when dropdown is fully closed
                setTimeout(() => {
                    if (!dropdown.classList.contains('open') && isSearchable && searchInput) {
                        searchInput.value = '';
                        filterOptions('');
                    }
                }, 300); // Wait for dropdown close animation to finish
            }
        });

        // Handle search functionality
        if (isSearchable && searchInput) {
            // Add input event listener
            searchInput.addEventListener('input', function () {
                filterOptions(this.value);
            });

            // Add clear button functionality
            searchClear?.addEventListener('click', function () {
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                    filterOptions('');
                }
            });

            // Prevent dropdown from closing when clicking in the search input
            searchInput.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }

        // Find initially selected option
        const selectedOption = dropdown.querySelector('.option.selected');
        if (selectedOption && display) {
            // Update display with selected option text
            display.textContent = selectedOption.textContent?.trim() || '';

            // Make sure the hidden input has the correct value
            if (input) {
                const value = (selectedOption as HTMLElement).getAttribute('value') || '';
                input.value = value;
            }
        }

        // Handle option selection
        const options = dropdown.querySelectorAll('.option:not(.disabled)');
        options.forEach(option => {
            // Skip options that have their own href attribute
            if (option.hasAttribute('href')) {
                return;
            }

            option.addEventListener('click', (e) => {
                e.preventDefault();

                // Remove selected class from all options
                options.forEach(opt => opt.classList.remove('selected'));

                // Add selected class to clicked option
                option.classList.add('selected');

                // Get the option value and text
                let value: string;
                const text = (option as HTMLElement).textContent?.trim() || '';
                if ((option as HTMLElement).hasAttribute('value')) {
                    value = (option as HTMLElement).getAttribute('value') || '';
                } else {
                    value = text;
                }

                // Update the hidden input and display
                if (input) input.value = value;
                if (display) display.textContent = text;

                // Handle image or icon in the selected option
                const existingImg = toggle?.querySelector('.dropdown-selected-img');
                const existingIcon = toggle?.querySelector('.dropdown-selected-icon');
                const existingRightIcon = toggle?.querySelector('.dropdown-selected-right-icon');

                if (existingImg) existingImg.remove();
                if (existingIcon) existingIcon.remove();
                if (existingRightIcon) existingRightIcon.remove();

                // Check if option has an image
                const optionImg = option.querySelector('.option-img');
                const optionRightIcon = option.querySelector('.option-right-icon');

                // Handle image if present
                if (optionImg && toggle) {
                    const imgClone = optionImg.cloneNode(true) as HTMLElement;
                    imgClone.classList.remove('option-img');
                    imgClone.classList.add('dropdown-selected-img');
                    toggle.insertBefore(imgClone, toggle.firstChild);

                    // If there's also a right icon, add it after the display
                    if (optionRightIcon && toggle) {
                        const rightIconClone = optionRightIcon.cloneNode(true) as HTMLElement;
                        rightIconClone.classList.remove('option-right-icon');
                        rightIconClone.classList.add('dropdown-selected-right-icon');
                        display?.after(rightIconClone);
                    }
                }
                // Check if option has only an icon (no image)
                else {
                    const optionIcon = option.querySelector('.option-icon');
                    if (optionIcon && toggle) {
                        const iconClone = optionIcon.cloneNode(true) as HTMLElement;
                        iconClone.classList.remove('option-icon');
                        iconClone.classList.add('dropdown-selected-icon');
                        toggle.insertBefore(iconClone, toggle.firstChild);
                    }
                }

                // Close the dropdown
                dropdown.classList.remove('open');

                // Store current search value to maintain filtered state
                const currentSearchValue = searchInput ? searchInput.value : '';

                // Handle form submission if dropdown has href
                const dropdownHref = dropdown.getAttribute('data-href');
                if (dropdownHref) {
                    // Create a simple object with the dropdown name and value
                    const data: Record<string, string> = {};
                    const name = input.name;
                    data[name] = value;

                    // Submit the form data
                    this.loader(dropdown).post(dropdownHref, data);
                }

                // Trigger change event
                const event = new Event('change', { bubbles: true });
                dropdown.dispatchEvent(event);

                // Clear search only after dropdown is fully closed
                setTimeout(() => {
                    if (!dropdown.classList.contains('open') && isSearchable && searchInput) {
                        searchInput.value = '';
                        filterOptions('');
                    }
                }, 300); // Wait for dropdown close animation to finish
            });
        });
    }

    public initializeTabBar(barId: string): void {
        if (this.isServer) return;

        const tabBar = document.getElementById(barId);
        if (!tabBar) return;

        const tabs = tabBar.querySelectorAll('.tab:not(.disabled)');

        // Find initially active tab or set the first one as active
        let activeTab = tabBar.querySelector('.tab.active');
        if (!activeTab && tabs.length > 0) {
            activeTab = tabs[0];
            activeTab.classList.add('active');
        }

        // Add click event listeners to tabs
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Skip if tab is already active
                if (tab.classList.contains('active')) return;

                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));

                // Add active class to clicked tab
                tab.classList.add('active');

                // Trigger change event
                const event = new CustomEvent('tabchange', {
                    bubbles: true,
                    detail: { tabId: tab.id }
                });
                tabBar.dispatchEvent(event);
            });
        });
    }

    /**
     * Инициализирует автоматическое обновление для элемента
     * @param elementId ID элемента для обновления
     * @param url URL для загрузки (если не указан, используется текущий URL)
     * @param intervalMs Интервал обновления в миллисекундах (если 0, обновление происходит один раз)
     */
    public initializeAutoUpdate(elementId: string, url: string, intervalMs: number = 0): void {
        if (this.isServer) return;

        if (!url || url === '') {
            url = this.currentUrl;
        }

        // Получаем элемент по ID
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`AutoUpdate: Element with ID ${elementId} not found`);
            return;
        }

        // Функция обновления
        const updateFunction = () => {
            console.log(`AutoUpdate: Refreshing content from ${url}`);
            this.loader(element).load(url, false, undefined, true); // noCache=true
        };

        // Если интервал > 0, настраиваем периодическое обновление
        if (intervalMs > 0) {
            // Очищаем предыдущий интервал, если он был
            const previousIntervalId = element.getAttribute('data-interval-id');
            if (previousIntervalId) {
                clearInterval(parseInt(previousIntervalId));
            }

            // Устанавливаем новый интервал
            const intervalId = setInterval(updateFunction, intervalMs);

            // Сохраняем ID интервала в атрибуте элемента
            element.setAttribute('data-interval-id', intervalId.toString());

            // Очищаем интервал при удалении элемента
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.removedNodes.forEach((node) => {
                        if (node === element || (node instanceof Element && node.contains(element))) {
                            clearInterval(intervalId);
                            observer.disconnect();
                        }
                    });
                });
            });

            // Наблюдаем за изменениями в DOM
            observer.observe(document.body, { childList: true, subtree: true });

            // Также очищаем интервал при смене страницы
            window.addEventListener('beforeunload', () => {
                clearInterval(intervalId);
            }, { once: true });
        } else {
            // Если интервал = 0, выполняем обновление один раз с небольшой задержкой
            setTimeout(updateFunction, 100);
        }
    }

    public initPlugin(url: string) {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => {
            console.log(`TKML plugin loaded: ${url}`);
        };
        script.onerror = (err) => {
            console.error(`Failed to load TKML plugin: ${url}`, err);
        };
        document.head.appendChild(script);
    }


    /**
     * Регистрирует функцию для выполнения при инициализации страницы
     * @param functionName Имя функции, которую нужно вызвать
     * @param params Параметры для передачи в функцию
     */
    public onInit(functionName: string, ...params: any[]): void {
        // Для некоторых функций (например, loadHighlightJs) мы хотим гарантировать уникальность вызова
        const uniqueFunctions = ['loadHighlightJs'];

        // Если функция должна быть уникальной и уже была вызвана, пропускаем
        if (uniqueFunctions.includes(functionName) && this.initializedFunctions.has(functionName)) {
            return;
        }

        // Отмечаем функцию как инициализированную
        if (uniqueFunctions.includes(functionName)) {
            this.initializedFunctions.add(functionName);
        }

        if (this.isServer) {
            // Для серверного рендеринга добавляем вызов в onload

            // Преобразуем параметры в JSON-строку для безопасной передачи
            const paramsString = params.map(p => JSON.stringify(p).replace(/'/g, "\\'")).join(',');

            this.onServerLoad.push(`tkmlr(${this.getId()}).${functionName}(${paramsString});`);
        } else if (this.isBrowser) {
            // Для браузера выполняем функцию сразу
            // Получаем функцию из this по имени
            const func = (this as any)[functionName];
            if (typeof func === 'function') {
                // Вызываем функцию с переданными параметрами
                setTimeout(() => {
                    func.apply(this, params);
                }, 0);
            } else {
                console.warn(`Runtime: Function "${functionName}" not found`);
            }
        }
    }

    /**
     * Загружает плагин по URL
     * @param pluginUrl URL плагина для загрузки
     * @returns Promise, который разрешается, когда плагин загружен
     */
    public loadPlugin(pluginUrl: string): Promise<void> {
        if (this.isServer) {
            return Promise.resolve();
        }

        // Проверяем, был ли плагин уже загружен
        if (this.pluginUrls.includes(pluginUrl)) {
            return Promise.resolve();
        }

        // Добавляем URL в список загруженных плагинов
        this.pluginUrls.push(pluginUrl);

        return new Promise((resolve, reject) => {
            // Создаем элемент script
            const script = document.createElement('script');
            script.src = pluginUrl;
            script.async = true;

            // Обработчики событий загрузки
            script.onload = () => {
                console.log(`Plugin loaded: ${pluginUrl}`);
                resolve();
            };
            script.onerror = (error) => {
                console.error(`Failed to load plugin: ${pluginUrl}`, error);
                reject(error);
            };

            // Добавляем скрипт в DOM
            document.head.appendChild(script);
        });
    }

    /**
     * Подсвечивает элемент с кодом с помощью highlight.js
     * @param elementId ID элемента для подсветки
     */
    public highlightElement(elementId: string): void {
        if (this.isServer) return;

        this.loadHighlightJs().then(() => {
            const element = document.getElementById(elementId);
            if (element) {
                (window as any).hljs.highlightElement(element);
            }
        });
    }

    // Добавим метод для проверки, был ли уже инициализирован highlight.js
    public isHighlightJsInitialized(): boolean {
        return this.highlightJsInitialized;
    }

    /**
     * Загружает несколько плагинов по их URL
     * @param pluginUrls Массив URL плагинов для загрузки
     * @returns Promise, который разрешается, когда все плагины загружены
     */
    public loadPlugins(pluginUrls: string[]): Promise<void[]> {
        if (this.isServer) {
            return Promise.resolve([]);
        }

        // Используем метод loadPlugin для загрузки каждого плагина
        const promises = pluginUrls.map(url => this.loadPlugin(url));

        // Возвращаем Promise.all для ожидания загрузки всех плагинов
        return Promise.all(promises);
    }
}

// Глобальный реестр для экземпляров Runtime только в браузере
if (isBrowser) {
    (window as any).TKML_RUNTIMES = new Map<number, Runtime>();

    // Helper function for inline calls
    (window as any).tkmlr = function (instanceId: number): Runtime {
        const runtime = (window as any).TKML_RUNTIMES.get(instanceId);
        if (!runtime) {
            throw new Error(`Runtime instance with id ${instanceId} not found`);
        }
        return runtime;
    };
}
