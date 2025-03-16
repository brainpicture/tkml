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
    currentHost: string = '';
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
    public onload: string[] = [];

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

    private resetState(): void {
        this.aborted = false;
    }

    private abort(): Runtime {
        this.aborted = true;
        return this;
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
        this.load(url, true, undefined, noCache, target, rootElement);
    }

    public post(url: string, params: Record<string, string>) {
        url = decodeURIComponent(url);
        this.load(url, true, params);
    }

    private formatUrl(url: string): string {
        url = url.replace(/^https?:\/\//, '//');
        return url;
    }

    private getFullUrl(url: string): string {


        // Если URL абсолютный - обрабатываем как раньше
        if (url.startsWith('//') || url.match(/^https?:\/\//)) {
            let fullUrl = url;
            if (fullUrl.startsWith('//')) {
                fullUrl = (url.startsWith('//localhost') ? 'http:' : 'https:') + fullUrl;
            }
            if (URL.canParse(fullUrl)) {
                this.currentHost = new URL(fullUrl).origin;
            }
            return fullUrl;
        }

        const baseHost = this.currentHost || (this.isBrowser ? window.location.origin : '');

        // Если путь начинается с /, считаем его абсолютным от корня
        if (url.startsWith('/')) {
            return baseHost + url;
        }

        // Для относительных путей используем текущую директорию
        let currentPath = this.getLocation();

        // Проверяем, не является ли currentPath абсолютным URL
        if (currentPath) {
            // Check if currentPath ends with .tkml, ignoring any query parameters
            currentPath = currentPath.split('?')[0];
            const lastSlashIndex = currentPath.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
                const basePath = currentPath.substring(0, lastSlashIndex + 1);
                if (currentPath.match(/^(https?:)?\/\//)) {
                    if (currentPath.startsWith(baseHost)) {
                        return basePath + url;
                    }
                    // if host is not the same we will return baseHost + url
                } else {
                    return baseHost + (basePath.startsWith('/') ? basePath : '/' + basePath) + url;
                }
            }
        }

        // Если нет текущего пути или currentPath - абсолютный URL
        return baseHost + '/' + url;
    }

    private popCache(url: string, target?: string) {
        const content = this.getCache(url)!;
        const parser = new Parser(target && this.isBrowser ? document.getElementById(target)! : this.tkmlInstance.root, this, target);
        parser.add(content);
        parser.finish();
    }

    public load(url: string, updateHistory: boolean = false, postData?: Record<string, string>, noCache?: boolean, target?: string, rootElement?: Component) {
        // В серверном окружении просто возвращаем
        if (this.isServer) return;

        // Store initial URL on first load
        if (!this.initialUrl) {
            this.initialUrl = url;
        }

        const fullUrl = this.getFullUrl(url)

        if (updateHistory && !target && !rootElement) {
            let historyUrl = (!this.currentHost || this.currentHost == window.location.origin) ? url : fullUrl;
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
        }

        // Check cache first
        if (!postData && !noCache && this.hasCache(fullUrl)) {
            this.popCache(fullUrl, target);
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

    public getLocation(): string {
        if (this.isBrowser) {
            return window.location.href;
        }
        return '';
    }

    public fromText(text: string): string {
        const parser = new Parser(this.tkmlInstance.root, this);
        parser.add(text);
        return parser.finish() || '';
    }

    public loader(element: HTMLElement): Runtime {
        if (this.aborted) return this;
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
        if (this.isServer) return;
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
        if (this.isServer) return;
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

    // onload should be added only once per each component
    public addOnload(component: Component, script: string) {
        if (component.onloadAdded) return;
        this.onload.push(script);
        component.onloadAdded = true;
    }

    compile(tkml: string): string {
        const parser = new Parser(null, this);
        parser.add(tkml);
        return parser.finish() || '';
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
