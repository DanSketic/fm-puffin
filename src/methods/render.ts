import type { Tree, PuffinElement, CustomHTMLElement } from '../types';

// Utility functions
const removeSpaces = (str: string) => str.replace(' ', '');
const removeCommas = (str: string) => str.replace(/"/gm, '');

function createDOMElement(type: string): HTMLElement | SVGElement {
    switch (type) {
        case 'g': case 'defs': case 'stop': case 'linearGradient': case 'feColorMatrix': case 'feBlend': case 'filter': case 'path': case 'group': case 'polyline': case 'line': case 'rect': case 'circle': case 'svg':
            return document.createElementNS('http://www.w3.org/2000/svg', type);
        default:
            return document.createElement(type);
    }
}

function executeEvents(events: Array<Function>) {
    events.forEach(e => e());
}

function executeAddons(node: any, addons: any[] = []) {
    addons.forEach(addon => {
        if (addon && typeof addon.iterateElement === 'function') {
            addon.iterateElement(node);
        }
    });
}

function createUpdateFunction(node: any) {
    if (!node.updates) node.updates = [];
    if (!node.update) {
        node.update = () => {
            node.updates.forEach((update: Function) => update());
        };
    }
}

function appendProps(node: any, currentElement: any, puffinEvents: any[], updating = false, addons: any[]) {
    const props = currentElement._props || [];
    let textValue = currentElement._value;
    if (!node.props) node.props = {};
    props.forEach((prop: any) => {
        switch (prop.type) {
            case 'puffinEvent':
                if (prop.key === 'mounted') {
                    puffinEvents.push(prop.value.bind(node));
                }
                break;
            case 'event':
                if (!updating) node.addEventListener(prop.key.replace(':', ''), (e: any) => prop.value.bind(node)(e));
                break;
            case 'attributeText': {
                const attrExists = node.getAttribute(prop.key);
                prop.key = removeSpaces(prop.key);
                prop.value = removeCommas(`${prop.value}`);
                let newValue;
                if (attrExists) {
                    newValue = node.getAttribute(prop.key)?.replace(prop.valueIdentifier, prop.value);
                } else {
                    newValue = prop.attributeValue.replace(prop.valueIdentifier, prop.value);
                }
                node.setAttribute(prop.key, newValue ?? '');
                node.props[prop.key] = prop.value;
                break;
            }
            case 'attributeObject':
                node.props[prop.key] = prop.value;
                break;
            case 'attributeFunction': {
                const propValue = prop.value();
                prop.key = removeSpaces(prop.key);
                let newValue;
                if (!node.getAttribute(prop.key)) {
                    newValue = removeCommas(prop.attributeValue.replace(prop.propIdentifier, propValue));
                    node.setAttribute(prop.key, newValue);
                } else {
                    newValue = removeCommas(node.getAttribute(prop.key)?.replace(prop.propIdentifier, propValue) ?? '');
                    node.setAttribute(prop.key, newValue);
                }
                node.props[prop.key] = newValue;
                prop.propIdentifier = propValue;
                break;
            }
            case 'textPromise':
                prop.value.then((promiseComp: any) => {
                    render(promiseComp, node);
                });
                currentElement._value = textValue.replace(prop.key, '');
                break;
            case 'textFunction': {
                const newValue = prop.value();
                if (typeof newValue === 'object') {
                    if (Array.isArray(newValue)) {
                        newValue.forEach((item: any) => {
                            setTimeout(() => {
                                item.addons = [...item.addons, ...addons];
                                render(item, node);
                            }, 0);
                        });
                    } else {
                        setTimeout(() => {
                            newValue.addons = [...newValue.addons, ...addons];
                            render(newValue, node);
                        }, 0);
                    }
                    currentElement._value = textValue.replace(prop.key, '');
                } else {
                    currentElement._value = textValue.replace(prop.key, newValue);
                    prop.key = newValue;
                }
                break;
            }
            case 'text':
                currentElement._value = textValue.replace(prop.key, prop.value);
                break;
        }
    });
}

function createComponent(currentElement: any, componentNode: any, binds: any[] = [], puffinEvents: any[] = [], addons: any[] = []): any {
    const currentNode = createDOMElement(currentElement._type) as any; // Allow custom fields
    if (currentElement._isElement) {
        if (!componentNode) {
            componentNode = currentNode;
        } else {
            componentNode.appendChild(currentNode);
        }
        if (!currentNode.updates) currentNode.updates = [];
        if (!currentNode.update) {
            currentNode.update = () => {
                currentNode.updates.forEach((update: Function) => update());
            };
        }
        appendProps(currentNode, currentElement, puffinEvents, false, addons);
        executeAddons(currentNode, addons);
        currentNode.updates.push(() => {
            appendProps(currentNode, currentElement, [], true, addons);
        });
        currentNode.e = currentElement;
    } else if (!currentElement._isElement && currentElement._type === '__text') {
        appendProps(componentNode, currentElement, puffinEvents, false, addons);
        if (!componentNode.updates) componentNode.updates = [];
        componentNode.updates.push(() => {
            appendProps(componentNode, currentElement, [], true, addons);
            componentNode.innerText = currentElement._value;
        });
        componentNode.innerText += currentElement._value;
    }
    currentElement.children.forEach((child: any) => createComponent(child, currentNode, binds, puffinEvents, addons));
    componentNode.events = puffinEvents;
    return componentNode;
}

export function render(component: Tree, parent: Node, options: { position?: number } = {}): any {
    if (!component || !component.children || component.children.length === 0) return null;
    const comp = createComponent(component.children[0], null, [], [], component.addons);
    if (options.position != null) {
        parent.insertBefore(comp, parent.childNodes[options.position]);
    } else {
        parent.appendChild(comp);
    }
    executeEvents(comp.events);
    return comp;
}

export function createElement(component: Tree): any {
    if (!component || !component.children || component.children.length === 0) return null;
    const comp = createComponent(component.children[0], null, [], [], component.addons);
    executeEvents(comp.events);
    return comp;
}
