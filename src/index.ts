import { Parser } from './parser';
import { Runtime } from './runtime';

export class TKML {
    root: HTMLElement;
    rootUrl: string = '';
    runtime: Runtime;

    constructor(container: HTMLElement, opts: { dark?: boolean } = {}) {
        this.root = container;
        this.runtime = new Runtime(this);
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
        const parser = new Parser(this.root, this.runtime);
        parser.add(text);
        parser.finish();
    }
}

// Add this line to make it available globally
(window as any).TKML = TKML; 