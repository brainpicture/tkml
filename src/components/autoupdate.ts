import { BaseComponent, ComponentFactory } from '../components';
import { safeAttr } from '../util';

export class AutoUpdate extends BaseComponent {
    tag = 'autoupdate';
    selfClosing = true; // No content inside
    canParent = ['tkml']; // Where this component can be placed

    render(): string {
        const id = this.getId();
        let attrs = this.getAttributes();

        // Get the interval parameter (e.g., "10s", "1m", "2h")
        const intervalStr = this.attributes['in'] || '';

        // Get the URL to update (default to current URL if not specified)
        const updateUrl = this.attributes['href'] || '';

        // Parse the interval string to milliseconds
        let intervalMs = 0;
        if (intervalStr) {
            const value = parseFloat(intervalStr);
            const unit = intervalStr.replace(/[\d.]/g, '').toLowerCase();

            if (!isNaN(value)) {
                switch (unit) {
                    case 's':
                        intervalMs = value * 1000;
                        break;
                    case 'm':
                        intervalMs = value * 60 * 1000;
                        break;
                    case 'h':
                        intervalMs = value * 60 * 60 * 1000;
                        break;
                    default:
                        // Default to seconds if unit is not specified
                        intervalMs = value * 1000;
                }
            }
        }

        // Инициализируем автообновление через runtime
        this.runtime?.onInit('initializeAutoUpdate', id, updateUrl, intervalMs);

        // Render a minimal placeholder element - важно вернуть элемент с ID
        return `<div id="${id}" class="autoupdate"${attrs} data-interval="${intervalMs}" data-url="${safeAttr(updateUrl)}"></div>`;
    }
}

// Register the component with the factory
ComponentFactory.register(AutoUpdate); 