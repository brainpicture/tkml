import { Runtime } from '../runtime';
import { encodeUrl, safeIds, safeAttr, resolveUrl } from '../util';

// Here we can add other components as they are created


// Base interface for all components
export interface Component {
    tag: string;
    id?: string;
    parent: Component | null;
    runtime?: Runtime;
    canParent?: string[] | null; // Список разрешенных родительских компонентов
    render(): string;
    renderChildren(children: Component[]): string;
    children: Component[];
    addChild(child: Component): void;
    getId(): string;
    getWrappingElement(element: HTMLElement): HTMLElement;
    onloadAdded?: boolean;
    selfClosing?: boolean;
    hasText?: boolean; // true if component can have text content
    addRootPrefix(html: string): void;
}

// Base class providing default implementation for addChild
export abstract class BaseComponent implements Component {
    private static counter = 0;
    abstract tag: string;
    public children: Component[] = [];
    public parent: Component | null = null;
    public runtime?: Runtime;
    protected attributes: Record<string, string>;
    public id?: string;
    public hasText?: boolean;
    canParent: string[] | null = null;
    constructor(attributes?: Record<string, string>) {
        this.attributes = attributes || {};
        if (this.attributes['id']) {
            this.id = safeIds(this.attributes['id']);
        }
    }

    addChild(child: Component): void {
        this.children.push(child);
        child.runtime = this.runtime;
        child.parent = this;
    }

    renderChildren(children: Component[]): string {
        return children.map((child) => {
            let str = child.render()
            return str;
        }).join('')
    }

    getId(): string {
        if (!this.id) {
            this.id = `${this.tag}-${this.runtime?.getId()}-${++BaseComponent.counter}`;
        }
        return this.id;
    }

    // Render only text from all children
    renderText(children: Component[]): string {
        return children
            .map(child => {
                if (child instanceof InnerText) {
                    return (child as InnerText).text;
                } else if (child instanceof BaseComponent) {
                    return (child as BaseComponent).renderText(child.children);
                }
                return '';
            })
            .join('');
    }

    addRootPrefix(html: string) {
        if (this.parent) {
            this.parent.addRootPrefix(html)
        } else {
            (this as unknown as Root).rootPrefix += html;
        }
    }

    // if this element is wrapping childs this function should return the wrapping element
    getWrappingElement(element: HTMLElement): HTMLElement {
        return element;
    }

    abstract render(): string;

    protected getAttributes(): string {
        let attrs = '';
        if (this.id) {
            attrs += ` id="${this.id}"`;
        }
        return attrs;
    }

    protected childs(): string {
        return this.renderChildren(this.children)
    }

    protected wrapChildrenInDivs(children: Component[], className: string, groupable?: boolean): string {
        let result = [];
        let currentGroup = [];

        for (let i = 0; i < children.length; i++) {
            const child = children[i];


            if (groupable && ['pill', 'b', 'i', '_text_'].includes(child.tag)) {
                let text = child.render();
                if (child instanceof InnerText && text.replace(/[\s ]/g, '') === '') {
                    continue
                }
                currentGroup.push(text);

            } else {
                // Для негруппируемых элементов рендерим как обычно
                if (child instanceof InnerText) {
                    let text = child.render();
                    if (text === '' || text.replace(/[\s ]/g, '') === '') {
                        continue;
                    }
                }

                if (currentGroup.length > 0) {
                    result.push(`<div class="${className}-item ${className}-group">${currentGroup.join('')}</div>`);
                    currentGroup = [];
                }
                result.push(`<div class="${className}-item ${className}-${child.tag}">${child.render()}</div>`);
            }
        }
        if (currentGroup.length > 0) {
            result.push(`<div class="${className}-item ${className}-group">${currentGroup.join('')}</div>`);
        }

        return result.join('');
    }
}


// Component factory
export class ComponentFactory {
    private static components: Map<string, new (...args: any[]) => Component> = new Map();

    static register(componentClass: new (...args: any[]) => Component) {
        // Создаем временный экземпляр для получения тега
        const instance = new componentClass({});
        this.components.set(instance.tag.toLowerCase(), componentClass);
    }

    static create(tag: string, attributes: Record<string, string>, runtime: Runtime, parent?: Component | null): Component {
        const ComponentClass = this.components.get(tag.toLowerCase());
        let component: Component;

        if (ComponentClass) {
            component = new ComponentClass(attributes);
            if (ComponentClass === Proxy) {
                component.tag = tag; // set tag for proxy component
            }
            if (component.canParent) {
                if (parent && !component.canParent.includes(parent.tag)) {
                    component = new Error(`Component <${tag}> cannot be a child of <${parent.tag}>`);
                }
            } else {
                if (parent && parent.tag !== 'tkml') {
                    component = new Error(`Component <${tag}> cannot be a child of <${parent.tag}>`);
                }
            }
        } else {
            component = new Undefined(tag, attributes);
        }

        component.runtime = runtime;
        return component;
    }

    static registerProxyComponent(tag: string) {
        let proxy = new Proxy(tag)
        proxy.tag = tag; // set tag is important here
        this.components.set(proxy.tag.toLowerCase(), Proxy);
    }
}

// Root is a holder for any other components, its <tkml> tag wich can be omited in the document
export class Root extends BaseComponent {
    tag = 'tkml';
    hasText = true;
    rootPrefix: string = '';

    constructor() {
        super();
    }

    render(): string {
        let childs = this.childs(); // now rootPrefix would be populated
        return `${this.rootPrefix}${childs}`;
    }
}
ComponentFactory.register(Root);

// Undefined component is used once an undefined tag is encountered
export class Proxy extends BaseComponent {
    tag = 'undefined';
    attributes: Record<string, string>;
    hasText = true;
    canParent = ['tkml', 'title', 'p', 'desc', 'section', 'pill', 'bubble', 'alert', 'text', 'info', 'box'];


    constructor(name: string, attributes?: Record<string, string>) {
        super(attributes);
        this.attributes = attributes || {};
    }


    render(): string {
        return `<${this.tag}>${this.childs()}</${this.tag}>`;
    }
}

// Undefined component is used once an undefined tag is encountered
export class Undefined extends BaseComponent {
    tag = 'undefined';
    private name: string;

    constructor(name: string, attributes?: Record<string, string>) {
        super(attributes);
        this.name = safeIds(name);
    }

    render(): string {
        return `<div class="undefined"><div class="error">Undefined component: ${this.name}</div></div>`;
    }
}

// Undefined component is used once an undefined tag is encountered
export class Error extends BaseComponent {
    tag = 'error';
    private error: string;

    constructor(error: string, attributes?: Record<string, string>) {
        super(attributes);
        this.error = safeAttr(error);
    }

    render(): string {
        return `<div class="panic"><div class="error">Error: ${this.error}</div></div>`;
    }
}

// Title stands for <title> tag, has no attributes yet
export class Title extends BaseComponent {
    tag = 'title';
    canParent = ['tkml', 'section', 'bubble', 'info'];
    hasText = true;

    constructor(attributes?: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        let attrs = this.getAttributes();
        let centerClass = this.attributes['center'] !== undefined ? ' center' : '';

        return `<div class="title${centerClass}"${attrs}>${this.childs()}</div>`;
    }
}
ComponentFactory.register(Title);

// Alert allows you to render alert messages styled variously
export class Alert extends BaseComponent {
    tag = 'alert';
    hasText = true;

    constructor(attributes?: Record<string, string>) {
        super(attributes);
    }
    renderChildren(children: Component[]): string {
        return this.renderText(children);
    }
    render(): string {
        return `<div class="alert"${this.getAttributes()}>${this.childs()}</div>`;
    }
}
ComponentFactory.register(Alert);

// Inner tag for text fields
export class InnerText extends BaseComponent {
    tag = '_text_';
    text: string;

    constructor(text: string) {
        super();
        this.text = text;
    }

    render(): string {
        return this.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
}

export class List extends BaseComponent {
    tag = 'list';
    canParent = ['tkml'];

    constructor(attributes?: Record<string, string>) {
        super(attributes);
    }

    getWrappingElement(element: HTMLElement): HTMLElement {
        return element.parentNode as HTMLElement;
    }

    renderChildren(children: Component[]): string {
        return this.wrapChildrenInDivs(children, 'list')
    }

    render(): string {
        return `<div class="list"${this.getAttributes()}>${this.childs()}</div>`;
    }
}

ComponentFactory.register(List);


export class Code extends BaseComponent {
    tag = 'code';
    content: string = '';

    constructor(attributes?: Record<string, string>) {
        super(attributes);
    }

    setContent(content: string) {
        this.content = content;
    }

    renderChildren(children: Component[]): string {
        return this.renderText(children);
    }

    render(): string {
        const language = this.attributes['lang'];
        const code = this.content.trim();
        const elementId = this.getId();

        // Start loading highlight.js if needed
        this.runtime?.onInit('highlightElement', elementId);

        // Return initial markup with plain code
        const languageClass = language ? ` language-${safeAttr(language)}` : '';
        return `<pre class="code"><code class="hljs ${languageClass}" id="${elementId}">${safeAttr(code)}</code></pre>`;
    }
}

ComponentFactory.register(Code);

export class Info extends BaseComponent {
    tag = 'info';
    canParent = ['tkml'];
    hasText = true;

    renderChildren(children: Component[]): string {
        return this.wrapChildrenInDivs(children, this.tag, true);
    }

    render(): string {
        return `<div class="info"${this.getAttributes()}>${this.childs()}</div>`;
    }
}

ComponentFactory.register(Info);


export class Section extends BaseComponent {
    tag = 'section';
    canParent = ['list', 'info', 'tkml'];
    hasImage: boolean = false;
    hasText = true;

    getWrappingElement(element: HTMLElement): HTMLElement {
        return element.parentNode as HTMLElement;
    }

    // Helper method to get common classes
    protected getCommonClasses(): {
        clickableClass: string,
        disabledClass: string,
        imageClass: string
    } {
        const isDisabled = this.attributes['disabled'] !== undefined;
        const clickableClass = isDisabled ? '' : ' clickable';
        const disabledClass = isDisabled ? ' disabled' : '';
        const imageClass = this.hasImage ? ' with-image' : '';

        return { clickableClass, disabledClass, imageClass };
    }

    // Helper method to add href attributes
    protected addHrefAttributes(attrs: string): string {
        const isDisabled = this.attributes['disabled'] !== undefined;

        // Don't add href functionality if disabled
        if (isDisabled) return attrs;

        if (this.attributes['external'] !== undefined && this.attributes['href']) {
            // External link handling is done in render method
            return attrs;
        }
        else if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, '${safeIds(this.attributes['target'])}'` : '';
            attrs += ` onclick="tkmlr(${this.runtime?.getId()}).loader(this).go('${url}'${target})"`;

            if (this.attributes['preload'] === 'true') {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }
        else if (this.parent?.tag === 'dropdown') {
            // No additional attributes needed for dropdown children
        }

        return attrs;
    }

    render(): string {
        let childs = this.childs(); // should be called here to affect parent

        let attrs = this.getAttributes();
        let icon = '';

        // Get common classes
        const { clickableClass, disabledClass, imageClass } = this.getCommonClasses();

        // Handle external links
        if (this.attributes['external'] !== undefined && this.attributes['href']) {
            const url = this.attributes['href'];
            const target = this.attributes['target'] ? ` target="${safeAttr(this.attributes['target'])}"` : '';

            return `
                <a href="${safeAttr(url)}"${target} class="section${clickableClass}${disabledClass}${imageClass}"${attrs}>
                    <div class="section-content">${childs}</div>
                    <div class="section-arrow"></div>
                </a>
            `;
        }

        // Add href attributes
        attrs = this.addHrefAttributes(attrs);

        if (this.attributes['icon']) {
            const iconUrl = resolveUrl(this.attributes['icon'], this.runtime);
            icon = `<img class="section-icon" src="${iconUrl}" alt="icon"/>`;
        } else if (this.attributes['href']) {
            icon = '<div class="section-arrow"></div>';
        }

        return `
            <div class="section${clickableClass}${disabledClass}${imageClass}"${attrs}>
                <div class="section-content">${childs}</div>
                ${icon}
            </div>
        `;
    }
}
ComponentFactory.register(Section);

export class Loader extends BaseComponent {
    tag = 'loader';
    hasText = true;
    canParent = ['tkml', 'list', 'info'];

    render(): string {
        const id = this.getId();

        if (this.attributes['href']) {
            setTimeout(() => {

                if (this.runtime) {
                    this.runtime.observeLoader(this, this.attributes['href']);
                }
            }, 0);
        }

        return `
            <div id="${id}" class="loader">
                <div class="loader-spinner"></div>
            </div>
        `;
    }
}
ComponentFactory.register(Loader);

export class Bubble extends BaseComponent {
    tag = 'bubble';
    hasText = true;

    render(): string {
        const type = this.attributes['type'] || 'in';
        const bubbleClass = `bubble-${type}`;
        let attrs = this.getAttributes();

        return `
            <div class="bubble ${bubbleClass}"${attrs}>
                <div class="bubble-header">
                    <div class="bubble-avatar">
                        ${this.renderAvatar()}
                    </div>
                    <div class="bubble-title">
                        ${this.renderTitle()}
                    </div>
                </div>
                <div class="bubble-content">
                    ${this.renderContent()}
                </div>
            </div>
        `;
    }

    private renderAvatar(): string {
        const imgComponent = this.children.find(child => child.tag === 'img');
        return imgComponent ? imgComponent.render() : '';
    }

    private renderTitle(): string {
        const titleComponent = this.children.find(child => child.tag === 'title');
        return titleComponent ? titleComponent.render() : '';
    }

    private renderContent(): string {
        return this.children
            .filter(child => !['img', 'title'].includes(child.tag))
            .map(child => child.render())
            .join('');
    }
}

ComponentFactory.register(Bubble);

export class Label extends BaseComponent {
    tag = 'label';
    hasText = true;

    render(): string {
        let attrs = this.getAttributes();
        return `<div class="label"${attrs}>${this.childs()}</div>`;
    }
}
ComponentFactory.register(Label);

export class Msg extends BaseComponent {
    tag = 'msg';
    hasText = true;

    render(): string {
        let attrs = this.getAttributes();
        const type = this.attributes['type'] || 'info';
        const msgClass = `msg-${type}`;

        return `<div class="msg ${msgClass}"${attrs}>
            <div class="msg-icon"></div>
            <div class="msg-content">${this.childs()}</div>
        </div>`;
    }
}
ComponentFactory.register(Msg);

// Import of all other components
import './navigation';
import './typography';
import './img';
import './header';
import './footer';
import './menu';
import './button';
import './a';
import './radio';
import './checkbox';
import './dropdown';
import './bar';
import './input';
import './textarea';
import './quote';
import './box';
import './center';
import './autoupdate';