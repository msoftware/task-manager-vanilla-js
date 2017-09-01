'use strict';

ready(() => {
    new App();
});

class Task {
    constructor(id, title, description) {
        this.id = id || Number(new Date()).toString(36);
        this.element = this.getElement();
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
        li.id = this.id;
        li.classList.add('task');
        li.setAttribute('draggable', true);

        let span = document.createElement('span');

        li.appendChild(span);

        return li;
    }

    save() {
        if (this.title !== '' || this.description !== '') {
            localStorage.setItem(this.id, this.serialize());
        }
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

        let taskList = this.element.querySelector('ul');

        let validTargetItem = (target) => {
            if (target.nodeName === 'SPAN') {
                return target.parentElement;
            } else if (target.nodeName === 'LI') {
                return target;
            } else {
                return null;
            }
        };

        let shouldMoveItem = (target, pos) => {
            let draggedItem = document.querySelector('.task-list-panel .task-list .dragging');
            let previousSibling = draggedItem.previousElementSibling;
            let nextSibling = draggedItem.nextElementSibling;

            let isSameTargetItem = (target === draggedItem);
            let isMovingUpKeepingPos = (target === previousSibling && pos >= target.offsetHeight/2);
            let isMovingDownKeepingPos = (target === nextSibling && pos <= target.offsetHeight/2);

            if (isSameTargetItem || isMovingUpKeepingPos || isMovingDownKeepingPos) {
                return false;
            }
            return true;
        };

        let resetTaskClasses = () => {
            let allElements = taskList.querySelectorAll('.task.insert-before, .task.insert-after');
            allElements.forEach((element) => {
                element.classList.remove('insert-before');
                element.classList.remove('insert-after');
            });
        };

        // Needed to know if the dragged item is out of the drop area
        // or just out of a child element.
        // Explanation here: https://stackoverflow.com/a/21002544/3542459
        let enteredDropAreaCounter = 0;

        taskList.addEventListener('dragenter', (event) => {
            event.preventDefault();
            enteredDropAreaCounter++;
        });

        taskList.addEventListener('dragleave', (event) => {
            event.preventDefault();
            enteredDropAreaCounter--;
            if (enteredDropAreaCounter === 0) {
                resetTaskClasses();
            }
        });

        taskList.addEventListener('dragover', (event) => {
            event.preventDefault();

            resetTaskClasses();

            let targetItem = validTargetItem(event.target);
            let pos = event.offsetY;

            if (targetItem && shouldMoveItem(targetItem, pos)) {
                if (pos <= targetItem.offsetHeight/2) {
                    targetItem.classList.add('insert-before');
                } else {
                    targetItem.classList.add('insert-after');
                }
            }
        });

        taskList.addEventListener('drop', (event) => {
            event.preventDefault();

            enteredDropAreaCounter = 0;
            resetTaskClasses();

            let taskId = event.dataTransfer.getData('taskId');
            let draggedItem = document.getElementById(taskId);

            let targetItem = validTargetItem(event.target);
            let pos = event.offsetY;

            if (targetItem) {
                if (pos >= targetItem.offsetHeight/2) {
                    taskList.insertBefore(draggedItem, targetItem.nextElementSibling);
                } else {
                    taskList.insertBefore(draggedItem, targetItem);
                }
            }
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

        task.element.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('taskId', event.target.id);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.dropEffect = 'move';
            setTimeout(() => {
                event.target.classList.add('dragging');
            });
        });

        task.element.addEventListener('dragend', (event) => {
            event.target.classList.remove('dragging');
        });
    }

    activateTask(task) {
        this.activeTask = task;

        let allTaskElements = this.element.querySelectorAll('.task');
        allTaskElements.forEach((taskElement) => {
            taskElement.classList.remove('active');
        });
        this.activeTask.element.classList.add('active');

        EventBus.dispatch('openTaskEditPanel', task);
    }

    deactivateTask() {
        this.activeTask.element.classList.remove('active');
        this.activeTask = null;
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
            this.taskListPanel.deactivateTask();
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
