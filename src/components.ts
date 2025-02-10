// Add at the top of the file
function encodeUrl(url: string): string {
    return encodeURIComponent(url).replace(/["']/g, match => match === '"' ? '&quot;' : '&#39;');
}

// Base interface for all components
export interface Component {
    tag: string;
    parent: Component | null;
    runtimeId?: number;
    render(): string;
    addChild(child: Component): void;
}

// Base class providing default implementation for addChild
export abstract class BaseComponent implements Component {
    abstract tag: string;
    private children: Component[] = [];
    public parent: Component | null = null;
    public runtimeId?: number;

    addChild(child: Component): void {
        this.children.push(child);
        child.runtimeId = this.runtimeId;
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
}

// Undefined component is used once an undefined tag is encountered
export class Undefined extends BaseComponent {
    tag = 'undefined';
    private name: string;

    constructor(name: string, attributes: Record<string, string>) {
        super();
        this.name = name;
    }

    render(): string {
        return `<div class="undefined"><div class="error">Undefined component: ${this.name}</div></div>`;
    }
}

// Title stands for <title> tag, has no attributes yet
export class Title extends BaseComponent {
    tag = 'title';
    private attributes: Record<string, string>;

    constructor(attributes: Record<string, string>) {
        super();
        this.attributes = attributes;
    }

    render(): string {
        return `<h1 class="title">${this.renderChildren()}</h1>`;
    }
}

// Alert allows you to render alert messages styled variously
export class Alert extends BaseComponent {
    tag = 'title';
    private attributes: Record<string, string>;
    constructor(attributes: Record<string, string>) {
        super();
        this.attributes = attributes;
    }
    render(): string {
        let text = this.renderText();
        if (text) {
            return `<div class="alert">${text}</div>`;
        }
        return '';
    }
}

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
    private attributes: Record<string, string>;

    constructor(attributes: Record<string, string>) {
        super();
        this.attributes = attributes;
    }

    render(): string {
        return `<p class="desc">${this.renderChildren()}</p>`;
    }
}

export class Br extends BaseComponent {
    tag = 'br';

    constructor() {
        super();
    }

    render(): string {
        return `<br/>`;
    }
}

export class Button extends BaseComponent {
    tag = 'button';
    private attributes: Record<string, string>;

    constructor(attributes: Record<string, string>) {
        super();
        this.attributes = attributes;
    }

    render(): string {
        let addrs = '';
        if (this.attributes['href']) {
            addrs += ` onclick="tkmlr(${this.runtimeId}).loader(this).go('${encodeUrl(this.attributes['href'])}')"`;
        }
        return `<button class="button"${addrs}>${this.renderText()}</button>`;
    }
}

export class A extends BaseComponent {
    tag = 'a';
    private attributes: Record<string, string>;

    constructor(attributes: Record<string, string>) {
        super();
        this.attributes = attributes;
    }

    render(): string {
        let addrs = '';
        if (this.attributes['href']) {
            addrs += ` href="javascript:tkmlr(${this.runtimeId}).go('${encodeUrl(this.attributes['href'])}')"`;
        }
        return `<a class="a"${addrs}>${this.renderText()}</a>`;
    }
}


export class List extends BaseComponent {
    tag = 'list';
    private attributes: Record<string, string>;

    constructor(attributes: Record<string, string>) {
        super();
        this.attributes = attributes;
    }

    render(): string {
        return `<div class="list">${this.renderChildren()}</div>`;
    }
}

// Root is a holder for any other components
export class Root extends BaseComponent {
    tag = 'text';

    constructor(runtimeId: number) {
        super();
        this.runtimeId = runtimeId;
    }

    render(): string {
        return `${this.renderChildren()}`;
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

// Register built-in components
ComponentFactory.register('title', Title);
ComponentFactory.register('desc', Desc);
ComponentFactory.register('button', Button);
ComponentFactory.register('br', Br);
ComponentFactory.register('a', A);
ComponentFactory.register('list', List);
ComponentFactory.register('alert', Alert);