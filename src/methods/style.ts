/**
 * Puffin style handler - modern TypeScript
 * Teljesen kompatibilis a régi JS API-val: template literal, bindek, random class generálás
 */
function generateClass(): string {
    return `pfn_${(Math.random() + Math.random()).toString().slice(12)}`;
}

function parseBinds(input: TemplateStringsArray | string[], methods: any[]): { output: string; binds: any[] } {
    let output = input.join('to__BIND');
    const bindsMatched = output.match(/to__BIND/g);
    const bindsLength = bindsMatched ? bindsMatched.length : 0;
    const computedBinds: any[] = [];
    for (let i = 0; i < bindsLength; i++) {
        output = output.replace('to__BIND', `$BIND${i} `);
        computedBinds.push(methods[i]);
    }
    return {
        output,
        binds: computedBinds
    };
}

export default function style(inputCss: TemplateStringsArray | string[], ...args: any[]): string {
    const computedArguments = args;
    const { output, binds } = parseBinds(inputCss, computedArguments);
    const randomClass = generateClass();
    const styleEle = document.createElement('style');
    styleEle.type = 'text/css';
    styleEle.textContent = output.replace(/&/gm, `.${randomClass}`);
    (styleEle as any).classList = randomClass;
    document.head.appendChild(styleEle);
    return randomClass;
}
