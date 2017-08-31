'use strict';

document.ready = (callback) => {
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

document.dispatch = (event, data) => {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
};
