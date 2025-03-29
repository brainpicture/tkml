import { BaseComponent, ComponentFactory } from './index';
import { safeAttr, encodeUrl, safeIds } from '../util';

export class Checkbox extends BaseComponent {
    tag = 'checkbox';
    hasText = true;
    canParent = ['list', 'info', 'tkml'];

    constructor(attributes: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        let attrs = this.getAttributes();

        // Handle external links
        if (this.attributes['external'] !== undefined && this.attributes['href']) {
            const url = this.attributes['href'];
            const target = this.attributes['target'] ? ` target="${safeAttr(this.attributes['target'])}"` : '';

            const isChecked = this.attributes['checked'] !== undefined;
            const checkedClass = isChecked ? ' checked' : '';
            const checkedAttr = isChecked ? ' checked="checked"' : '';

            attrs += ` onclick="this.classList.toggle('checked'); this.style.opacity='0.5';"`;

            return `
                <a href="${safeAttr(url)}"${target} class="checkbox${checkedClass}"${checkedAttr}${attrs}>
                    <div class="checkbox-label">${this.childs()}</div>
                    <div class="checkbox-toggle">
                        <div class="checkbox-slider"></div>
                    </div>
                </a>
            `;
        }
        else if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, '${safeIds(this.attributes['target'])}'` : '';
            attrs += ` onclick="this.classList.toggle('checked'); this.style.opacity='0.5'; tkmlr(${this.runtime?.getId()}).loader(this).go('${url}', true${target})"`;
            if (this.attributes['preload'] === 'true') {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        } else {
            attrs += ` onclick="this.classList.toggle('checked')"`;
        }

        const isChecked = this.attributes['checked'] !== undefined;
        const checkedClass = isChecked ? ' checked' : '';
        const checkedAttr = isChecked ? ' checked="checked"' : '';

        return `
            <div class="checkbox${checkedClass}"${checkedAttr}${attrs}>
                <div class="checkbox-label">${this.childs()}</div>
                <div class="checkbox-toggle">
                    <div class="checkbox-slider"></div>
                </div>
            </div>
        `;
    }
}
ComponentFactory.register(Checkbox);