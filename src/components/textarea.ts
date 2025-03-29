import { BaseComponent, ComponentFactory } from '../components';
import { safeAttr, encodeUrl } from '../util';

export class Textarea extends BaseComponent {
    tag = 'textarea';
    hasText = true;

    render(): string {
        let attrs = this.getAttributes();
        if (this.attributes['placeholder']) {
            attrs += ` placeholder="${safeAttr(this.attributes['placeholder'])}"`;
        }
        if (this.attributes['rows']) {
            attrs += ` rows="${parseInt(this.attributes['rows'])}"`;
        }
        if (this.attributes['name']) {
            attrs += ` name="${safeAttr(this.attributes['name'])}"`;
        }

        // Add disabled attribute if present
        const isDisabled = this.attributes['disabled'] !== undefined;
        if (isDisabled) {
            attrs += ` disabled`;
        }

        // Get default content from children
        const defaultContent = this.renderText(this.children);

        // Add validation if needed (only if not disabled)
        const validationScript = !isDisabled && this.attributes['required'] ?
            ` oninput="this.parentElement.classList.toggle('invalid', !this.checkValidity())" required` : '';

        // Add form submission handler (only if not disabled)
        if (!isDisabled && this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const paramName = this.attributes['name'] || 'textarea';
            attrs += ` onkeydown="if(event.key==='Enter' && event.ctrlKey){tkmlr(${this.runtime?.getId()}).loader(this.parentElement).post('${url}', {${safeAttr(paramName)}: this.value}, 'application/json')}"`;
        }

        // Add disabled class to wrapper if needed
        const disabledClass = isDisabled ? ' disabled' : '';

        return `<div class="input-wrapper${disabledClass}"><textarea class="textarea"${attrs}${validationScript}>${safeAttr(defaultContent)}</textarea><div class="input-spinner"></div></div>`;
    }
}
ComponentFactory.register(Textarea);