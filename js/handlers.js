'use strict';

class DragDropHandler {

    constructor() {
        // Needed to know if the dragged item is out of the drop area or just out of a child element.
        // Explanation here: https://stackoverflow.com/a/21002544/3542459
        this.enteredDropAreaCounter = 0;
    }

    dragStart(element, callback) {
        element.addEventListener('dragstart', (event) => {
            if (callback) {
                callback(event);
            }
        });
    }

    dragEnd(element, callback) {
        element.addEventListener('dragend', (event) => {
            if (callback) {
                callback(event);
            }
        });
    }

    dragEnter(element, callback) {
        element.addEventListener('dragenter', (event) => {
            event.preventDefault();
            this.enteredDropAreaCounter++;
            if (callback) {
                callback();
            }
        });
    }

    dragLeave(element, callback) {
        element.addEventListener('dragleave', (event) => {
            event.preventDefault();
            this.enteredDropAreaCounter--;
            if (this.enteredDropAreaCounter === 0 && callback) {
                callback();
            }
        });
    }

    dragOver(element, callback) {
        element.addEventListener('dragover', (event) => {
            event.preventDefault();
            if (callback) {
                callback();
            }
        });
    }

    drop(element, callback) {
        element.addEventListener('drop', (event) => {
            event.preventDefault();
            this.enteredDropAreaCounter = 0;
            if (callback) {
                callback();
            }
        });
    }
}
