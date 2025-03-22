import { BaseComponent, ComponentFactory, Component } from '../components';
import { encodeUrl, safeIds, safeAttr, resolveUrl } from '../util';
import { Section } from './index';

// Create Option component that inherits from Section
export class Option extends Section {
    tag = 'option';
    canParent = ['dropdown']; // Can only be used inside dropdown

    // Override addHrefAttributes to add stopPropagation
    protected addHrefAttributes(attrs: string): string {
        const isDisabled = this.attributes['disabled'] !== undefined;

        // Don't add href functionality if disabled
        if (isDisabled) return attrs;

        if (this.attributes['href']) {
            const url = encodeUrl(this.attributes['href']);
            const target = this.attributes['target'] ? `, '${safeIds(this.attributes['target'])}'` : '';
            // Add event.stopPropagation() to prevent dropdown's href from being triggered
            attrs += ` onclick="event.stopPropagation(); tkmlr(${this.runtime?.getId()}).loader(this).go('${url}'${target}); return false;"`;

            if (this.attributes['preload'] === 'true') {
                setTimeout(() => this.runtime?.preload(this.attributes['href']), 0);
            }
        }

        return attrs;
    }

    // Check for image in children
    private checkForImage(): void {
        this.hasImage = this.children.some(child => child.tag === 'img');
    }

    render(): string {
        // Check for image before rendering
        this.checkForImage();

        let attrs = this.getAttributes();
        const value = this.attributes['value'] || '';
        const childs = this.childs();
        const isSelected = this.attributes['selected'] !== undefined;

        // Add value attribute if present
        if (value) {
            attrs += ` value="${safeAttr(value)}"`;
        }

        // Add selected attribute if present
        if (isSelected) {
            attrs += ` selected`;
        }

        // Get common classes from parent
        const { clickableClass, disabledClass, imageClass } = this.getCommonClasses();
        const selectedClass = isSelected ? ' selected' : '';

        // Add href attributes
        attrs = this.addHrefAttributes(attrs);

        // Handle icon - reuse code from Section component
        let icon = '';
        if (this.attributes['icon']) {
            const iconUrl = resolveUrl(this.attributes['icon'], this.runtime);
            icon = `<img class="option-icon" src="${iconUrl}" alt="icon"/>`;
        }

        // Separate image from other content
        let imageContent = '';
        let textContent = '';

        if (this.hasImage) {
            // Find the image component
            const imgComponent = this.children.find(child => child.tag === 'img');
            if (imgComponent) {
                imageContent = imgComponent.render();

                // Filter out the image from children for text content
                textContent = this.children
                    .filter(child => child.tag !== 'img')
                    .map(child => child.render())
                    .join('');
            }
        } else {
            textContent = childs;
        }

        return `
            <div class="option${clickableClass}${disabledClass}${imageClass}${selectedClass}"${attrs}>
                ${this.hasImage ? `<div class="option-img">${imageContent}</div>` : (icon ? icon : '')}
                <div class="option-content">${textContent}</div>
                ${this.hasImage && icon ? `<div class="option-right-icon">${icon}</div>` : ''}
            </div>
        `;
    }
}

export class Dropdown extends BaseComponent {
    tag = 'dropdown';
    canParent = ['tkml'];

    render(): string {
        let attrs = this.getAttributes();
        const id = this.getId();
        const name = this.attributes['name'] || '';
        const placeholder = this.attributes['placeholder'] || 'Select an option';
        const isDisabled = this.attributes['disabled'] !== undefined;

        // Find selected option or use value attribute
        let selectedValue = this.attributes['value'] || '';
        let displayText = placeholder;
        let selectedImage = '';
        let selectedIcon = '';
        let hasRightIcon = false;

        // Check if any child has the selected attribute
        for (const child of this.children) {
            if ((child as any).tag === 'option' && (child as any).attributes) {
                const childAttrs = (child as any).attributes;

                // If child has selected attribute, use its value
                if (childAttrs['selected'] !== undefined) {
                    selectedValue = childAttrs['value'] || childAttrs['text'] || (child as any).childs();
                    displayText = (child as any).childs();

                    // Check if the selected option has an image
                    if ((child as any).hasImage) {
                        // Find the image component in the selected option
                        const imgComponent = (child as any).children.find((c: any) => c.tag === 'img');
                        if (imgComponent) {
                            selectedImage = `<div class="dropdown-selected-img">${imgComponent.render()}</div>`;
                        }

                        // If it has both image and icon, show icon on the right
                        if (childAttrs['icon']) {
                            const iconUrl = resolveUrl(childAttrs['icon'], this.runtime);
                            selectedIcon = `<img class="dropdown-selected-right-icon" src="${iconUrl}" alt="icon"/>`;
                            hasRightIcon = true;
                        }
                    }
                    // Check if the selected option has only an icon (no image)
                    else if (childAttrs['icon']) {
                        const iconUrl = resolveUrl(childAttrs['icon'], this.runtime);
                        selectedIcon = `<img class="dropdown-selected-icon" src="${iconUrl}" alt="icon"/>`;
                    }

                    break;
                }
            }
        }

        // Generate unique ID for the dropdown
        const dropdownId = `dropdown-${id}`;

        // Add form submission support
        let formHandler = '';
        if (this.attributes['href'] && !isDisabled) {
            const url = encodeUrl(this.attributes['href']);
            formHandler = ` data-href="${safeAttr(url)}"`;
        }

        // Add disabled attribute if present
        const disabledClass = isDisabled ? ' disabled' : '';
        if (isDisabled) {
            attrs += ` disabled`;
        }

        // Add initialization code
        if (this.runtime && !isDisabled) {
            // For browser environment, initialize immediately
            if (this.runtime.isBrowser) {
                setTimeout(() => {
                    this.runtime?.initializeDropdown(dropdownId);
                }, 0);
            }

            // For server-side rendering, add to onload
            if (this.runtime.isServer) {
                this.runtime.onload.push(`
                    (function() {
                        const dropdownId = '${dropdownId}';
                        tkmlr(${this.runtime.getId()}).initializeDropdown(dropdownId);
                    })();
                `);
            }
        }

        // Render children directly in the dropdown menu
        const options = this.childs();

        return `
            <div id="${dropdownId}" class="dropdown${disabledClass}"${formHandler} ${attrs}>
                <input type="hidden" name="${safeAttr(name)}" value="${safeAttr(selectedValue)}"${isDisabled ? ' disabled' : ''}>
                <div class="dropdown-toggle">
                    ${selectedImage}
                    ${!hasRightIcon && selectedIcon ? selectedIcon : ''}
                    <span class="dropdown-display">${displayText}</span>
                    ${hasRightIcon ? selectedIcon : ''}
                    <svg class="dropdown-arrow" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="dropdown-menu">
                    ${options}
                </div>
            </div>
        `;
    }
}

// Register components
ComponentFactory.register(Option);
ComponentFactory.register(Dropdown); 