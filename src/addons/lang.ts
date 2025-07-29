/**
 * Puffin language addon - modern TypeScript
 * Egyszerű nyelvi fordítási logika
 */

function getValueIfProperty(strings: string[], value: any, i: number): any {
    if (i < strings.length && value) {
        return getValueIfProperty(strings, value[strings[i]], i + 1);
    } else {
        return value;
    }
}

function appendText(state: any, element: HTMLElement): void {
    let string = element.getAttribute('lang-string');
    const templateString = element.getAttribute('string') || `{{${string}}}`;
    if (string && string !== '') {
        let stringComputed = getValueIfProperty(string.split('.'), state.data.translations, 0);
        if (stringComputed) {
            element.textContent = templateString.replace(`{{${string}}}`, stringComputed);
        } else if (state.data.fallbackTranslations && getValueIfProperty(string.split('.'), state.data.fallbackTranslations, 0)) {
            element.textContent = getValueIfProperty(string.split('.'), state.data.fallbackTranslations, 0);
        } else {
            element.textContent = string;
        }
    } else if (string) {
        element.textContent = string;
    }
}

const lang = (state: any) => ({
    iterateElement(element: HTMLElement) {
        appendText(state, element);
        if (state.changed) {
            state.changed(() => {
                appendText(state, element);
            });
        }
    }
});

lang.getTranslation = (string: string, state: any) => {
    return getValueIfProperty(string.split('.'), state.data.translations, 0)
        || getValueIfProperty(string.split('.'), state.data.fallbackTranslations, 0)
        || string;
};

export default lang;
