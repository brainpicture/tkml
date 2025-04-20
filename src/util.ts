// URL encoding for attributes
export function encodeUrl(url: string): string {
    return encodeURIComponent(url).replace(/["']/g, match => match === '"' ? '&quot;' : '&#39;');
}

// safeIds only allows id symbols to prevent any XSS attacks
export function safeIds(ids: string): string {
    return ids.replace(/[^a-zA-Z0-9-_. ,]/g, '');
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

/**
 * Universal function for handling post, href and required attributes in components
 * @param runtimeId Runtime instance ID
 * @param attributes Component attributes
 * @param options Configuration options
 * @returns String with the onclick handler
 */
export function getComponentHandler(
    runtimeId: number | undefined,
    attributes: Record<string, string>,
    options: {
        componentActions?: string; // Additional component-specific actions at the beginning of handler
        validationField?: string;  // Field name for validation
        tagType?: string;          // Tag type (for special handling)
        updatePreload?: boolean;   // Flag for content preloading
    } = {}
): string {
    const {
        componentActions = '',
        validationField = '',
        tagType = '',
        updatePreload = false
    } = options;

    // Prepare validation if needed
    const validation = validationField && attributes['required']
        ? `.validateFields('${safeIds(attributes['required'])}')`
        : '';

    // Handle external links
    if (attributes['external'] !== undefined && attributes['href']) {
        return ''; // For external links, handler will be added separately
    }

    // Handle POST requests
    if (attributes['post']) {
        let url;
        if ('href' in attributes) {
            url = "'" + encodeUrl(attributes['href']) + "'";
        } else {
            url = 'null';
        }
        const target = attributes['target'] ? `, '${safeIds(attributes['target'])}'` : '';

        // Create handler with loadPost and component-specific actions
        return ` onclick="${componentActions}tkmlr(${runtimeId})${validation}.loader(this).loadPost(${url}, '${safeAttr(attributes['post'])}'${target})"`;
    }

    // Handle navigation (href)
    else if (attributes['href']) {
        const url = encodeUrl(attributes['href']);
        const target = attributes['target'] ? `, true, '${safeIds(attributes['target'])}'` : '';

        // Create go() handler with component-specific actions
        const handler = ` onclick="${componentActions}tkmlr(${runtimeId})${validation}.loader(this).go('${url}'${target})"`;

        // Preload content if required
        if (updatePreload && attributes['preload'] !== undefined && attributes['preload'] !== "false") {
            // Note: preloading is handled separately in the component via setTimeout
        }

        return handler;
    }

    // If no post or href, but has component-specific actions
    return componentActions ? ` onclick="${componentActions}"` : '';
}

// Simple utilities for environment detection
export const isServer = typeof window === 'undefined';
export const isBrowser = !isServer;

// Safe wrappers for DOM operations
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

// Safe wrappers for window operations
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
    // If URL is absolute - keep as is
    if (url.match(/^https?:\/\//)) {
        return url;
    }

    if (!runtime) {
        return url;
    }
    url = runtime.fixUrl(url);

    let fullUrl = runtime.getFullUrl(url);
    return fullUrl;
    // Otherwise add current host
    //const baseHost = isBrowser ? window.location.origin : '';
    //return baseHost + (url.startsWith('/') ? '' : '/') + url;
} 