import { BaseComponent, ComponentFactory } from './index';
import { safeAttr, encodeUrl, safeIds, getComponentHandler } from '../util';

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

        // Используем универсальную функцию с компонент-специфичными действиями для checkbox
        const checkboxActions = "this.classList.toggle('checked'); this.style.opacity='0.5'; ";

        attrs += getComponentHandler(this.runtime?.getId(), this.attributes, {
            componentActions: checkboxActions,  // Добавляем специфичные для checkbox действия
            updatePreload: true                 // Включаем обработку предзагрузки
        });

        // Если нет post или href, просто добавляем переключение checked
        if (!this.attributes['post'] && !this.attributes['href']) {
            attrs += ` onclick="this.classList.toggle('checked')"`;
        }

        // Обрабатываем предзагрузку, если есть href и preload
        if (this.attributes['href'] && this.attributes['preload'] === 'true') {
            setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
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