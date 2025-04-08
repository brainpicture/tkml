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
        if (this.attributes['src']) {
            contentUrl = this.attributes['src'];
        }

        // Initialize menu in browser environment
        this.runtime?.onInit('initializeMenu', id, contentUrl);

        // Create menu button
        return `
            <div class="header-menu" onclick="tkmlr(${this.runtime?.getId()}).toggleMenu('${id}', '${encodeUrl(contentUrl)}')"${attrs}>${menuIcon}</div>
        `;
    }
}
ComponentFactory.register(Menu); 