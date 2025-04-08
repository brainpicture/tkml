// В методе render()
if (this.runtime) {
    // Вызов будет выполнен только один раз на странице
    this.runtime.onInit('loadHighlightJs');

    // Подсвечиваем текущий элемент
    this.runtime.onInit('highlightElement', elementId);
} 