import { Parser } from './parser';
import { Runtime } from './runtime';

export interface TKMLOptions {
    dark?: boolean;
    URLControl?: boolean;
}

export class TKML {
    root: HTMLElement;
    rootUrl: string = '';
    runtime: Runtime;

    constructor(container: HTMLElement, opts: TKMLOptions = {}) {
        this.root = container;
        this.runtime = new Runtime(this, opts);
        (window as any).TKML_RUNTIMES.set(this.runtime.getId(), this.runtime);

        const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
        if (opts.dark || (opts.dark === undefined && prefersDarkScheme.matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.add('light')
        }
        this.root.classList.add('tkml-cont')
    }

    public preload(url: string) {
        this.runtime.preload(url);
    }

    // open any TKML page
    public load(url: string, updateHistory: boolean = false, postData?: Record<string, string>) {
        this.runtime.load(url, updateHistory, postData);
    }

    public fromText(text: string) {
        this.runtime.fromText(text)

    }

    public fromUrl(): boolean {
        if (this.runtime.options.URLControl) {
            let path = window.location.pathname;
            if (path.startsWith('/') && path.length > 1) {
                this.load(path);
                return true;
            }
        } else {
            // Используем hash без декодирования
            const hash = window.location.hash.slice(1);
            if (hash) {
                this.load(hash);
                return true;
            }
        }
        return false;
    }
}

// Add this line to make it available globally
(window as any).TKML = TKML; 