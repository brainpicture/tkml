import { BaseComponent, ComponentFactory } from '../components';
import { encodeUrl, safeIds, safeAttr } from '../util';

export class Button extends BaseComponent {
    tag = 'button';
    hasText = true;

    render(): string {
        let attrs = this.getAttributes();
        let style = '';
        let secondaryClass = this.attributes['type'] === 'secondary' ? ' secondary' : '';

        if (this.attributes['width']) {
            const width = this.attributes['width'];
            style = ` style="width: ${width.match(/^\d+$/) ? width + 'px' : width}"`;
        }

        const validation = this.attributes['required']
            ? `.validateFields('${safeIds(this.attributes['required'])}')`
            : '';

        // Handle external links
        if (this.attributes['external'] !== undefined && this.attributes['href']) {
            const url = this.attributes['href'];
            const target = this.attributes['target'] ? ` target="${safeAttr(this.attributes['target'])}"` : '';

            // Convert button to an anchor for external links
            return `<a href="${safeAttr(url)}"${target} class="button${secondaryClass}"${attrs}${style}>${this.childs()}</a>`;
        }
        // Handle post parameter
        else if (this.attributes['post']) {
            let url;
            if ('href' in this.attributes) {
                url = "'" + encodeUrl(this.attributes['href']) + "'";
            } else {
                url = 'null';
            }
            const target = this.attributes['target'] ? `, '${safeIds(this.attributes['target'])}'` : '';

            // Use loadPost which now handles parsing internally
            attrs += ` onclick="tkmlr(${this.runtime?.getId()})${validation}.loader(this).loadPost(${url}, '${safeAttr(this.attributes['post'])}'${target})"`;
        }
        // Regular href handling if post is not specified
        else if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, true, '${safeIds(this.attributes['target'])}'` : '';

            attrs += ` onclick="tkmlr(${this.runtime?.getId()})${validation}.loader(this).go('${url}'${target})"`;

            // Обновленная проверка preload (как флаг или со значением "true")
            if (this.attributes['preload'] !== undefined && this.attributes['preload'] !== "false") {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }

        return `<button class="button${secondaryClass}"${attrs}${style}>${this.childs()}</button>`;
    }
}
ComponentFactory.register(Button);