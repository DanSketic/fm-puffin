// Puffin types - modern TypeScript
export interface ElementProps {
    key: string;
    type: 'puffinEvent' | 'event' | 'attributeObject' | 'attributeFunction' | 'attributeText' | 'comp' | 'textPromise' | 'text' | 'textFunction';
    valueIdentifier?: string;
    attributeValue?: string;
    propIdentifier?: string;
    value: any;
}

export interface Tree {
    _opened: boolean;
    _is: 'puffin';
    children: PuffinElement[];
    addons: any[];
}

export interface PuffinElement {
    _type: string;
    _isElement: boolean;
    _opened: boolean;
    _props: ElementProps[];
    children: PuffinElement[];
    _value?: string | null;
}

export interface CustomHTMLElement extends HTMLElement {
    updates: Function[];
    update: () => void;
    props: { [key: string]: any };
    e: PuffinElement;
    events: Function[];
    children: HTMLCollectionOf<HTMLElement>;
    getAttribute(qualifiedName: string): string | null;
    style: CSSStyleDeclaration;
    classList: DOMTokenList;
    dispatchEvent(event: Event): boolean;
    render?: (path: string) => void;
}

export interface RouterLinkData {
    group: string;
    node: CustomHTMLElement;
}

export interface RouterBoxData {
    group: string;
    node: CustomHTMLElement;
    pages: { node: CustomHTMLElement; endpoint: string | null }[];
}

export interface CurrentLocation {
    protocol: string;
    fulldomain: string;
    domain: string;
    endpoint: string;
    endpoints: string[];
}
