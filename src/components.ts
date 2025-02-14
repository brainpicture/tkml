import { Runtime } from './runtime';
// Add at the top of the file
function encodeUrl(url: string): string {
    return encodeURIComponent(url).replace(/["']/g, match => match === '"' ? '&quot;' : '&#39;');
}

// Base interface for all components
export interface Component {
    tag: string;
    id?: string;
    parent: Component | null;
    runtime?: Runtime;
    render(): string;
    addChild(child: Component): void;
}

// Base class providing default implementation for addChild
export abstract class BaseComponent implements Component {
    private static counter = 0;
    abstract tag: string;
    protected children: Component[] = [];
    public parent: Component | null = null;
    public runtime?: Runtime;
    protected attributes: Record<string, string>;
    public id?: string;
    constructor(attributes?: Record<string, string>) {
        this.attributes = attributes || {};
        if (this.attributes['id']) {
            this.id = this.attributes['id'];
        }
    }

    addChild(child: Component): void {
        this.children.push(child);
        child.runtime = this.runtime;
        child.parent = this;
    }

    renderChildren(): string {
        return this.children.map((child) => {
            let str = child.render()
            return str;
        }).join('')

    }
    // Render only text from all children
    renderText(): string {
        return this.children
            .map(child => {
                if (child instanceof Text) {
                    return (child as Text).text;
                } else if (child instanceof BaseComponent) {
                    return (child as BaseComponent).renderText();
                }
                return '';
            })
            .join('');
    }

    abstract render(): string;

    protected getAttributes(): string {
        let attrs = '';
        if (this.id) {
            attrs += ` id="${this.id}"`;
        }
        return attrs;
    }

    protected getId(): string {
        return this.id || `${this.tag}-${this.runtime?.getId()}-${++BaseComponent.counter}`;
    }

    protected wrapChildrenInDivs(className: string): string {
        return this.children
            .map((child) => {
                if (child instanceof Text) {
                    let text = child.render().trim()
                    if (text === '') {
                        return ''
                    }
                }
                return `<div class="${className} info-${child.tag}">${child.render()}</div>`
            })
            .join('');
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

    static create(tag: string, attributes: Record<string, string>, runtime: Runtime): Component {
        const ComponentClass = this.components.get(tag.toLowerCase());
        let component: Component;
        if (ComponentClass) {
            component = new ComponentClass(attributes);
            if (ComponentClass === Proxy) {
                component.tag = tag; // set tag for proxy component
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

// Undefined component is used once an undefined tag is encountered
export class Proxy extends BaseComponent {
    tag = 'undefined';
    attributes: Record<string, string>;

    constructor(name: string, attributes?: Record<string, string>) {
        super(attributes);
        this.attributes = attributes || {};
    }


    render(): string {
        return `<${this.tag}>${this.renderChildren()}</${this.tag}>`;
    }
}

// Undefined component is used once an undefined tag is encountered
export class Undefined extends BaseComponent {
    tag = 'undefined';
    private name: string;

    constructor(name: string, attributes?: Record<string, string>) {
        super(attributes);
        this.name = name;
    }

    render(): string {
        return `<div class="undefined"><div class="error">Undefined component: ${this.name}</div></div>`;
    }
}

// Title stands for <title> tag, has no attributes yet
export class Title extends BaseComponent {
    tag = 'title';

    constructor(attributes?: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        return `<h1 class="title"${this.getAttributes()}>${this.renderChildren()}</h1>`;
    }
}
ComponentFactory.register(Title);

// Alert allows you to render alert messages styled variously
export class Alert extends BaseComponent {
    tag = 'alert';

    constructor(attributes?: Record<string, string>) {
        super(attributes);
    }
    render(): string {
        let text = this.renderText();
        if (text) {
            return `<div class="alert"${this.getAttributes()}>${text}</div>`;
        }
        return '';
    }
}
ComponentFactory.register(Alert);

// Title stands for <title> tag, has no attributes yet
export class Text extends BaseComponent {
    tag = 'text';
    text: string;

    constructor(text: string) {
        super();
        this.text = text;
    }

    render(): string {
        return `${this.text}`;
    }
}

export class Desc extends BaseComponent {
    tag = 'desc';

    constructor(attributes: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        return `<p class="desc"${this.getAttributes()}>${this.renderChildren()}</p>`;
    }
}
ComponentFactory.register(Desc);

export class Br extends BaseComponent {
    tag = 'br';

    constructor() {
        super();
    }

    render(): string {
        return `<br/>`;
    }
}
ComponentFactory.register(Br);

export class Button extends BaseComponent {
    tag = 'button';

    constructor(attributes: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        let attrs = this.getAttributes();
        if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, '${this.attributes['target']}'` : '';
            attrs += ` onclick="tkmlr(${this.runtime?.getId()}).loader(this).go('${url}'${target})"`;
        }
        return `<button class="button"${attrs}>${this.renderText()}</button>`;
    }
}
ComponentFactory.register(Button);

export class A extends BaseComponent {
    tag = 'a';

    constructor(attributes: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        let attrs = this.getAttributes();
        if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, '${this.attributes['target']}'` : '';
            attrs += ` href="javascript:void(0)" onclick="tkmlr(${this.runtime?.getId()}).loader(this).go('${url}'${target})"`;

            if (this.attributes['preload'] === 'true') {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }
        return `<a class="a"${attrs}>${this.renderText()}</a>`;
    }
}
ComponentFactory.register(A);

export class List extends BaseComponent {
    tag = 'list';

    constructor(attributes?: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        const childrenHtml = this.wrapChildrenInDivs('list-item');
        return `<div class="list"${this.getAttributes()}>${childrenHtml}</div>`;
    }
}

ComponentFactory.register(List);

// Root is a holder for any other components, its <tkml> tag wich can be omited in the document
export class Root extends BaseComponent {
    tag = 'tkml';

    constructor() {
        super();
    }

    render(): string {
        return `${this.renderChildren()}`;
    }
}
ComponentFactory.register(Root);





export class Input extends BaseComponent {
    tag = 'input';

    render(): string {
        let attrs = this.getAttributes();
        if (this.attributes['placeholder']) {
            attrs += ` placeholder="${this.attributes['placeholder']}"`;
        }
        if (this.attributes['value']) {
            attrs += ` value="${this.attributes['value']}"`;
        }
        if (this.attributes['type']) {
            attrs += ` type="${this.attributes['type']}"`;
        }

        if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const paramName = this.attributes['name'] || 'input';
            attrs += ` onkeydown="if(event.key==='Enter'){tkmlr(${this.runtime?.getId()}).loader(this.parentElement).post('${url}', {${paramName}: this.value}, 'application/json')}"`;
        }

        return `<div class="input-wrapper"><input class="input"${attrs}/><div class="input-spinner"></div></div>`;
    }
}

ComponentFactory.register(Input);

export class Code extends BaseComponent {
    tag = 'code';

    constructor(attributes?: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        const language = this.attributes['lang'];
        const code = this.renderText().trim();
        const elementId = this.getId();

        // Start loading highlight.js if needed
        if (this.runtime) {
            this.runtime.loadHighlightJs().then(() => {
                const codeElement = document.getElementById(elementId);
                if (codeElement) {
                    const highlighted = language
                        ? (window as any).hljs.highlight(code, { language }).value
                        : (window as any).hljs.highlightAuto(code).value;
                    codeElement.innerHTML = highlighted;
                }
            });
        }

        // Return initial markup with plain code
        const languageClass = language ? ` language-${language}` : '';
        return `<pre class="code"><code class="${languageClass}" id="${elementId}">${code}</code></pre>`;
    }
}

ComponentFactory.register(Code);

export class Info extends BaseComponent {
    tag = 'info';

    render(): string {
        const childrenHtml = this.wrapChildrenInDivs('info-item');
        return `<div class="info"${this.getAttributes()}>${childrenHtml}</div>`;
    }
}

ComponentFactory.register(Info);

export class Img extends BaseComponent {
    tag = 'img';

    constructor(attributes: Record<string, string>) {
        console.log("IMAGE RENDER", attributes);
        super(attributes);
    }

    render(): string {
        let attrs = this.getAttributes();
        let style = '';

        if (this.attributes['src']) {
            attrs += ` src="${this.attributes['src']}"`;
        }
        if (this.attributes['alt']) {
            attrs += ` alt="${this.attributes['alt']}"`;
        }
        if (this.attributes['height']) {
            style = ` style="--img-height: ${parseInt(this.attributes['height'])}px"`;
        }
        return `<img class="img"${attrs}${style}/>`;
    }
}

ComponentFactory.register(Img);
ComponentFactory.registerProxyComponent('b');
ComponentFactory.registerProxyComponent('i');
ComponentFactory.registerProxyComponent('u');
ComponentFactory.registerProxyComponent('s');

export class Checkbox extends BaseComponent {
    tag = 'checkbox';

    constructor(attributes: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        let attrs = this.getAttributes();

        if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, '${this.attributes['target']}'` : '';
            attrs += ` onclick="this.classList.toggle('checked'); this.style.opacity='0.5'; tkmlr(${this.runtime?.getId()}).loader(this).go('${url}', true${target})"`;
        } else {
            attrs += ` onclick="this.classList.toggle('checked')"`;
        }

        const isChecked = this.attributes['checked'] !== undefined;
        const checkedClass = isChecked ? ' checked' : '';
        const checkedAttr = isChecked ? ' checked="checked"' : '';

        return `
            <div class="checkbox${checkedClass}"${checkedAttr}${attrs}>
                <div class="checkbox-label">${this.renderChildren()}</div>
                <div class="checkbox-toggle">
                    <div class="checkbox-slider"></div>
                </div>
            </div>
        `;
    }
}
ComponentFactory.register(Checkbox);

export class Section extends BaseComponent {
    tag = 'section';

    render(): string {
        let attrs = this.getAttributes();
        let clickableClass = '';
        let icon = '';

        if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, '${this.attributes['target']}'` : '';
            attrs += ` onclick="tkmlr(${this.runtime?.getId()}).loader(this).go('${url}'${target})"`;
            clickableClass = ' clickable';
        }

        if (this.attributes['icon']) {
            let iconUrl = this.attributes['icon'];
            // Если URL относительный, добавляем текущий хост
            if (!iconUrl.match(/^https?:\/\//)) {
                const baseHost = this.runtime?.currentHost || window.location.origin;
                iconUrl = baseHost + (iconUrl.startsWith('/') ? '' : '/') + iconUrl;
            }
            icon = `<img class="section-icon" src="${iconUrl}" alt="icon"/>`;
        } else if (this.attributes['href']) {
            icon = '<div class="section-arrow"></div>';
        }

        return `
            <div class="section${clickableClass}"${attrs}>
                <div class="section-content">${this.renderChildren()}</div>
                ${icon}
            </div>
        `;
    }
}
ComponentFactory.register(Section);

export class Radio extends BaseComponent {
    tag = 'radio';

    render(): string {
        let attrs = this.getAttributes();
        const group = this.attributes['group'] || '';

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

        const isChecked = this.attributes['checked'] !== undefined;
        const checkedClass = isChecked ? ' checked' : '';
        const checkedAttr = isChecked ? ' checked="checked"' : '';

        return `
            <div class="radio${checkedClass}"${checkedAttr}${attrs} data-group="${group}">
                <div class="radio-label">${this.renderChildren()}</div>
                <div class="radio-toggle">
                    <div class="radio-dot"></div>
                </div>
            </div>
        `;
    }
}
ComponentFactory.register(Radio);

export class Loader extends BaseComponent {
    tag = 'loader';

    render(): string {
        const id = this.getId();

        if (this.attributes['href']) {
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element && this.runtime) {
                    this.runtime.observeLoader(element, this.attributes['href']);
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