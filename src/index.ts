import { Parser } from './parser';
import { Runtime } from './runtime';

export class TKML {
    root: HTMLElement;
    runtime: Runtime;
    private currentHost: string = '';

    constructor(container: HTMLElement, opts: { dark?: boolean } = {}) {
        this.root = container;
        this.runtime = new Runtime(this);
        (window as any).TKML_RUNTIMES.set(this.runtime.getId(), this.runtime);

        // Check for system preference
        const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
        if (opts.dark || (opts.dark === undefined && prefersDarkScheme.matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.add('light')
        }
        this.root.classList.add('tkml-cont')
    }

    // open any TKML page
    public load(url: string, updateHistory: boolean = false) {
        // Handle relative URLs
        let fullUrl = url;
        if (!url.match(/^https?:\/\//)) {
            const baseHost = this.currentHost || window.location.origin;
            fullUrl = baseHost + (url.startsWith('/') ? '' : '/') + url;
        } else if (URL.canParse(fullUrl)) {
            this.currentHost = new URL(fullUrl).origin;
        }

        if (updateHistory) {
            // Update browser history with encoded URL as parameter
            const currentUrl = new URL(window.location.href);
            const historyUrl = new URL(window.location.origin + window.location.pathname);
            historyUrl.searchParams.set('l', encodeURIComponent(fullUrl));

            if (currentUrl.searchParams.get('l') !== historyUrl.searchParams.get('l')) {
                window.history.pushState({}, '', historyUrl);
            }
        }

        const xhr = new XMLHttpRequest();
        xhr.open('GET', fullUrl, true);
        xhr.setRequestHeader('Accept', 'application/tkml');

        let parser = new Parser(this.root, this.runtime.getId());

        xhr.onprogress = function () {
            parser.add(xhr.responseText);
        };

        xhr.onload = function () {
            if (xhr.status === 200) {
                parser.finish()
            } else {
                parser.failed(new Error(`Failed to load URL: ${fullUrl}`))
            }
        };

        xhr.onerror = function () {
            parser.failed(new Error(`Network error while loading URL: ${fullUrl}`))
        };

        xhr.send();
    }

    public fromText(text: string) {
        let parser = new Parser(this.root, this.runtime.getId());
        parser.add(text);
        parser.finish();
    }
}

// Add this line to make it available globally
(window as any).TKML = TKML; 