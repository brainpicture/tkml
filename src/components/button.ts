import { BaseComponent, ComponentFactory } from '../components';
import { encodeUrl, safeIds, safeAttr, getComponentHandler } from '../util';

export class Button extends BaseComponent {
    tag = 'button';
    hasText = true;
    canParent = ['tkml', 'info', 'list', 'footer', 'center'];

    render(): string {
        let attrs = this.getAttributes();
        let style = '';
        let secondaryClass = this.attributes['type'] === 'secondary' ? ' secondary' : '';

        if (this.attributes['width']) {
            const width = this.attributes['width'];
            style = ` style="width: ${width.match(/^\d+$/) ? width + 'px' : width}"`;
        }

        // Handle external links
        if (this.attributes['external'] !== undefined && this.attributes['href']) {
            const url = this.attributes['href'];
            const target = this.attributes['target'] ? ` target="${safeAttr(this.attributes['target'])}"` : '';

            // Convert button to an anchor for external links
            const buttonHtml = `<a href="${safeAttr(url)}"${target} class="button${secondaryClass}"${attrs}${style}>${this.childs()}</a>`;

            // Center the button if center attribute is set
            if (this.attributes['center'] !== undefined) {
                return `<div class="center-container">${buttonHtml}</div>`;
            }

            return buttonHtml;
        }

        // Используем универсальную функцию для обработки post/href/required
        attrs += getComponentHandler(this.runtime?.getId(), this.attributes, {
            validationField: 'required',  // Передаем параметр для поля required
            updatePreload: true           // Включаем обработку предзагрузки
        });

        // Обрабатываем предзагрузку, если есть href и preload
        if (this.attributes['href'] && this.attributes['preload'] !== undefined && this.attributes['preload'] !== "false") {
            setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
        }

        const buttonHtml = `<button class="button${secondaryClass}"${attrs}${style}>${this.childs()}</button>`;

        // Center the button if center attribute is set
        if (this.attributes['center'] !== undefined) {
            return `<div class="center-container">${buttonHtml}</div>`;
        }

        return buttonHtml;
    }
}
ComponentFactory.register(Button);