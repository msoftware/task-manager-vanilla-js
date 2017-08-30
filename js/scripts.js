'use strict';

const ready = (callback) => {
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

ready(() => {
    console.log('Tudo pronto!');
});
