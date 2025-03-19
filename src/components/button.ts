import { BaseComponent, ComponentFactory } from '../components';
import { encodeUrl, safeIds, safeAttr } from '../util';

export class Button extends BaseComponent {
    tag = 'button';

    render(): string {
        let attrs = this.getAttributes();
        let style = '';
        let secondaryClass = this.attributes['type'] === 'secondary' ? ' secondary' : '';

        if (this.attributes['width']) {
            const width = this.attributes['width'];
            style = ` style="width: ${width.match(/^\d+$/) ? width + 'px' : width}"`;
        }

        // Handle post parameter
        if (this.attributes['post']) {
            const postQueryString = safeAttr(this.attributes['post']);
            let url;
            if ('href' in this.attributes) {
                url = "'" + encodeUrl(this.attributes['href']) + "'";
            } else {
                url = 'null';
            }
            const target = this.attributes['target'] ? `, '${safeIds(this.attributes['target'])}'` : '';

            const validation = this.attributes['required']
                ? `.validateFields('${safeIds(this.attributes['required'])}')`
                : '';

            // Use runtime method to parse querystring
            attrs += ` onclick="tkmlr(${this.runtime?.getId()})${validation}.loader(this).loadPost(${url}, '${postQueryString}'${target})"`;
        }
        // Regular href handling if post is not specified
        else if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, true, '${safeIds(this.attributes['target'])}'` : '';

            const validation = this.attributes['required']
                ? `.validateFields('${safeIds(this.attributes['required'])}')`
                : '';

            attrs += ` onclick="tkmlr(${this.runtime?.getId()})${validation}.loader(this).go('${url}'${target})"`;

            if (this.attributes['preload'] === 'true') {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }

        return `<button class="button${secondaryClass}"${attrs}${style}>${this.childs()}</button>`;
    }
}
ComponentFactory.register(Button);