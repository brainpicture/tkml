import { BaseComponent, ComponentFactory, Component } from '../components';
import { encodeUrl, safeIds, safeAttr, resolveUrl } from '../util';

// Create Tab component
export class Tab extends BaseComponent {
    tag = 'tab';
    canParent = ['bar']; // Can only be used inside bar
    hasText = true;

    render(): string {
        let attrs = this.getAttributes();
        const id = this.getId();
        const isActive = this.attributes['active'] !== undefined || this.attributes['selected'] !== undefined;
        const isDisabled = this.attributes['disabled'] !== undefined;
        const icon = this.attributes['icon'] || '';
        const tabId = `tab-${id}`;

        // Add active and disabled classes if needed
        const activeClass = isActive ? ' active' : '';
        const disabledClass = isDisabled ? ' disabled' : '';

        // Handle icon if present
        let iconHtml = '';
        if (icon) {
            const iconUrl = resolveUrl(icon, this.runtime);
            iconHtml = `<img class="tab-icon" src="${iconUrl}" alt="icon">`;
        }

        // Add href functionality
        if (this.attributes['href'] && !isDisabled) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, '${safeIds(this.attributes['target'])}'` : '';
            attrs += ` onclick="tkmlr(${this.runtime?.getId()}).loader(this).go('${url}'${target}); return false;"`;

            if (this.attributes['preload'] === 'true') {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }

        return `
            <div id="${tabId}" class="tab${activeClass}${disabledClass}"${attrs}>
                ${iconHtml}
                <span class="tab-text">${this.childs()}</span>
            </div>
        `;
    }
}

// Create Bar component
export class Bar extends BaseComponent {
    tag = 'bar';
    canParent = ['tkml'];

    render(): string {
        let attrs = this.getAttributes();
        const id = this.getId();
        const barId = `bar-${id}`;

        // Add initialization code
        this.runtime?.onInit('initializeTabBar', barId);

        return `
            <div id="${barId}" class="tab-bar"${attrs}>
                <div class="tab-bar-content">
                    ${this.childs()}
                </div>
            </div>
        `;
    }
}

// Register components
ComponentFactory.register(Tab);
ComponentFactory.register(Bar); 