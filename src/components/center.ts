import { BaseComponent, ComponentFactory } from '../components';

export class Center extends BaseComponent {
    tag = 'center';
    hasText = true; // Allows text content directly inside
    // Define where the center component can be placed
    canParent = ['tkml', 'section', 'list', 'info', 'footer', 'box'];

    render(): string {
        let attrs = this.getAttributes();
        let childContent = this.childs(); // Render all children

        return `<div class="center-container"${attrs}>${childContent}</div>`;
    }
}

// Register the component with the factory
ComponentFactory.register(Center); 