import { Runtime } from './runtime';
// Add at the top of the file
function encodeUrl(url: string): string {
    return encodeURIComponent(url).replace(/["']/g, match => match === '"' ? '&quot;' : '&#39;');
}

// Base interface for all components
export interface Component {
    tag: string;
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

    constructor(attributes?: Record<string, string>) {
        this.attributes = attributes || {};
    }

    addChild(child: Component): void {
        this.children.push(child);
        child.runtime = this.runtime;
        child.parent = this;
    }

    renderChildren(): string {
        return this.children.map(child => child.render()).join('');
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

    protected getId(): string {
        if (this.attributes && this.attributes['id']) {
            return this.attributes['id'];
        }
        return `${this.tag}-${this.runtime?.getId()}-${++BaseComponent.counter}`;
    }
}


// Component factory
export class ComponentFactory {
    private static components: Map<string, new (...args: any[]) => Component> = new Map();

    static register(tag: string, componentClass: new (...args: any[]) => Component) {
        this.components.set(tag, componentClass);
    }

    static create(tag: string, attributes: Record<string, string>): Component {
        const ComponentClass = this.components.get(tag.toLowerCase());
        if (ComponentClass) {
            return new ComponentClass(attributes);
        }
        return new Undefined(tag, attributes);
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
        return `<h1 class="title">${this.renderChildren()}</h1>`;
    }
}
ComponentFactory.register('title', Title);

// Alert allows you to render alert messages styled variously
export class Alert extends BaseComponent {
    tag = 'alert';

    constructor(attributes?: Record<string, string>) {
        super(attributes);
    }
    render(): string {
        let text = this.renderText();
        if (text) {
            return `<div class="alert">${text}</div>`;
        }
        return '';
    }
}
ComponentFactory.register('alert', Alert);

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
        return `<p class="desc">${this.renderChildren()}</p>`;
    }
}
ComponentFactory.register('desc', Desc);

export class Br extends BaseComponent {
    tag = 'br';

    constructor() {
        super();
    }

    render(): string {
        return `<br/>`;
    }
}
ComponentFactory.register('br', Br);

export class Button extends BaseComponent {
    tag = 'button';

    constructor(attributes: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        let addrs = '';
        if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            addrs += ` onclick="tkmlr(${this.runtime?.getId()}).loader(this).go('${url}')"`;

            if (this.attributes['preload'] === 'true') {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }
        return `<button class="button"${addrs}>${this.renderText()}</button>`;
    }
}
ComponentFactory.register('button', Button);

export class A extends BaseComponent {
    tag = 'a';

    constructor(attributes: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        let addrs = '';
        if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            addrs += ` href="javascript:void(0)" onclick="tkmlr(${this.runtime?.getId()}).loader(this).go('${url}')"`;
            if (this.attributes['preload'] === 'true') {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }
        return `<a class="a"${addrs}>${this.renderText()}</a>`;
    }
}
ComponentFactory.register('a', A);


export class List extends BaseComponent {
    tag = 'list';

    constructor(attributes?: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        const childrenHtml = this.children
            .map(child => `<div class="list-item">${child.render()}</div>`)
            .join('');

        return `<div class="list">${childrenHtml}</div>`;
    }
}

ComponentFactory.register('list', List);

// Root is a holder for any other components
export class Root extends BaseComponent {
    tag = 'text';

    constructor(runtime: Runtime) {
        super({});
        this.runtime = runtime;
    }

    render(): string {
        return `${this.renderChildren()}`;
    }
}





export class Input extends BaseComponent {
    tag = 'input';

    render(): string {
        let attrs = '';
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
ComponentFactory.register('input', Input);

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

ComponentFactory.register('code', Code);