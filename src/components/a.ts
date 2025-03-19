import { BaseComponent, ComponentFactory, Component } from '../components';
import { encodeUrl, safeIds, safeAttr } from '../util';

export class A extends BaseComponent {
    tag = 'a';

    renderChildren(children: Component[]): string {
        return this.renderText(children);
    }

    render(): string {
        let attrs = this.getAttributes();

        // Handle post parameter
        if (this.attributes['post']) {
            const postQueryString = safeAttr(this.attributes['post']);
            const url = this.attributes['href'] ? encodeUrl(this.attributes['href']) : '';
            const target = this.attributes['target'] ? `, '${safeIds(this.attributes['target'])}'` : '';

            attrs += ` onclick="event.preventDefault(); tkmlr(${this.runtime?.getId()}).loader(this).loadPost('${url}', '${postQueryString}'${target})"`;

            if (this.attributes['href']) {
                attrs += ` href="javascript:void(0);"`;
            }
        }
        // Regular href handling if post is not specified
        else if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, true, '${safeIds(this.attributes['target'])}'` : '';

            attrs += ` onclick="event.preventDefault(); tkmlr(${this.runtime?.getId()}).loader(this).go('${url}'${target})"`;
            attrs += ` href="javascript:void(0);"`;

            if (this.attributes['preload'] === 'true') {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }

        return `<a${attrs}>${this.childs()}</a>`;
    }
}
ComponentFactory.register(A); 