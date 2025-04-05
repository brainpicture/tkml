import { BaseComponent, ComponentFactory } from '../components';

export class Box extends BaseComponent {
    tag = 'box';
    hasText = true; // Allows text content directly inside
    // Define where the box component can be placed - similar to other container components
    canParent = ['tkml', 'section', 'list', 'info', 'footer'];

    render(): string {
        let attrs = this.getAttributes();
        let childContent = this.childs(); // Render all children

        // Check for optional attributes
        const hasPadding = this.attributes['padding'] !== undefined;
        const paddingClass = hasPadding ? ` padding-${this.attributes['padding']}` : '';

        // You can add more customization options here if needed
        // For example, different background colors, border styles, etc.

        return `
            <div class="box${paddingClass}"${attrs}>
                ${childContent}
            </div>
        `;
    }
}

// Register the component with the factory
ComponentFactory.register(Box); 