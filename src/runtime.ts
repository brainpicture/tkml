import { BaseComponent, Component } from "./components";
import { TKML } from "./index";
import { Parser } from "./parser";

// Runtime class to handle all TKML actions
export class Runtime {
    private instanceId: number;
    private static counter = 0;
    private tkmlInstance: TKML;
    private cache: Map<string, string> = new Map();
    currentHost: string = '';
    private initialUrl: string | null = null;
    private static highlightJsLoaded = false;
    private static loadingPromise: Promise<void> | null = null;
    private observers: Map<string, IntersectionObserver> = new Map();
    private footerState: Map<string, { lastScrollY: number, direction: 'up' | 'down' }> = new Map();

    constructor(tkmlInstance: TKML) {
        this.instanceId = ++Runtime.counter;
        this.tkmlInstance = tkmlInstance;

        // Add history navigation handler
        window.addEventListener('popstate', (event) => {
            const params = new URLSearchParams(window.location.search);
            const loadUrl = params.get('l');
            console.log('popstate!!', loadUrl);
            console.log('history', this.initialUrl);

            if (loadUrl) {
                this.load(decodeURIComponent(loadUrl), false);
            } else if (this.tkmlInstance.rootUrl) {
                // Return to initial page if no 'l' parameter
                this.load(this.tkmlInstance.rootUrl, false);
            } else if (this.initialUrl) {
                this.load(this.initialUrl, false);
            }
        });
    }

    private hasCache(url: string): boolean {
        return this.cache.has(url);
    }

    private getCache(url: string): string | undefined {
        return this.cache.get(url);
    }

    private setCache(url: string, content: string) {
        this.cache.set(url, content);
    }

    public go(url: string, noCache: boolean = false, target?: string, rootElement?: Component) {
        url = decodeURIComponent(url);
        if (target) {
            noCache = true;
            console.log('target NO CACHE', target);
        }
        this.load(url, true, undefined, noCache, target, rootElement);
    }

    public post(url: string, params: Record<string, string>) {
        url = decodeURIComponent(url);
        this.load(url, true, params);
    }

    public load(url: string, updateHistory: boolean = false, postData?: Record<string, string>, noCache?: boolean, target?: string, rootElement?: Component) {
        // Store initial URL on first load
        if (!this.initialUrl) {
            this.initialUrl = url;
        }

        // Handle relative URLs
        let fullUrl = url;
        if (!url.match(/^https?:\/\//)) {
            const baseHost = this.currentHost || window.location.origin;
            fullUrl = baseHost + (url.startsWith('/') ? '' : '/') + url;
        } else if (URL.canParse(fullUrl)) {
            this.currentHost = new URL(fullUrl).origin;
        }

        if (updateHistory && !target && !rootElement) {
            // Update browser history with encoded URL as parameter
            const currentUrl = new URL(window.location.href);
            const historyUrl = new URL(window.location.origin + window.location.pathname);
            historyUrl.searchParams.set('l', encodeURIComponent(fullUrl));

            if (currentUrl.searchParams.get('l') !== historyUrl.searchParams.get('l')) {
                window.history.pushState({ url: fullUrl }, '', historyUrl);
            }
        }

        // Check cache first
        if (!postData && !noCache && this.hasCache(fullUrl)) {
            console.log('cache', fullUrl);
            const content = this.getCache(fullUrl)!;
            const parser = new Parser(target ? document.getElementById(target)! : this.tkmlInstance.root, this, target);
            parser.add(content);
            parser.finish();
            return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open(postData ? 'POST' : 'GET', fullUrl, true);
        xhr.setRequestHeader('Accept', 'application/tkml');

        if (postData) {
            xhr.setRequestHeader('Content-Type', 'application/json');
        }

        const parser = new Parser(this.tkmlInstance.root, this, target, rootElement);

        xhr.onprogress = () => {
            parser.add(xhr.responseText);
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                parser.finish();
                if (!postData) {
                    this.setCache(fullUrl, xhr.responseText);
                }
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

    public loader(element: HTMLElement) {
        element.classList.add('loading');
        return this;
    }

    public getId(): number {
        return this.instanceId;
    }

    public preload(url: string) {
        url = decodeURIComponent(url);


        // Handle relative URLs
        let fullUrl = url;
        if (!url.match(/^https?:\/\//)) {
            const baseHost = this.currentHost || window.location.origin;
            fullUrl = baseHost + (url.startsWith('/') ? '' : '/') + url;
        }

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
                    this.go(url, true, undefined, component);
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

    public observeFooter(footerId: string): void {
        const footer = document.getElementById(footerId);
        if (!footer) return;

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
            if (!ticking) {
                window.requestAnimationFrame(updateFooter);
                ticking = true;
            }
        });

        // Инициализируем начальное состояние
        updateFooter();
        this.footerState.set(footerId, { lastScrollY, direction: 'down' });
    }

    public observeHeader(headerId: string): void {
        const header = document.getElementById(headerId);
        if (!header) return;

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
}

// Global registry for runtime instances
(window as any).TKML_RUNTIMES = new Map<number, Runtime>();

// Helper function for inline calls
(window as any).tkmlr = function (instanceId: number): Runtime {
    const runtime = (window as any).TKML_RUNTIMES.get(instanceId);
    if (!runtime) {
        throw new Error(`Runtime instance with id ${instanceId} not found`);
    }
    return runtime;
};
