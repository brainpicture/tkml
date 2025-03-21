import { BaseComponent, ComponentFactory } from '../components';
import { safeAttr, resolveUrl } from '../util';

export class Img extends BaseComponent {
    tag = 'img';
    selfClosing = true;

    constructor(attributes: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        let attrs = this.getAttributes();
        let style = '';
        let circleClass = this.attributes['circle'] !== undefined ? ' circle' : '';

        if (this.attributes['src']) {
            const imgUrl = resolveUrl(this.attributes['src'], this.runtime);
            attrs += ` src="${safeAttr(imgUrl)}"`;
        }
        if (this.attributes['alt']) {
            attrs += ` alt="${safeAttr(this.attributes['alt'])}"`;
        }
        if (this.attributes['height']) {
            style = ` style="--img-height: ${parseInt(this.attributes['height'])}px"`;
        }

        // If parent is a section, mark it as having an image
        if (this.parent && this.parent.tag === 'section') {
            (this.parent as any).hasImage = true;
        }

        return `<img class="img${circleClass}"${attrs}${style}/>`;
    }
}

ComponentFactory.register(Img);