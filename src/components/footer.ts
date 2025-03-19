import { BaseComponent, ComponentFactory } from '../components';

export class Footer extends BaseComponent {
    tag = 'footer';

    render(): string {
        let attrs = this.getAttributes();
        const autoHideClass = this.attributes['autohide'] !== undefined ? ' autohide' : '';
        const id = this.getId();

        if (this.attributes['autohide'] !== undefined && this.runtime) {
            setTimeout(() => {
                this.runtime?.observeFooter(id);
            }, 0);
        }

        return `<div id="${id}" class="footer${autoHideClass}"${attrs}>${this.childs()}</div>`;
    }
}
ComponentFactory.register(Footer);