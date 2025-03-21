import { Parser } from './parser';
import { Runtime } from './runtime';
import { isServer, isBrowser } from './util';
// Импортируем все компоненты
import './components/index';

export interface TKMLOptions {
    dark?: boolean;
    URLControl?: boolean;
    isServer?: boolean;
    baseUrl?: string; // Базовый URL для серверного окружения
    instanceId?: number;
    plugins?: string[]; // Array of plugin script URLs
}

export class TKML {
    root: HTMLElement | null;
    rootUrl: string = '';
    runtime: Runtime;

    constructor(container: HTMLElement | null, opts: TKMLOptions = {}) {
        this.root = container;
        this.runtime = new Runtime(this, opts);

        // Регистрируем экземпляр Runtime только в браузерном окружении
        if (isBrowser) {
            (window as any).TKML_RUNTIMES.set(this.runtime.getId(), this.runtime);

            const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
            if (opts.dark || (opts.dark === undefined && prefersDarkScheme.matches)) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.add('light')
            }

            if (this.root) {
                this.root.classList.add('tkml-cont')
            }

            // Load plugins if specified
            if (opts.plugins && opts.plugins.length > 0) {
                this.loadPlugins(opts.plugins);
            }

            (window as any).TKMLInstance = this;
        }
    }

    // Method to load plugin scripts
    private loadPlugins(pluginUrls: string[]): void {
        // For browser environment
        if (isBrowser) {
            pluginUrls.forEach(url => {
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
            });
        }
        // For server-side rendering
        else if (isServer) {
            pluginUrls.forEach(url => {
                // Add JavaScript code to load the plugin script
                this.runtime.onload.push(`
                    (function() {
                        var script = document.createElement('script');
                        script.src = "${url}";
                        script.async = true;
                        script.onload = function() {
                            console.log("TKML plugin loaded: ${url}");
                        };
                        script.onerror = function(err) {
                            console.error("Failed to load TKML plugin: ${url}", err);
                        };
                        document.head.appendChild(script);
                    })();
                `);
            });
        }

        // For both environments, store plugin URLs in runtime for potential reuse
        this.runtime.pluginUrls = pluginUrls;
    }

    public preload(url: string) {
        this.runtime.preload(url);
    }

    // open any TKML page
    public load(url: string, updateHistory: boolean = false, postData?: Record<string, string>) {
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

    public fromUrl(): boolean {
        if (isBrowser) {
            if (this.runtime.options.URLControl) {
                let path = window.location.pathname;
                if (path.startsWith('/') && path.length > 1) {
                    this.runtime.load(path, false);
                    this.runtime.currentUrl = path;
                    return true;
                }
            } else {
                // Используем hash без декодирования
                const hash = window.location.hash.slice(1);
                if (hash) {
                    this.runtime.load(hash, false);
                    this.runtime.currentUrl = hash;
                    return true;
                }
            }
        }
        return false;
    }

    public addPage(path: string, content: string) {
        let fullUrl = this.runtime.getFullUrl(path)
        this.runtime.setCache(fullUrl, content);
    }

    // start TKML using routes from URL
    public route() {
        if (!this.fromUrl()) {
            this.load('/')
        }
    }

    // Статический метод для компиляции TKML в HTML
    public compile(tkml: string): string {
        return this.runtime.compile(tkml);
    }

    // is needed to serve runtime js for server side flow
    public getRuntimeJS() {
        return this.runtime.onload.join('\n');
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