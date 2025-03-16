import { SAXParser, Tag } from 'sax';
import { ComponentFactory, Component, Text, Root, Code } from './components';
import { Runtime } from './runtime';

export class Parser {
    body: string = ''
    parser: SAXParser
    currentElement: HTMLElement | null = null
    root: HTMLElement | null
    isFirstChunk: boolean = true
    addClosingRoot: boolean = false
    rootComponent: Component | null = null
    renderElement: Component | null = null
    private runtime: Runtime
    private targets?: string[]
    private inCodeBlock: number = 0
    private codeContent: string = ''

    constructor(container: HTMLElement | null, runtime: Runtime, target?: string, renderElement?: Component) {
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

            // Если открывается тег code, запоминаем его атрибуты и родителя

            if (this.inCodeBlock > 0) {
                let attrStr = '';
                for (const [key, value] of Object.entries(node.attributes)) {
                    attrStr += ` ${key}="${value}"`;
                }
                this.codeContent += `<${node.name}${attrStr}>`;
                if (node.name === 'code') {
                    this.inCodeBlock++
                }
                return;
            } else if (node.name === 'code') {
                this.inCodeBlock++
            }

            const component = ComponentFactory.create(node.name, attributes, runtime, curComponent);
            if (curComponent) {
                component.parent = curComponent;
                curComponent.addChild(component);
            } else {
                this.rootComponent = component;
            }
            curComponent = component;
        };

        this.parser.onclosetag = (name: string) => {

            if (this.inCodeBlock > 0) {
                // Если закрывается тег code, создаем компонент Code с накопленным содержимым
                if (name === 'code') {
                    this.inCodeBlock--;
                    if (this.inCodeBlock === 0) {
                        (curComponent as Code).setContent(this.codeContent);
                        this.codeContent = '';
                    } else {
                        this.codeContent += `</${name}>`; // just closing inner code block
                        return;
                    }
                    // no return here
                } else {
                    this.codeContent += `</${name}>`;
                    return;
                }
            }

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
            // Если мы внутри тега code, добавляем текст в содержимое
            if (this.inCodeBlock > 0) {
                this.codeContent += text;
                return;
            }

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

    finish(): string {
        if (this.addClosingRoot) {
            this.add('</tkml>');
        }
        this.parser.close();
        if (!this.targets && this.rootComponent) {
            let html;
            if (this.renderElement) {
                //this.rootComponent
                let parent = this.renderElement.parent
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
                html = this.rootComponent.render();
                if (this.root) {
                    this.root.innerHTML = html;
                }
            }
            return html
        }
        return ''
    }

    failed(error: Error) {
        console.error(error);
    }
}


