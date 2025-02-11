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

    constructor(tkmlInstance: TKML) {
        this.instanceId = ++Runtime.counter;
        this.tkmlInstance = tkmlInstance;

        // Add history navigation handler
        window.addEventListener('popstate', (event) => {
            const params = new URLSearchParams(window.location.search);
            const loadUrl = params.get('l');

            if (loadUrl) {
                this.load(decodeURIComponent(loadUrl), false);
            } else if (this.initialUrl) {
                // Return to initial page if no 'l' parameter
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

    public go(url: string) {
        url = decodeURIComponent(url);
        this.load(url, true);
    }

    public post(url: string, params: Record<string, string>) {
        url = decodeURIComponent(url);
        this.load(url, true, params);
    }

    public load(url: string, updateHistory: boolean = false, postData?: Record<string, string>) {
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

        // Check cache first
        if (this.hasCache(fullUrl) && !postData) {
            const content = this.getCache(fullUrl)!;
            const parser = new Parser(this.tkmlInstance.root, this);
            parser.add(content);
            parser.finish();
            return;
        }

        if (updateHistory) {
            // Update browser history with encoded URL as parameter
            const currentUrl = new URL(window.location.href);
            const historyUrl = new URL(window.location.origin + window.location.pathname);
            historyUrl.searchParams.set('l', encodeURIComponent(fullUrl));

            if (currentUrl.searchParams.get('l') !== historyUrl.searchParams.get('l')) {
                window.history.pushState({ url: fullUrl }, '', historyUrl);
            }
        }

        const xhr = new XMLHttpRequest();
        xhr.open(postData ? 'POST' : 'GET', fullUrl, true);
        xhr.setRequestHeader('Accept', 'application/tkml');

        if (postData) {
            xhr.setRequestHeader('Content-Type', 'application/json');
        }

        const parser = new Parser(this.tkmlInstance.root, this);

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
