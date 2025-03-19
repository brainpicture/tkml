import { BaseComponent, ComponentFactory } from '../components';
import { encodeUrl, safeIds } from '../util';

export class Header extends BaseComponent {
    tag = 'header';

    render(): string {
        let attrs = this.getAttributes();
        let centerClass = this.attributes['center'] !== undefined ? ' center' : '';
        const id = this.getId();

        // Регистрируем наблюдение за скроллом
        setTimeout(() => {
            if (this.runtime && !this.runtime.isServer) {
                this.runtime.observeHeader(id);
            }
        }, 0);

        return `<div id="${id}" class="header${centerClass}"${attrs}>${this.childs()}</div>`;
    }
}
ComponentFactory.register(Header);

export class Back extends BaseComponent {
    tag = 'back';
    canParent = ['header']; // Back может быть только внутри header

    render(): string {
        let attrs = this.getAttributes();
        const isInHeader = this.parent instanceof Header;
        const id = this.getId();

        // If href is not provided, check browser history
        if (!this.attributes['href'] && !this.runtime?.isServer) {
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element && !window.history.state && window.history.length <= 1) {
                    element.style.display = 'none';
                }
            }, 0);
        }

        let onClick = '';
        if (this.attributes['href']) {
            const encodedUrl = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, '${safeIds(this.attributes['target'])}'` : '';
            onClick = `tkmlr(${this.runtime?.getId()}).loader(this).go('${encodedUrl}'${target})`
        } else {
            onClick = `tkmlr(${this.runtime?.getId()}).loader(this); history.back()`;
        }

        if (isInHeader) {
            return `<div id="${id}" class="header-back" onclick="${onClick}"></div>`;
        }

        return `<button id="${id}" class="button back-button"${attrs} onclick="${onClick}">Back</button>`;
    }
}
ComponentFactory.register(Back);