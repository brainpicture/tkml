import { SaxesParser } from 'saxes';
import { ComponentFactory, Component, Text, Root } from './components';

export class Parser {
    body: string = ''
    parser: SaxesParser
    currentElement: HTMLElement | null = null
    root: HTMLElement
    rootComponent: Component
    private runtimeId: number

    constructor(container: HTMLElement, runtimeId: number) {
        this.root = container;
        this.runtimeId = runtimeId;
        this.parser = new SaxesParser({
            xmlns: true,
            fragment: true
        });

        this.rootComponent = new Root(this.runtimeId);
        let curComponent: Component | null = this.rootComponent

        this.parser.on('opentag', (node) => {
            // Create component if available
            const attributes: Record<string, string> = {};
            for (const k in node.attributes) {
                const attr = node.attributes[k];
                if (typeof attr === 'object' && 'value' in attr) {
                    attributes[k] = (attr as any).value;
                } else {
                    attributes[k] = String(attr);
                }
            }

            const component = ComponentFactory.create(node.name, attributes);
            if (curComponent) {
                component.parent = curComponent;
                curComponent.addChild(component);
            }
            curComponent = component;
        });

        this.parser.on('closetag', () => {
            if (curComponent) {
                curComponent = curComponent.parent
            }
        });

        this.parser.on('text', (text) => {
            if (curComponent) {
                let textComponent = new Text(text);
                textComponent.parent = curComponent;
                curComponent.addChild(textComponent);
            }
        });

        this.parser.on('error', this.failed.bind(this));
    }

    // add more xml content to the body for a streaming parser
    add(text: string) {
        this.body += text;
        this.parser.write(text);
    }

    finish() {
        // Final parsing if needed
        this.parser.close();
        let html = this.rootComponent.render();
        this.root.innerHTML = html;
    }

    failed(error: Error) {
        console.error(error);
    }
}


