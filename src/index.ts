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
        }
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
        if (isBrowser) {
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
        }
        return false;
    }

    // Статический метод для компиляции TKML в HTML
    public compile(tkml: string): string {
        return this.runtime.compile(tkml);
    }

    // is needed to serve runtime js for server side flow
    public getRuntimeJS() {
        return this.runtime.onload.join('\n');
    }

}

// Делаем TKML доступным глобально только в браузере
if (isBrowser) {
    (window as any).TKML = TKML;
}

// Экспортируем для использования в Node.js или в процессе сборки
export default TKML; 