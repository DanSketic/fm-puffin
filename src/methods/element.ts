// Modern TypeScript Puffin element parser
import type { Tree, ElementProps, PuffinElement } from '../types';

/**
 * Overloads for full type safety:
 * - element(template, ...exprs): Tree
 * - element(config): (template, ...exprs) => Tree
 */
function element(strings: TemplateStringsArray, ...exprs: any[]): Tree;
function element(config: object): (strings: TemplateStringsArray, ...exprs: any[]) => Tree;
function element(input: any, ...args: any[]): any {
    if (Array.isArray(input) && Object.prototype.hasOwnProperty.call(input, 'raw')) {
        // Direct template literal usage
        return continueParsing(input, args);
    } else if (typeof input === 'object' && !Array.isArray(input) && !(input instanceof String)) {
        // Currying: element(config)
        return function (strings: TemplateStringsArray, ...innerExprs: any[]): Tree {
            const tree = continueParsing(strings, innerExprs, input);
            // Ensure all required Tree properties exist
            tree._opened ??= true;
            tree._is ??= 'puffin';
            tree._type ??= 'root';
            tree._props ??= [];
            tree.children ??= [];
            tree.addons ??= input?.addons || [];
            return tree;
        };
    }
    throw new Error('Invalid arguments for element()');

    function continueParsing(text: any, exprs: any[], config?: any): Tree {
        const computedArguments = [...exprs];
        const { output, binds } = parseBinds(text, computedArguments);
        return parseHTML(output, binds, config);
    }
}

function isFullSpaces(str?: string): boolean {
    if (str) {
        const matches = str.match(/\s/gm);
        return !!matches && matches.length === str.length;
    }
    return true;
}

function isFullTabs(str?: string): boolean {
    if (!str) return false;
    const matches = str.match(/\t/gm);
    return !!matches && matches.length === str.length;
}

function parseArrow(input: string): string[] | null {
    return input.match(/\<.*?\>|([^\>]+(?=\<))/gm);
}

function parseHTML(in_HTML: string, binds: any[], config: any = {}): Tree {
    let elements = parseArrow(in_HTML);
    if (elements) {
        elements = elements.filter(a => Boolean(a) && !isFullTabs(a) && !isFullSpaces(a)).map(a => purifyString(a)).filter(Boolean);
    } else {
        elements = [in_HTML];
    }
    const tree: Tree = {
        _opened: true,
        _is: 'puffin',
        _type: 'root',
        _props: [],
        children: [],
        addons: config?.addons || []
    };
    elements.forEach((element) => {
        parseElement(tree, element, binds, config);
    });
    return tree;
}

function parseElement(tree: Tree, element: string, binds: any[], config: any) {
    const _parts = element.split(/( )|(\/>)/gm).filter(Boolean);
    const _isElement = isElement(_parts[0]);
    const _type = _isElement ? getTag(_parts[0]) : '__text';
    const _value = !_isElement ? element : null;
    const _opened = isOpened(_parts[0]);
    const _closed = isClosed(_parts);
    const _props = getProps(element, binds, _isElement);
    const where = getLastNodeOpened(tree);
    addComponents(_props, where);
    if (isExternalComponent(_type, config)) {
        if (_opened) {
            addExternalComponent(_type, config, where, _closed, _props);
            return;
        }
    }
    if (isCompLinker(_props)) return;
    if (_opened) {
        const currentElement: any = {
            _type,
            _isElement,
            _opened: !_closed,
            _props,
            children: []
        };
        if (!_isElement) {
            currentElement._value = _value;
        }
        where.children.push(currentElement);
    } else {
        where._opened = false;
    }
}

function isExternalComponent(tag: string, config: any): boolean {
    return config && config.components && config.components[tag];
}

function mixClasses(_props1: any[], _props2: any[]): any[] {
    _props1.forEach(prop1 => {
        _props2.forEach((prop2, index) => {
            if (prop2.key === prop1.key && prop2.type === 'attributeText' && prop1.type === 'attributeText') {
                const newValue = prop2.attributeValue.replace(prop2.propIdentifier, prop2.value);
                prop1.attributeValue = `${prop1.attributeValue} ${newValue}`;
                _props2.splice(index, 1);
            }
        });
    });
    return _props2;
}

function getAttributeObjectProps(arrayProps: any[]): Record<string, any> {
    const objectProps: Record<string, any> = {};
    arrayProps.forEach(prop => {
        if (prop.type === 'attributeText' && !prop.attributeValue.includes('$BIND')) {
            objectProps[prop.key] = prop.attributeValue;
        } else {
            objectProps[prop.key] = prop.value;
        }
    });
    return { ...objectProps };
}

function addExternalComponent(tag: string, config: any, where: any, _closed: boolean, _props: any[]) {
    if (config && config.components && config.components[tag]) {
        if (typeof config.components[tag] !== 'function') {
            throw new Error(`${tag}() is not a function, so it cannot return an element.`);
        }
        const argumentProps = getAttributeObjectProps(_props);
        const componentExported = config.components[tag](argumentProps);
        if (Array.isArray(componentExported)) {
            componentExported.forEach(comp => {
                if (comp && Array.isArray(comp.children)) {
                    comp.children.forEach((child: any) => {
                        where.children.push(child);
                    });
                } else {
                    console.warn(`Component ${tag} returned an array item without children property.`);
                }
            });
        } else if (componentExported && Array.isArray(componentExported.children)) {
            componentExported.children.forEach((child: any, index: number) => {
                if (index === 0) {
                    if (!_closed) child._opened = true;
                    _props = mixClasses(child._props, _props);
                    child._props = [...child._props, _props].flat();
                }
                where.children.push(child);
            });
        } else {
            console.error(`Component ${tag} did not return a valid Puffin element (missing children array).`, componentExported);
        }
    }
}

function purifyString(str: string): string {
    return str.replace(/(\t|\r\n|\n|\r|\\)/gm, '');
}

function isElement(tag: string): boolean {
    return tag.search(/(<)|(>)/gm) === 0;
}

function getTag(tag: string): string {
    return tag.replace(/([<>/])/gm, '');
}

function isComponent(comp: any): boolean {
    return Array.isArray(comp) || comp._is === 'puffin';
}

function isFunctionEvent(name: string): boolean {
    return name === 'mounted';
}

function isPromise(func: any): boolean {
    return !!func && typeof func.then === 'function';
}

function isOpened(_type: string): boolean {
    return _type[1] !== '/' || _type[_type.length - 2] === '/';
}

function isClosed(parts: string[]): boolean {
    return parts[parts.length - 1] === '/>' || parts[0][parts[0].length - 2] === '/' || parts[0][1] === '/';
}

function addComponents(props: any[], where: any) {
    props.filter((prop) => {
        if (prop.type === 'comp') {
            if (Array.isArray(prop.value)) {
                prop.value.forEach((comp: any) => {
                    comp.children.forEach((child: any) => where.children.push(child));
                });
            } else {
                prop.value.children.forEach((child: any) => where.children.push(child));
            }
        }
    });
}

function isCompLinker(props: any[]): boolean {
    let isLinker = false;
    props.filter((prop) => {
        if (prop.type === 'comp') {
            isLinker = true;
        }
    });
    return isLinker;
}

function getBind(str: string): string {
    const result = str.match(/(\$BIND)[0-9]+\$/gm);
    if (!result) return '';
    return result[0];
}

function searchBind(str: string, binds: any[]): any {
    const result = getBind(str);
    if (!result) return '';
    const bind = result.match(/[0-9]+/gm);
    if (!bind) return '';
    const bindNumber = Number(purifyString(bind[0]));
    return binds[bindNumber];
}

function getAttributeProp(bind: string, propKey: string, propValue: string, binds: any[]): any {
    let attributeValue = propValue.replace(/"/gm, '');
    const propInternalValue = searchBind(bind, binds);
    const valueIdentifier = getBind(bind);
    const propIdentifier = bind;
    let propType: string = 'attributeText';
    if (isFunctionEvent(propKey)) {
        propType = 'puffinEvent';
    } else if (typeof propInternalValue === 'function' && propKey.includes(':')) {
        propType = 'event';
    } else if (typeof propInternalValue === 'object') {
        propType = 'attributeObject';
    } else if (typeof propInternalValue === 'function') {
        propType = 'attributeFunction';
    }
    return {
        key: propKey,
        type: propType,
        valueIdentifier,
        attributeValue,
        propIdentifier,
        value: propInternalValue
    };
}

function getTextProp(prop: string, binds: any[]): any {
    const propKey = getBind(prop);
    const propValue = searchBind(prop, binds);
    let type: string = 'text';
    if (isComponent(propValue)) {
        type = 'comp';
    } else if (isPromise(propValue)) {
        type = 'textPromise';
    } else if (typeof propValue === 'string' || typeof propValue === 'number' || typeof propValue === 'boolean') {
        type = 'text';
    } else if (typeof propValue === 'function') {
        type = 'textFunction';
    }
    return {
        key: propKey,
        type,
        value: propValue
    };
}

function getProps(element: string, binds: any[], isElement: boolean): any[] {
    const tokens = element.split(/(\$BIND\w+.)|([:]?[\w-]+=\"+[\s\w.,()\-\|&$%;{}:]+\")|(\<\w+)/gm);
    let insideElement = true;
    const props = tokens.map((token) => {
        if (Boolean(token) && !isFullSpaces(token)) {
            if (token[0] === '<') {
                insideElement = false;
            }
            if (token[token.length - 1] === '>') {
                token = token.slice(0, -1);
            }
            if (token[token.length - 1] === '/') {
                token = token.slice(0, -1);
            }
            const bindsFound = token.match(/(\$BIND)[0-9]+\$/gm) || [];
            const propBind = searchBind(token, binds);
            if (typeof propBind === 'string' && propBind.includes('=')) token = propBind;
            if (token.includes('=')) {
                const prop = token.split('=');
                const propKey = prop[0].trim();
                const propValue = prop[1];
                if (bindsFound.length > 0) {
                    return bindsFound.map((bind) => getAttributeProp(bind, propKey, propValue, binds));
                } else {
                    return getAttributeProp(propKey, propKey, propValue, binds);
                }
            } else if (token.includes('$BIND') && insideElement) {
                if (bindsFound.length > 0) {
                    return bindsFound.map((bind) => getTextProp(bind, binds));
                } else {
                    const propKey = getBind(token);
                    return getTextProp(propKey, binds);
                }
            }
        }
    }).flat().filter(Boolean);
    return props;
}

function getLastNodeOpened(tree: Tree): any {
    let lastChild: any = tree;
    tree.children.filter((child: any) => {
        if (child._opened === true && child._isElement === true) {
            if (child.children.length > 0) {
                lastChild = getLastNodeOpened(child);
            } else {
                lastChild = child;
            }
        }
    });
    return lastChild;
}

function parseBinds(input: any[], methods: any[]): { output: string; binds: any[] } {
    let output = input.join('to__BIND');
    const bindsMatched = output.match(/to__BIND/g);
    const bindsLength = bindsMatched ? bindsMatched.length : 0;
    const computedBinds: any[] = [];
    for (let i = 0; i < bindsLength; i++) {
        output = output.replace('to__BIND', `$BIND${i}$`);
        computedBinds.push(methods[i]);
    }
    return {
        output,
        binds: computedBinds
    };
}

export default element;
