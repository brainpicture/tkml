// URL encoding for attributes
export function encodeUrl(url: string): string {
    return encodeURIComponent(url).replace(/["']/g, match => match === '"' ? '&quot;' : '&#39;');
}

// safeIds only allows id symbols to prevent any XSS attacks
export function safeIds(ids: string): string {
    return ids.replace(/[^a-zA-Z0-9-_ ,]/g, '');
}

// safe the string to prevent any XSS attacks
export function safeAttr(attr: string): string {
    return attr.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#x60;');
}

// Добавим простые утилиты для определения окружения
export const isServer = typeof window === 'undefined';
export const isBrowser = !isServer;

// Безопасные обертки для работы с DOM и window
export const safeDOM = {
    querySelector: (selector: string): HTMLElement | null => {
        return isBrowser ? document.querySelector(selector) : null;
    },
    getElementById: (id: string): HTMLElement | null => {
        return isBrowser ? document.getElementById(id) : null;
    },
    addEventListener: (target: any, event: string, handler: EventListener): void => {
        if (isBrowser && target && target.addEventListener) {
            target.addEventListener(event, handler);
        }
    }
};

export const safeWindow = {
    location: {
        get href(): string {
            return isBrowser ? window.location.href : '';
        },
        get pathname(): string {
            return isBrowser ? window.location.pathname : '';
        },
        get hash(): string {
            return isBrowser ? window.location.hash : '';
        },
        get origin(): string {
            return isBrowser ? window.location.origin : '';
        }
    },
    history: {
        pushState: (data: any, title: string, url?: string): void => {
            if (isBrowser && window.history) {
                window.history.pushState(data, title, url);
            }
        }
    }
};

// Resolve relative URLs against current host
export function resolveUrl(url: string, runtime?: any): string {
    // Если URL абсолютный - оставляем как есть
    if (url.match(/^https?:\/\//)) {
        return url;
    }

    if (!runtime) {
        return url;
    }
    url = runtime.fixUrl(url);

    let fullUrl = runtime.getFullUrl(url);
    return fullUrl;
    // Иначе добавляем текущий хост
    //const baseHost = isBrowser ? window.location.origin : '';
    //return baseHost + (url.startsWith('/') ? '' : '/') + url;
} 