import { BaseComponent, ComponentFactory, Component } from '../components';
import { encodeUrl, safeIds, safeAttr, resolveUrl } from '../util';

ComponentFactory.registerProxyComponent('b');
ComponentFactory.registerProxyComponent('i');
ComponentFactory.registerProxyComponent('u');
ComponentFactory.registerProxyComponent('s');


// Компонент для выделения текста с белым цветом
export class W extends BaseComponent {
    tag = 'w';
    canParent = ['desc', 'title', 'section', 'tkml']; // W может быть только внутри текстовых компонентов
    hasText = true;

    render(): string {
        return `<span class="w">${this.childs()}</span>`;
    }
}
ComponentFactory.register(W);

// Компонент для переноса строки
export class Br extends BaseComponent {
    tag = 'br';
    canParent = ['p', 'info', 'desc', 'title', 'section', 'tkml', 'text', 'quote', 'warning']; // Разрешаем использовать внутри текстовых элементов
    selfClosing = true;
    render(): string {
        return '<br/>';
    }
}
ComponentFactory.register(Br);

// Компонент для создания абзаца
export class P extends BaseComponent {
    tag = 'p';
    hasText = true;
    canParent = ['tkml', 'section', 'list', 'info', 'bubble', 'footer', 'quote']; // Example parents

    render(): string {
        let attrs = this.getAttributes();
        let centerClass = this.attributes['center'] !== undefined ? ' center' : '';
        // Ensure it renders with a 'p' class for styling
        return `<p class="p${centerClass}"${attrs}>${this.childs()}</p>`;
    }
}
ComponentFactory.register(P);

// Компонент для создания маленького текста
export class Small extends BaseComponent {
    tag = 'small';
    hasText = true;
    render(): string {
        return `<small>${this.childs()}</small>`;
    }
}
ComponentFactory.register(Small);


export class Desc extends BaseComponent {
    tag = 'desc';
    hasText = true;
    canParent = ['tkml', 'info', 'list', 'section', 'warning'];

    constructor(attributes: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        let attrs = this.getAttributes();
        let centerClass = this.attributes['center'] !== undefined ? ' center' : '';

        return `<p class="desc${centerClass}"${attrs}>${this.childs()}</p>`;
    }
}
ComponentFactory.register(Desc);

export class Text extends BaseComponent {
    tag = 'text';
    hasText = true;
    canParent = ['tkml', 'info', 'list'];

    constructor(attributes: Record<string, string>) {
        super(attributes);
    }

    render(): string {
        let attrs = this.getAttributes();
        let centerClass = this.attributes['center'] !== undefined ? ' center' : '';

        return `<p class="text${centerClass}"${attrs}>${this.childs()}</p>`;
    }
}
ComponentFactory.register(Text);



// Компонент для создания элемента маркированного списка
export class Bullet extends BaseComponent {
    tag = 'bullet';
    hasText = true;
    render(): string {
        let attrs = this.getAttributes();
        return `<div class="bullet-item"${attrs}><div class="bullet-marker"></div><div class="bullet-content">${this.childs()}</div></div>`;
    }
}
ComponentFactory.register(Bullet);

export class Pill extends BaseComponent {
    tag = 'pill';
    canParent = ['info', 'tkml', 'desc', 'title', 'section', 'p', 'text']; // Исправляем bulletr на bullet
    hasText = true;
    render(): string {
        const id = this.getId();
        let icon = '';
        let attrs = this.getAttributes();
        let style = '';

        if (this.attributes['icon']) {
            const iconUrl = resolveUrl(this.attributes['icon'], this.runtime);
            icon = `<img class="pill-icon" src="${iconUrl}" alt="icon"/>`;
        }

        // Добавляем поддержку параметра width (только в пикселях)
        if (this.attributes['width']) {
            const width = parseInt(this.attributes['width']);
            if (!isNaN(width)) {
                style += `width: ${width}px; `;
            }
        }

        // Если есть стили, добавляем их в атрибуты
        if (style) {
            attrs += ` style="${style}"`;
        }

        return `<span id="${id}" class="pill"${attrs}>${this.childs()}${icon}</span>`;
    }
}
ComponentFactory.register(Pill);