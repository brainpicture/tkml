import { Parser } from './parser';
import { Runtime } from './runtime';
import { isServer, isBrowser } from './util';
// Импортируем все компоненты
import './components/index';

export interface TKMLOptions {
    theme?: 'light' | 'dark';
    URLControl?: boolean;
    isServer?: boolean;
    baseUrl?: string; // Базовый URL для серверного окружения
    instanceId?: number;
    plugins?: string[]; // Array of plugin script URLs
}

export class TKML {
    wrap: HTMLElement | null;
    root: HTMLElement | null = null;
    rootUrl: string = '';
    runtime: Runtime;
    menuLeft: HTMLElement | null = null;
    menuRight: HTMLElement | null = null;
    menuOverlay: HTMLElement | null = null;

    constructor(container: HTMLElement | null, opts: TKMLOptions = {}) {
        this.wrap = container;
        this.runtime = new Runtime(this, opts);
        console.log('TKML constructor', this.wrap);
        // Регистрируем экземпляр Runtime только в браузерном окружении
        if (isBrowser) {
            (window as any).TKML_RUNTIMES.set(this.runtime.getId(), this.runtime);

            const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
            console.log('prefersDarkScheme', prefersDarkScheme, opts.theme);

            this.runtime.setTheme(opts.theme || (opts.theme === undefined && prefersDarkScheme.matches ? 'dark' : 'light'));

            // Initialize layout structure
            this.initializeLayout(opts.instanceId);

            // Load plugins if specified
            if (opts.plugins && opts.plugins.length > 0) {
                this.loadPlugins(opts.plugins);
            }

            (window as any).TKMLInstance = this;
        }
    }

    // Initialize the layout structure
    private initializeLayout(forceInstanceId: number | undefined): void {
        console.log('initializeLayout!!', this.wrap);
        if (!this.wrap) {
            return;
        }

        if (forceInstanceId) {
            let l = document.getElementById(`menu-left-${forceInstanceId}`);
            if (l) {
                this.menuLeft = l;
                this.menuRight = document.getElementById(`menu-right-${forceInstanceId}`);
                this.menuOverlay = document.getElementById(`menu-overlay-${forceInstanceId}`);

                if (this.menuOverlay) {
                    this.menuOverlay.onclick = () => this.runtime.closeMenu();
                }
                this.runtime.menuLeft = this.menuLeft;
                this.runtime.menuRight = this.menuRight;
                this.runtime.menuOverlay = this.menuOverlay;

                this.root = document.getElementById(`cont-${forceInstanceId}`);
                // elements are indexed, exit
                return;
            }
        }

        this.wrap.className = 'tkml-cont';

        // Create menu-left element
        this.menuLeft = document.createElement('div');
        this.menuLeft.className = 'menu menu-left';
        this.menuLeft.id = `menu-left-${this.runtime.getId()}`;
        this.wrap.appendChild(this.menuLeft);

        // Create menu-right element
        this.menuRight = document.createElement('div');
        this.menuRight.className = 'menu menu-right';
        this.menuRight.id = `menu-right-${this.runtime.getId()}`;
        this.wrap.appendChild(this.menuRight);

        // Create the single overlay and append to body
        this.menuOverlay = document.createElement('div');
        this.menuOverlay.className = 'menu-overlay';
        this.menuOverlay.id = `menu-overlay-${this.runtime.getId()}`;
        this.wrap.appendChild(this.menuOverlay);
        // Add onclick to close the currently active menu
        this.menuOverlay.onclick = () => this.runtime.closeMenu();

        // Create content container for the main page content
        this.root = document.createElement('div');
        this.root.id = `cont-${this.runtime.getId()}`;
        this.wrap.appendChild(this.root);

        // Store references in runtime for easy access
        this.runtime.menuLeft = this.menuLeft;
        this.runtime.menuRight = this.menuRight;
        this.runtime.menuOverlay = this.menuOverlay;
    }

    // Method to load plugin scripts
    private loadPlugins(pluginUrls: string[]): void {
        // For browser environment
        pluginUrls.forEach(url => {
            this.runtime.onInit('initPlugin', url);
        });

        // For both environments, store plugin URLs in runtime for potential reuse
        this.runtime.pluginUrls = pluginUrls;
    }

    public preload(url: string) {
        this.runtime.preload(url);
    }

    // open any TKML page
    public load(url: string, updateHistory: boolean = false, postData?: Record<string, string | string[]>) {
        url = this.runtime.fixUrl(url)
        this.runtime.load(url, updateHistory, postData);
    }

    public fromText(text: string): boolean {
        const parser = new Parser(this.root, this.runtime);
        parser.add(text);
        parser.finish();

        this.runtime.setCacheForCurrentUrl(text);

        // Update the page after rendering text
        if (this.runtime) {
            setTimeout(() => this.runtime.onPageUpdate(), 0);
        }

        return true;
    }

    public setCurrentUrl() {
        if (isBrowser) {
            if (this.runtime.options.URLControl) {
                let path = window.location.pathname;
                if (path.startsWith('/') && path.length > 1) {
                    this.runtime.currentUrl = path;
                    return true;
                }
            } else {
                // Используем hash без декодирования
                const hash = window.location.hash.slice(1);
                if (hash) {
                    this.runtime.currentUrl = hash;
                    return true;
                }
            }
        }
    }

    public fromUrl(): boolean {
        if (!isBrowser) {
            return false
        }
        this.setCurrentUrl()
        this.runtime.load(this.runtime.currentUrl, false);
        return true
    }

    public addPage(path: string, content: string) {
        let fullUrl = this.runtime.getFullUrl(path)
        this.runtime.setCache(fullUrl, content);
    }

    // start TKML using routes from URL
    public route() {
        if (!this.fromUrl()) {
            this.setCurrentUrl()
            this.load('/')
        }
    }

    // Статический метод для компиляции TKML в HTML
    public compile(tkml: string): string {
        this.setCurrentUrl()
        return this.runtime.compile(tkml);
    }

    // is needed to serve runtime js for server side flow
    public getRuntimeJS() {
        return this.runtime.onServerLoad.join('\n');
    }

    public registerComponent(componentClass: new (...args: any[]) => any): void {
        // This is a simple wrapper around ComponentFactory.register
        const { ComponentFactory } = require('./components');
        ComponentFactory.register(componentClass);
    }

}

// Делаем TKML доступным глобально только в браузере
if (isBrowser) {
    (window as any).TKML = TKML;
    (window as any).TKMLInstance = null; // Will store the current instance
}

// Экспортируем для использования в Node.js или в процессе сборки
export default TKML; 