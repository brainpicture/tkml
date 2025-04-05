import { BaseComponent, ComponentFactory } from '../components';

export class Quote extends BaseComponent {
    tag = 'quote';
    hasText = true; // Allows text content directly inside
    // Define where the quote component can be placed
    canParent = ['tkml', 'section', 'list', 'info', 'bubble', 'footer'];

    render(): string {
        let attrs = this.getAttributes();
        let childContent = this.childs(); // Render children (the quote text)

        // SVG for the quote icon (you can customize this)
        const quoteIcon = `
            <svg class="quote-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 17H9L11 13V7H5V13H8L6 17ZM14 17H17L19 13V7H13V13H16L14 17Z" fill="currentColor"/>
            </svg>
        `;
        // Alternative using Font Awesome or similar: <i class="quote-icon fas fa-quote-left"></i>

        return `
            <div class="quote"${attrs}>
                ${quoteIcon}
                <div class="quote-content">${childContent}</div>
            </div>
        `;
    }
}

// Register the component with the factory
ComponentFactory.register(Quote); 