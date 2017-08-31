'use strict';

ready(() => {
    new App();
});

class Task {
    constructor(title, description) {
        this.element = this.getElement();

        this.title = title;
        this.description = description;
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

        if (task.description !== '') {
            let description = this.element.querySelector('textarea');
            description.innerHTML = task.description;
        }
    }

    getElement() {
        return document.querySelector('.task-edit-panel');
    }

    setUpListeners() {
        let closeBtn = this.element.querySelector('.btn-close');
        closeBtn.addEventListener('click', () => {
            EventBus.dispatch('closeTaskEditPanel');
        });

        let titleInput = this.element.querySelector('input');
        titleInput.addEventListener('keyup', () => {
            this.activeTask.title = titleInput.value;
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
    }

    getElement() {
        return document.querySelector('.task-list ul');
    }

    setUpListeners() {
        let addTaskButton = document.querySelector('.task-list-panel .toolbar .btn-add-task');
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
