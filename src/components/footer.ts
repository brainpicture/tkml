import { BaseComponent, ComponentFactory } from '../components';

export class Footer extends BaseComponent {
    tag = 'footer';
    hasText = true;

    render(): string {
        let attrs = this.getAttributes();
        const autoHideClass = this.attributes['autohide'] !== undefined ? ' autohide' : '';
        const id = this.getId();

        if (this.runtime) {
            setTimeout(() => {
                this.runtime?.observeFooter(id, this.attributes['autohide'] !== undefined);
            }, 0);
        }

        return `<div id="${id}" class="footer${autoHideClass}"${attrs}>${this.childs()}</div>`;
    }
}
ComponentFactory.register(Footer);