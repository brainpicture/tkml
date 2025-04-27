import { BaseComponent, ComponentFactory } from '../components';
import { encodeUrl, resolveUrl } from '../util';

export class Menu extends BaseComponent {
    tag = 'menu';
    canParent = ['header']; // Menu can only be inside header
    selfClosing = true;

    render(): string {
        let attrs = this.getAttributes();
        const id = this.getId();
        const isRightMenu = this.attributes['right'] !== undefined;
        const menuSide = isRightMenu ? 'right' : 'left';

        if (this.runtime) {
            // Set the appropriate menu trigger ID based on position
            if (isRightMenu) {
                this.runtime.rightMenuTriggerId = id;
            } else {
                this.runtime.leftMenuTriggerId = id;
            }
        }

        // Default sandwich icon SVG or custom icon from attribute
        let menuIcon;
        if (this.attributes['icon']) {
            const iconUrl = resolveUrl(this.attributes['icon'], this.runtime);
            menuIcon = `<img class="menu-icon" src="${iconUrl}" alt="menu icon"/>`;
        } else {
            menuIcon = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
        }

        let contentUrl = '';
        if (this.attributes['src']) {
            contentUrl = this.attributes['src'];
        }

        // Initialize menu in browser environment
        this.runtime?.onInit('initializeMenu', id, contentUrl, menuSide);

        // Create menu button with appropriate class
        return `
            <div class="header-menu header-menu-${menuSide}" onclick="tkmlr(${this.runtime?.getId()}).toggleMenu('${id}', '${encodeUrl(contentUrl)}', '${menuSide}')"${attrs}>${menuIcon}</div>
        `;
    }
}
ComponentFactory.register(Menu); 