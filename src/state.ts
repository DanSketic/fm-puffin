/**
 * Puffin state handler - modern TypeScript
 * Teljesen kompatibilis a régi JS API-val
 */
function exeCallbacks(list: Array<{ callback: Function }>, ...args: any[]) {
    [...list].forEach(a => {
        try {
            a.callback(...args);
        } catch (err) {
            console.error('Unhandled error in a puffin state: ', err);
        }
    });
}

export default function state(initialData: Record<string, any> = {}) {
    const self: any = {};
    self.changedCallbacks = [];
    self.keyChangedCallbacks = {};
    self.eventCallbacks = {};
    const observer = {
        set: (object: any, name: string, value: any) => {
            object[name] = value;
            exeCallbacks(self.changedCallbacks, object, name);
            exeCallbacks(self.keyChangedCallbacks[name] || [], value);
            return true;
        }
    };
    const changed = (callback: Function) => {
        self.changedCallbacks.push({ callback });
        return {
            cancel: () => cancelEvent(self.changedCallbacks, callback)
        };
    };
    const keyChanged = (keyName: string, callback: Function) => {
        if (!self.keyChangedCallbacks[keyName]) self.keyChangedCallbacks[keyName] = [];
        self.keyChangedCallbacks[keyName].push({ callback });
        return {
            cancel: () => cancelEvent(self.keyChangedCallbacks[keyName], callback)
        };
    };
    const cancelEvent = (list: Array<{ callback: Function }>, callback: Function) => {
        list.forEach((event, index) => {
            if (callback === event.callback) {
                list.splice(index, 1);
            }
        });
    };
    const on = <eventKey extends string | number | symbol>(eventName: eventKey | eventKey[], callback?: (eventArgs: any) => void): { cancel: () => void } => {
        let events: (string | number | symbol)[] = [];
        if (Array.isArray(eventName)) {
            events = eventName as (string | number | symbol)[];
        } else {
            events.push(eventName);
        }
        let eventsToReturn: (string | number | symbol)[] = [];
        let final: any;
        events.forEach(eventToRegister => {
            if (!self.eventCallbacks[eventToRegister]) self.eventCallbacks[eventToRegister] = [];
            if (callback) {
                self.eventCallbacks[eventToRegister].push({ callback });
                eventsToReturn.push(eventToRegister);
            } else {
                self.eventCallbacks[eventToRegister].push({ callback() { final(...arguments); } });
                eventsToReturn.push(eventToRegister);
            }
        });
        return {
            cancel: () => {
                if (callback) {
                    eventsToReturn.forEach(eventName => {
                        cancelEvent(self.eventCallbacks[eventName], callback);
                    });
                }
            }
        };
    };
    const emit = <eventKey extends string | number | symbol>(eventName: eventKey, data?: any) => {
        exeCallbacks(self.eventCallbacks[eventName] || [], data);
    };
    const triggerChange = (...args: any[]) => {
        exeCallbacks(self.changedCallbacks, ...args);
    };
    const once = <eventKey extends string | number | symbol>(
        eventName: eventKey,
        callback: Function
    ): { cancel: () => void } => {
        if (!self.eventCallbacks[eventName]) self.eventCallbacks[eventName] = [];
        function customCallback(...args: any[]) {
            callback(...args);
            cancelEvent(self.eventCallbacks[eventName], customCallback);
        }
        self.eventCallbacks[eventName].push({ callback: customCallback });
        return {
            cancel: () => cancelEvent(self.eventCallbacks[eventName], customCallback)
        };
    };
    return {
        triggerChange,
        changed,
        keyChanged,
        on,
        once,
        emit,
        data: new Proxy(initialData, observer),
        info: 'state'
    };
}
