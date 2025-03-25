import { BaseComponent, ComponentFactory } from '../components';
import { encodeUrl, safeAttr } from '../util';

export class Input extends BaseComponent {
    tag = 'input';

    render(): string {
        let attrs = this.getAttributes();
        if (this.attributes['placeholder']) {
            attrs += ` placeholder="${this.attributes['placeholder']}"`;
        }
        if (this.attributes['value']) {
            attrs += ` value="${safeAttr(this.attributes['value'])}"`;
        }
        if (this.attributes['type']) {
            attrs += ` type="${safeAttr(this.attributes['type'])}"`;
        }
        if (this.attributes['name']) {
            attrs += ` name="${safeAttr(this.attributes['name'])}"`;
        }

        if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const paramName = this.attributes['name'] || 'input';
            attrs += ` onkeydown="if(event.key==='Enter'){tkmlr(${this.runtime?.getId()}).loader(this.parentElement).post('${url}', {${safeAttr(paramName)}: this.value})}"`;
        }

        return `<div class="input-wrapper"><input class="input"${attrs}/><div class="input-spinner"></div></div>`;
    }
}

ComponentFactory.register(Input);