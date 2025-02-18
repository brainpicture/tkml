import { SAXParser, Tag } from 'sax';
import { ComponentFactory, Component, Text, Root } from './components';
import { Runtime } from './runtime';

export class Parser {
    body: string = ''
    parser: SAXParser
    currentElement: HTMLElement | null = null
    root: HTMLElement
    isFirstChunk: boolean = true
    addClosingRoot: boolean = false
    rootComponent: Component | null = null
    renderElement: Component | null = null
    private runtime: Runtime
    private targets?: string[]
    constructor(container: HTMLElement, runtime: Runtime, target?: string, renderElement?: Component) {
        this.root = container;
        this.runtime = runtime;
        this.targets = target?.split(',').map(t => t.trim());
        if (renderElement) {
            this.renderElement = renderElement;
        }

        // Создаем SAX парсер в нестрогом режиме (false)
        this.parser = new SAXParser(false, {
            lowercase: true,
            trim: false,
        });

        let curComponent: Component | null = null;

        this.parser.onopentag = (node: Tag) => {
            const attributes: Record<string, string> = {};
            for (const [key, value] of Object.entries(node.attributes)) {
                // Декодируем URL в src атрибутах
                if (key === 'src') {
                    attributes[key] = decodeURIComponent(String(value));
                } else {
                    attributes[key] = String(value);
                }
            }

            const component = ComponentFactory.create(node.name, attributes, runtime);
            if (curComponent) {
                component.parent = curComponent;
                curComponent.addChild(component);
            } else {
                this.rootComponent = component;
            }
            curComponent = component;
        };

        this.parser.onclosetag = () => {
            if (curComponent) {
                if (this.targets && curComponent.id && this.targets.includes(curComponent.id)) {
                    let targetEl = document.getElementById(curComponent.id);
                    if (targetEl) {
                        targetEl.outerHTML = curComponent.render();
                    }
                }
                curComponent = curComponent.parent;
            }
        };

        this.parser.ontext = (text: string) => {
            if (curComponent) {
                const textComponent = new Text(text);
                textComponent.parent = curComponent;
                curComponent.addChild(textComponent);
            }
        };

        this.parser.onerror = (err: any) => {
            console.error("Parsing error:", err);
            this.failed(err);
        };
    }

    add(text: string) {
        if (this.isFirstChunk) {
            this.isFirstChunk = false;
            if (!text.match(/^\s*(<!--[\s\S]*?-->\s*)*<tkml/)) {
                text = '<tkml>' + text;
                this.addClosingRoot = true;
            }
        }

        this.body += text;
        this.parser.write(text);
    }

    finish() {
        if (this.addClosingRoot) {
            this.add('</tkml>');
        }
        this.parser.close();
        if (!this.targets && this.rootComponent) {
            if (this.renderElement) {
                //this.rootComponent
                let parent = this.renderElement.parent
                let html;
                let el = document.getElementById(this.renderElement.id!);
                if (parent) {
                    this.rootComponent.children.forEach(child => {
                        child.parent = parent;
                    })
                    html = parent.renderChildren(this.rootComponent.children);
                    el = el ? parent.getWrappingElement(el) : null;

                } else {
                    html = this.rootComponent.render();
                }
                if (el) {
                    el.outerHTML = html;
                }
            } else {
                let html = this.rootComponent.render();
                this.root.innerHTML = html;
            }
        }
    }

    failed(error: Error) {
        console.error(error);
    }
}


