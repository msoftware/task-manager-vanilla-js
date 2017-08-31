'use strict';

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

class Task {
    constructor(title, description) {
        this.element = this.getElement();

        this.title = title;
        this.description = description;
    }

    getElement() {
        let li = document.createElement('li');
        li.classList.add('task');

        let span = document.createElement('span');

        let text = document.createTextNode(this.title);

        span.appendChild(text);
        li.appendChild(span);

        return li;
    }
}

class EditTaskPanel {
    constructor() {
        this.element = this.getElement();
        this.setUpListeners();
    }

    getElement() {
        return document.querySelector('.edit-task-panel');
    }

    setUpListeners() {
        let closeBtn = this.element.querySelector('.btn-close');
        closeBtn.addEventListener('click', () => {
            document.dispatch('closeEditTaskPanel');
        });

        let titleInput = this.element.querySelector('input');
        titleInput.addEventListener('keyup', () => {
            this.activeTask.title = titleInput.value;
            EventBus.dispatch('taskChanged', this.activeTask);
        });
    }

    get activeTask() { 
        return this.currentTask;
    }

    set activeTask(task) {
        this.currentTask = task;

        let title = this.element.querySelector('input');
        title.value = task.title;
        title.focus();

        if (task.description !== '') {
            let description = this.element.querySelector('textarea');
            description.innerHTML = task.description;
        }
    }
}

class TaskPanel {
    constructor() {
        this.element = this.getElement();
        this.setUpListeners();

        this.tasks = [];
        this.activeTask = null;
    }

    getElement() {
        return document.querySelector('.task-list ul');
    }

    setUpListeners() {
        let addTaskButton = document.querySelector('.task-panel .toolbar .btn-add-task');
        addTaskButton.addEventListener('click', () => {
            this.addTask(new Task('', ''));
        });
    }

    addTask(task) {
        this.tasks.push(task);
        this.element.insertBefore(task.element, this.element.firstChild);

        task.element.addEventListener('click', () => {
            this.activateTask(task);
        });

        this.activateTask(task);
    }

    activateTask(task) {
        this.activeTask = task;

        let allTaskElements = this.element.querySelectorAll('.task');
        allTaskElements.forEach((taskElement) => {
            taskElement.classList.remove('active');
        });
        task.element.classList.add('active');

        EventBus.dispatch('openEditTaskPanel', task);
    }
}

class App {
    constructor() {
        this.listeners = {};

        this.taskPanel = new TaskPanel();
        this.editTaskPanel = new EditTaskPanel();

        this.setUpListeners();
    }

    setUpListeners() {
        EventBus.addEventListener('openEditTaskPanel', (task) => {
            this.taskPanel.element.classList.add('editing-task');
            this.editTaskPanel.element.classList.remove('hide');

            this.editTaskPanel.activeTask = task;
        });

        EventBus.addEventListener('closeEditTaskPanel', () => {
            this.taskPanel.element.classList.remove('editing-task');
            this.editTaskPanel.element.classList.add('hide');
        });

        EventBus.addEventListener('taskChanged', (task) => {
            let activeTask = this.taskPanel.activeTask;

            if (activeTask) {
                let span = activeTask.element.querySelector('span');
                span.innerHTML = task.title;
            }
        });
    }
}


document.ready(() => {
    new App();
});
