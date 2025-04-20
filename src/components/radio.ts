import { BaseComponent, ComponentFactory } from '../components';
import { encodeUrl, safeIds, safeAttr, getComponentHandler } from '../util';

export class Radio extends BaseComponent {
    tag = 'radio';
    hasText = true;
    canParent = ['list', 'info', 'tkml']

    render(): string {
        let attrs = this.getAttributes();
        const group = this.attributes['group'] || '';
        const isDisabled = this.attributes['disabled'] !== undefined;

        if (!isDisabled) {
            // Base radio action that deselects other radios in the same group
            const radioActions = `document.querySelectorAll('.radio[data-group=\\'${group}\\']').forEach(r => r.classList.remove('checked')); this.classList.add('checked'); this.style.opacity='0.5'; `;

            // Handle post and href with component-specific behavior
            if (this.attributes['post'] || this.attributes['href']) {
                attrs += getComponentHandler(this.runtime?.getId(), this.attributes, {
                    componentActions: radioActions,
                    updatePreload: true
                });
            } else {
                // Just group selection behavior without navigation or post
                attrs += ` onclick="${radioActions}"`;
            }

            // Preload content if needed
            if (this.attributes['href'] && this.attributes['preload'] !== undefined && this.attributes['preload'] !== "false") {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }

        const isChecked = this.attributes['checked'] !== undefined;
        const checkedClass = isChecked ? ' checked' : '';
        const disabledClass = isDisabled ? ' disabled' : '';
        const checkedAttr = isChecked ? ' checked="checked"' : '';
        const disabledAttr = isDisabled ? ' disabled="disabled"' : '';

        if (this.attributes['value']) {
            attrs += ` value="${this.attributes['value']}"`;
        } else {
            attrs += ` value="${safeIds(this.childs())}"`;
        }

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