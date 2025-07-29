import { element, render, style, lang, state, createElement } from '../../src/main'

const memory = state({
    translations: {
        test: "Hello World"
    }
});

memory.on('e', () => {
    console.log('1');
});

memory.on('e', () => {
    console.log('2');
});

function onclick(this: HTMLElement): void {
    if (this.parentElement && this.parentElement.children[1] && typeof (this.parentElement.children[1] as any).update === 'function') {
        (this.parentElement.children[1] as any).update();
    }
    memory.emit('e', undefined);
}

interface SupperButtonProps {
    wow?: string;
    nice?: string;
    test?: object;
    [key: string]: any;
}

function SupperButton(props: SupperButtonProps) {
    return element`
    <button title="Minimize">
        <svg xmlns:xlink="http://www.w3.org/1999/xlink" style="isolation:isolate" viewBox="0 0 24 24" width="24" height="24">
            <rect x="7" y="11.5" width="10" height="0.2" />
        </svg>
    </button>
`;
}

const App = element({
    addons: [lang(memory)],
    components: {
        SupperButton
    }
})`
    <div ${true ? "test_2=" : ""} ${'aaa="8"'} whatever2="${"ok"}" test="ok">
        <SupperButton wow="aaa" nice="${"test"}" test="${{ hello: true }}" :click="${onclick}"/>
        <p lang-string="test"/>
        <div>
            Random numbers:
            ${[0, 0, 0].map(() => element`<p lang-string="test"/>`)}
        </div>
    </div>
`;

const appElement = document.getElementById("app");
if (appElement) {
    render(App, appElement);
}
