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

        this.addRootPrefix(`<div class="menu-panel" id="menu-panel-${id}">
                <div class="menu-panel-content" id="menu-panel-${id}-content"></div>
            </div>
            <div class="menu-overlay" id="menu-overlay-${id}" onclick="tkmlr(${this.runtime?.getId()}).closeMenu('${id}')"></div>`)

        // Create menu button, panel and overlay using simplified runtime methods
        return `
            <div class="header-menu" onclick="tkmlr(${this.runtime?.getId()}).toggleMenu('${id}', '${encodeUrl(contentUrl)}')"${attrs}>${menuIcon}</div>
        `;
    }
}
ComponentFactory.register(Menu); 