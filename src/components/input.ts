import { BaseComponent, ComponentFactory } from '../components';
import { encodeUrl, safeAttr } from '../util';

export class Input extends BaseComponent {
    tag = 'input';
    canParent = ['section', 'list', 'info', 'tkml', 'footer'];

    render(): string {
        let attrs = this.getAttributes();
        const type = this.attributes['type'] || 'text';

        // Add basic attributes
        //attrs += ` type="${type == 'search' ? 'text' : type}"`;
        attrs += ` type="${type}"`;
        attrs += this.attributes['placeholder'] ? ` placeholder="${safeAttr(this.attributes['placeholder'])}"` : '';
        attrs += this.attributes['value'] ? ` value="${safeAttr(this.attributes['value'])}"` : '';
        attrs += this.attributes['name'] ? ` name="${safeAttr(this.attributes['name'])}"` : '';

        // Add validation attributes based on type
        if (type === 'email') {
            attrs += ` pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"`;
        } else if (type === 'tel') {
            attrs += ` pattern="^\\+?[1-9]\\d{1,14}$"`;
        }

        // Add real-time validation
        const validationScript = type !== 'password' ?
            ` oninput="this.parentElement.classList.toggle('invalid', !this.checkValidity())"` : '';

        // Add form submission handler
        if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const paramName = this.attributes['name'] || 'input';
            attrs += ` onkeydown="if(event.key==='Enter' && this.checkValidity()){tkmlr(${this.runtime?.getId()}).loader(this.parentElement).post('${url}', {${safeAttr(paramName)}: this.value})}"`;
        }

        return `<div class="input-wrapper${type === 'search' ? ' search' : ''}"><input class="input"${attrs}${validationScript}/><div class="input-spinner"></div></div>`;
    }
}

ComponentFactory.register(Input);