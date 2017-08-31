'use strict';

window.ready = (callback) => {
    let completed, detach;

    completed = () => {
        detach();
        callback();
    };

    detach = () => {
        document.removeEventListener('DOMContentLoaded', completed);
    };

    document.addEventListener('DOMContentLoaded', completed);
};

class EventBusClass {
    constructor() {
        this.listeners = {};
    }

    addEventListener(type, callback) {
        if (typeof this.listeners[type] !== 'undefined') {
            this.listeners[type].push({ callback: callback });
        } else {
            this.listeners[type] = [{ callback: callback }];
        }
    }

    dispatch(type, data) {
        if (this.listeners[type] !== 'undefined') {
            let listeners = this.listeners[type].slice();
            for (let i = 0; i < listeners.length; i++) {
                if (listeners[i] && listeners[i].callback) {
                    listeners[i].callback.call(this, data);
                }
            }
        }
    }
}

window.EventBus = new EventBusClass();
