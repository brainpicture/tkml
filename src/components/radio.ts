import { BaseComponent, ComponentFactory } from '../components';
import { encodeUrl } from '../util';

export class Radio extends BaseComponent {
    tag = 'radio';
    hasText = true;
    canParent = ['list', 'info', 'tkml']

    render(): string {
        let attrs = this.getAttributes();
        const group = this.attributes['group'] || '';
        const isDisabled = this.attributes['disabled'] !== undefined;

        if (!isDisabled) {
            if (this.attributes['href']) {
                const url = encodeUrl(this.attributes['href']);
                const target = this.attributes['target'] ? `, '${this.attributes['target']}'` : '';
                attrs += ` onclick="
                    document.querySelectorAll('.radio[data-group=\\'${group}\\']').forEach(r => r.classList.remove('checked'));
                    this.classList.add('checked');
                    this.style.opacity='0.5';
                    tkmlr(${this.runtime?.getId()}).loader(this).go('${url}', true${target})
                "`;
            } else {
                attrs += ` onclick="
                    document.querySelectorAll('.radio[data-group=\\'${group}\\']').forEach(r => r.classList.remove('checked'));
                    this.classList.add('checked')
                "`;
            }
        }

        const isChecked = this.attributes['checked'] !== undefined;
        const checkedClass = isChecked ? ' checked' : '';
        const disabledClass = isDisabled ? ' disabled' : '';
        const checkedAttr = isChecked ? ' checked="checked"' : '';
        const disabledAttr = isDisabled ? ' disabled="disabled"' : '';

        return `
            <div class="radio${checkedClass}${disabledClass}"${checkedAttr}${disabledAttr}${attrs} data-group="${group}">
                <div class="radio-label">${this.childs()}</div>
                <div class="radio-toggle">
                    <div class="radio-dot"></div>
                </div>
            </div>
        `;
    }
}
ComponentFactory.register(Radio);