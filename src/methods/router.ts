import element from './element';
import { createElement } from './render';
import type { CustomHTMLElement, Tree } from '../types';

declare global {
    interface Window {
        prouter: {
            links: Array<{ group: string; node: HTMLElement }>;
            boxes: Array<{ group: string; node: HTMLElement; pages: any[] }>;
        };
    }
}

if (!window.prouter) {
    window.prouter = { links: [], boxes: [] };
}

function renderBox(_box: HTMLElement, _path: string) {
    hideRoutes(_box);
    showRoute(_box, _path);
}

function showRoute(_box: HTMLElement, route: string, display?: string) {
    Array.from(_box.children).forEach((routeNode: any) => {
        const routeEndpoint = simulateLocation(routeNode.getAttribute('from') ?? '');
        const simulatedDefaultRouter = simulateLocation(_box.getAttribute('default') ?? '');
        const simulatedCurrentRoute = simulateLocation(route);
        if (simulatedCurrentRoute.match(routeEndpoint)) {
            (routeNode as HTMLElement).style.display = 'block';
            routeNode.dispatchEvent(new CustomEvent('displayed'));
            activeLink(_box.getAttribute('group') ?? '', simulatedCurrentRoute);
            history.replaceState({}, '', route);
        } else if (routeEndpoint.match(simulatedCurrentRoute) && location.toString() === simulatedCurrentRoute) {
            (routeNode as HTMLElement).style.display = 'block';
            routeNode.dispatchEvent(new CustomEvent('displayed'));
            activeLink(_box.getAttribute('group') ?? '', simulatedDefaultRouter);
            history.replaceState({}, '', _box.getAttribute('default') ?? '');
        }
    });
}

function onlyDisplay(_box: HTMLElement, route: string) {
    const simulatedDefaultRouter = simulateLocation(_box.getAttribute('default') ?? '');
    const simulatedCurrentRoute = simulateLocation(route);
    let anyMatch = false;
    Array.from(_box.children).forEach((routeNode: any) => {
        const routeEndpoint = simulateLocation(routeNode.getAttribute('from') ?? '');
        if (simulatedCurrentRoute.match(routeEndpoint)) {
            (routeNode as HTMLElement).style.display = 'block';
            activeLink(_box.getAttribute('group') ?? '', routeEndpoint);
            anyMatch = true;
        }
    });
    if (!anyMatch) {
        Array.from(_box.children).forEach((routeNode: any) => {
            const routeEndpoint = simulateLocation(routeNode.getAttribute('from') ?? '');
            if (simulatedDefaultRouter.match(routeEndpoint)) {
                (routeNode as HTMLElement).style.display = 'block';
                activeLink(_box.getAttribute('group') ?? '', routeEndpoint);
            }
        });
    }
}

function hideRoutes(_box: HTMLElement) {
    Array.from(_box.children).forEach((rt: any) => {
        (rt as HTMLElement).style.display = 'none';
        const event = new CustomEvent('hidden', {});
        rt.dispatchEvent(event);
    });
}

function activeLink(groupLink: string, routerLink: string) {
    window.prouter.links.forEach(({ group, node }) => {
        if (group === groupLink) {
            node.classList.remove('active');
            const simulatedLinkRoute = simulateLocation(node.getAttribute('to') ?? '');
            if (routerLink.match(simulatedLinkRoute)) {
                node.classList.add('active');
            }
        }
    });
}

function addLink(group: string, node: HTMLElement) {
    window.prouter.links.push({ group, node });
}

function addBox(group: string, node: HTMLElement, pages: any[]) {
    window.prouter.boxes.push({ group, node, pages });
}

function getBox(group: string): HTMLElement | null {
    return window.prouter.boxes.find(box => box.group === group)?.node ?? null;
}

function getBoxRoutes(node: HTMLElement) {
    return Object.values(node.children).map((routeNode: any) => ({
        node: routeNode,
        endpoint: routeNode.getAttribute('from'),
    }));
}

function routerBox(): Tree {
    function mounted(this: HTMLElement) {
        addBox(
            this.getAttribute('group') ?? '',
            this,
            getBoxRoutes(this)
        );
        (this as any).render = (_path: string) => {
            renderBox(this, _path);
        };
        const { endpoint } = getCurrentLocation();
        hideRoutes(this);
        showRoute(this, endpoint);
        onlyDisplay(this, endpoint);
    }
    function hidden(this: HTMLElement) {
        hideRoutes(this);
    }
    return element`<div :hidden="${hidden}" mounted="${mounted}"></div>` as Tree;
}

function simulateLocation(route: string = ''): string {
    const { fulldomain } = getCurrentLocation();
    return `${fulldomain}${route}`.trim();
}

function getCurrentLocation() {
    const currentLocation = window.location.toString().split(/(\/)|(\#)/g).filter(Boolean);
    const endpoints = currentLocation.slice(4);
    return {
        protocol: currentLocation[0],
        fulldomain: currentLocation.slice(-currentLocation.length, 4).join(''),
        domain: currentLocation[2],
        endpoint: window.location.pathname,
        endpoints,
    };
}

function routerLink(): Tree {
    function click(this: HTMLElement) {
        const linkEndpoint = this.getAttribute('to') ?? '';
        const linkGroup = this.getAttribute('group') ?? '';
        const routerBox = getBox(linkGroup);
        if (routerBox) {
            (routerBox as any).render(linkEndpoint);
        }
    }
    function mounted(this: HTMLElement) {
        addLink(this.getAttribute('group') ?? '', this);
        const routeEndpoint = simulateLocation(this.getAttribute('to') ?? '');
        if (window.location.toString().match(routeEndpoint)) {
            this.classList.add('active');
        }
    }
    return element`<a mounted="${mounted}" :click="${click}"></a>` as Tree;
}

export {
    routerBox,
    routerLink
};
