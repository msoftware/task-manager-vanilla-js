'use strict';

ready(() => {
    new App();
});

class Task {
    constructor(id, title, description) {
        this.element = this.getElement();

        this.id = id || Number(new Date()).toString(36);
        this.title = title || '';
        this.description = description || '';
    }

    get title() {
        return this.element.firstChild.innerText;
    }

    set title(newValue) {
        this.element.firstChild.innerText = newValue;
    }

    getElement() {
        let li = document.createElement('li');
        li.classList.add('task');

        let span = document.createElement('span');

        li.appendChild(span);

        return li;
    }

    save() {
        localStorage.setItem(this.id, this.serialize());
    }

    serialize() {
        return JSON.stringify({
            id: this.id,
            title: this.title,
            description: this.description
        });
    }

    static deserialize(str) {
        let obj = JSON.parse(str);
        return new Task(obj.id, obj.title, obj.description);
    }
}

class TaskEditPanel {
    constructor() {
        this.element = this.getElement();
        this.setUpListeners();
    }

    get activeTask() { 
        return this.currentTask;
    }

    set activeTask(task) {
        this.currentTask = task;

        let title = this.element.querySelector('input');
        title.value = task.title;
        title.focus();

        let description = this.element.querySelector('textarea');
        description.value = task.description;
    }

    getElement() {
        return document.querySelector('.task-edit-panel');
    }

    setUpListeners() {
        let closeButton = this.element.querySelector('.btn-close');
        closeButton.addEventListener('click', () => {
            EventBus.dispatch('closeTaskEditPanel');
        });

        let titleInput = this.element.querySelector('input');
        titleInput.addEventListener('keyup', (event) => {
            if (event.keyCode === 13) {
                this.activeTask.title = titleInput.value;
                this.activeTask.save();
            }
        });
        titleInput.addEventListener('blur', () => {
            this.activeTask.title = titleInput.value;
            this.activeTask.save();
        });

        let descriptionTextarea = this.element.querySelector('textarea');
        descriptionTextarea.addEventListener('keyup', (event) => {
            if (event.keyCode === 13) {
                this.activeTask.description = descriptionTextarea.value;
                this.activeTask.save();
            }
        });
        descriptionTextarea.addEventListener('blur', () => {
            this.activeTask.description = descriptionTextarea.value;
            this.activeTask.save();
        });
    }

    show() {
        this.element.classList.remove('hide');
    }

    hide() {
        this.element.classList.add('hide');
    }
}

class TaskListPanel {
    constructor() {
        this.element = this.getElement();
        this.setUpListeners();

        this.tasks = [];
        this.activeTask = null;

        this.loadTasks();
    }

    getElement() {
        return document.querySelector('.task-list-panel');
    }

    setUpListeners() {
        let addTaskButton = document.querySelector('.task-list-panel .toolbar .btn-add-task');
        addTaskButton.addEventListener('click', () => {
            let task = new Task();
            this.addTask(task);
            this.activateTask(task);
        });
    }

    loadTasks() {
        let keys = Object.keys(localStorage);
        keys.forEach((key) => {
            let task = Task.deserialize(localStorage[key]);
            this.addTask(task);
        });
    }

    addTask(task) {
        this.tasks.push(task);

        let taskList = this.element.querySelector('ul');
        taskList.insertBefore(task.element, taskList.firstChild);

        task.element.addEventListener('click', () => {
            this.activateTask(task);
        });
    }

    activateTask(task) {
        this.activeTask = task;

        let allTaskElements = this.element.querySelectorAll('.task');
        allTaskElements.forEach((taskElement) => {
            taskElement.classList.remove('active');
        });
        task.element.classList.add('active');

        EventBus.dispatch('openTaskEditPanel', task);
    }
}

class App {
    constructor() {
        this.listeners = {};

        this.taskListPanel = new TaskListPanel();
        this.taskEditPanel = new TaskEditPanel();

        this.setUpListeners();
    }

    setUpListeners() {
        EventBus.addEventListener('openTaskEditPanel', (task) => {
            this.switchToEditMode();
            this.taskEditPanel.show();

            this.taskEditPanel.activeTask = task;
        });

        EventBus.addEventListener('closeTaskEditPanel', () => {
            this.switchToViewMode();
            this.taskEditPanel.hide();
        });

        let forms = document.querySelectorAll('form');
        forms.forEach((form) => {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
            });
        });
    }

    switchToViewMode() {
        let panels = document.querySelector('.panels');
        panels.classList.remove('edit-mode');
        panels.classList.add('view-mode');
    }

    switchToEditMode() {
        let panels = document.querySelector('.panels');
        panels.classList.remove('view-mode');
        panels.classList.add('edit-mode');
    }
}
