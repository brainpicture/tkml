import { BaseComponent, ComponentFactory } from '../components';
import { encodeUrl, safeIds, safeAttr } from '../util';

export class Navigation extends BaseComponent {
    tag = 'navigation';
    canParent = ['tkml', 'footer'];

    render(): string {
        let attrs = this.getAttributes();
        return `<div class="pagination"${attrs}>${this.childs()}</div>`;
    }
}
ComponentFactory.register(Navigation);

export class Next extends BaseComponent {
    tag = 'next';
    canParent = ['navigation'];
    hasText = true;

    render(): string {
        let attrs = this.getAttributes();
        let icon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        // Handle external links
        if (this.attributes['external'] !== undefined && this.attributes['href']) {
            const url = this.attributes['href'];
            const target = this.attributes['target'] ? ` target="${safeAttr(this.attributes['target'])}"` : '';

            return `<a href="${safeAttr(url)}"${target} class="pagination-item pagination-next"${attrs}>${this.childs()} ${icon}</a>`;
        }
        else if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            attrs += ` href="javascript:void(0)" onclick="tkmlr(${this.runtime?.getId()}).loader(this).go('${url}')"`;

            if (this.attributes['preload'] !== undefined && this.attributes['preload'] !== "false") {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }

        return `<button class="pagination-item pagination-next"${attrs}>${this.childs()} ${icon}</button>`;
    }
}
ComponentFactory.register(Next);

export class Prev extends BaseComponent {
    tag = 'prev';
    canParent = ['navigation'];
    hasText = true;

    render(): string {
        let attrs = this.getAttributes();
        let icon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        // Handle external links
        if (this.attributes['external'] !== undefined && this.attributes['href']) {
            const url = this.attributes['href'];
            const target = this.attributes['target'] ? ` target="${safeAttr(this.attributes['target'])}"` : '';

            return `<a href="${safeAttr(url)}"${target} class="pagination-item pagination-prev"${attrs}>${icon} ${this.childs()}</a>`;
        }
        else if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, '${safeIds(this.attributes['target'])}'` : '';
            attrs += ` onclick="tkmlr(${this.runtime?.getId()}).loader(this).go('${url}'${target})"`;

            if (this.attributes['preload'] === 'true') {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }

        return `<button class="pagination-item pagination-prev"${attrs}>${icon} ${this.childs()}</button>`;
    }
}
ComponentFactory.register(Prev);

export class Page extends BaseComponent {
    tag = 'page';
    canParent = ['navigation'];
    hasText = true;

    render(): string {
        let attrs = this.getAttributes();
        const id = this.getId();
        let classes = 'pagination-item pagination-page';

        if (this.attributes['center'] === 'true') {
            classes += ' center';
        }

        // Handle external links
        if (this.attributes['external'] !== undefined && this.attributes['href']) {
            const url = this.attributes['href'];
            const target = this.attributes['target'] ? ` target="${safeAttr(this.attributes['target'])}"` : '';

            return `<a href="${safeAttr(url)}"${target} class="${classes}"${attrs} id="${id}">${this.childs()}</a>`;
        }
        else if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, '${safeIds(this.attributes['target'])}'` : '';
            attrs += ` onclick="tkmlr(${this.runtime?.getId()}).loader(this).go('${url}'${target})"`;

            if (this.attributes['preload'] === 'true') {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }

        return `<div class="${classes}"${attrs} id="${id}">${this.childs()}</div>`;
    }
}
ComponentFactory.register(Page); 