import { BaseComponent, ComponentFactory } from '../components';
import { encodeUrl } from '../util';

export class Menu extends BaseComponent {
    tag = 'menu';
    canParent = ['header']; // Menu can only be inside header
    selfClosing = true;

    render(): string {
        let attrs = this.getAttributes();
        const id = this.getId();



        // Sandwich icon SVG
        const menuIcon = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;

        let contentUrl = '';
        if (this.attributes['href']) {
            contentUrl = this.attributes['href'];
        }

        // Initialize menu in browser environment
        if (this.runtime && this.runtime.isBrowser) {
            this.runtime.leftMenuTriggerId = id;
            setTimeout(() => {
                this.runtime?.initializeMenu(id, contentUrl);
            }, 0);
        } else if (this.runtime) {
            // Add script for server-side rendering
            this.runtime.onload.push(`
                (function() {
                    tkmlr(${this.runtime.getId()}).initializeMenu('${id}', '${encodeUrl(contentUrl)}');
                })();
            `);
        }

        // Create menu button
        return `
            <div class="header-menu" onclick="tkmlr(${this.runtime?.getId()}).toggleMenu('${id}', '${encodeUrl(contentUrl)}')"${attrs}>${menuIcon}</div>
        `;
    }
}
ComponentFactory.register(Menu); 