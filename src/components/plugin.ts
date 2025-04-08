import { BaseComponent, ComponentFactory } from '../components';

export class Plugin extends BaseComponent {
    tag = 'plugin';
    selfClosing = true;
    canParent = ['tkml'];

    render(): string {
        const id = this.getId();
        let attrs = this.getAttributes();

        // Получаем URL плагина
        const pluginUrl = this.attributes['src'] || '';

        if (pluginUrl && this.runtime) {
            // Используем onInit для загрузки плагина
            this.runtime.onInit('loadPlugin', pluginUrl);
        }

        // Возвращаем пустой элемент с ID
        return `<div id="${id}" class="plugin"${attrs} data-plugin-url="${pluginUrl}"></div>`;
    }
}

// Регистрируем компонент
ComponentFactory.register(Plugin); 