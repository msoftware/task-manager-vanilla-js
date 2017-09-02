'use strict';

const MAX_PLACEHOLDERS = 12;

class Task {

    constructor(id, order, title, description) {
        this.id = id || Number(new Date()).toString(36);
        this.order = order || -1;
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
        li.classList.add('task');
        li.setAttribute('id', this.id);
        li.setAttribute('data-order', this.order);
        li.setAttribute('draggable', true);

        let span = document.createElement('span');

        li.appendChild(span);

        return li;
    }

    save() {
        localStorage.setItem(this.id, this.serialize());
    }

    remove() {
        this.element.remove();
        localStorage.removeItem(this.id);
    }

    serialize() {
        return JSON.stringify({
            id: this.id,
            order: this.order,
            title: this.title,
            description: this.description
        });
    }

    static deserialize(str) {
        let obj = JSON.parse(str);
        return new Task(obj.id, obj.order, obj.title, obj.description);
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

        if (this.currentTask) {
            let title = this.element.querySelector('input');
            title.value = this.currentTask.title;
            title.focus();

            let description = this.element.querySelector('textarea');
            description.value = this.currentTask.description;
        }
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

    open() {
        this.element.classList.remove('hide');
        this.element.classList.add('open-panel');
    }

    close() {
        this.activeTask = null;

        this.element.classList.remove('open-panel');

        this.element.classList.add('close-panel');
        setTimeout(() => {
            this.element.classList.remove('close-panel');
            this.element.classList.add('hide');
        }, 500);
    }
}

class TaskListPanel {

    constructor() {
        this.element = this.getElement();
        this.handler = new DragDropHandler();
        this.setUpListeners();

        this.tasks = {};
        this.activeTask = null;

        this.loadTasks();
    }

    getElement() {
        return document.querySelector('.task-list-panel');
    }

    getList() {
        return this.element.querySelector('ul');
    }

    setUpListeners() {
        let addTaskButton = this.element.querySelector('.btn-add-task');
        addTaskButton.addEventListener('click', () => {
            let task = new Task();
            this.addTask(task);
            this.activateTask(task);
            this.updateTasksOrder();
        });

        let taskList = this.getList();

        this.handler.dragEnter(taskList);

        this.handler.dragLeave(taskList, TaskListUtil.resetTaskClasses);

        this.handler.dragOver(taskList, () => {
            TaskListUtil.resetTaskClasses();

            let targetItem = TaskListUtil.validTargetItem(event.target);
            let pos = event.offsetY;

            if (targetItem) {
                // Drop area for new position
                if (TaskListUtil.shouldMoveItem(targetItem, pos)) {
                    if (pos <= targetItem.offsetHeight/2) {
                        targetItem.classList.add('insert-before');
                    } else {
                        targetItem.classList.add('insert-after');
                    }
                }
                // Drop area for same position
                else {
                    let draggedItem = taskList.querySelector('.dragging');
                    let previousSibling = draggedItem.previousElementSibling;
                    let nextSibling = draggedItem.nextElementSibling;

                    if (previousSibling) {
                        previousSibling.classList.add('insert-after');
                    } else if (nextSibling) {
                        nextSibling.classList.add('insert-before');
                    }
                }
            }
        });

        this.handler.drop(taskList, () => {
            TaskListUtil.resetTaskClasses();

            let taskId = event.dataTransfer.getData('taskId');
            let draggedItem = document.getElementById(taskId);

            let targetItem = TaskListUtil.validTargetItem(event.target);
            let pos = event.offsetY;

            if (targetItem) {
                if (pos >= targetItem.offsetHeight/2) {
                    taskList.insertBefore(draggedItem, targetItem.nextElementSibling);
                } else {
                    taskList.insertBefore(draggedItem, targetItem);
                }
                this.updateTasksOrder();
            }
        });
    }

    loadTasks() {
        let tasks = [];

        let keys = Object.keys(localStorage);
        keys.forEach((key) => {
            tasks.push(Task.deserialize(localStorage[key]));
        });

        tasks.sort((left, right) => {
            let l = left.order;
            let r = right.order;
            return ((l > r) ? -1 : ((l < r) ? 1 : 0));
        });

        tasks.forEach((task) => {
            this.addTask(task);
        });
    }

    addTask(task) {
        this.tasks[task.id] = task;

        let taskList = this.getList();
        taskList.insertBefore(task.element, taskList.firstElementChild);

        task.element.addEventListener('click', () => {
            this.activateTask(task);
        });

        this.handler.dragStart(task.element, (event) => {
            event.dataTransfer.setData('taskId', event.target.id);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.dropEffect = 'move';
            setTimeout(() => {
                event.target.classList.add('dragging');
            });
        });

        this.handler.dragEnd(task.element, (event) => {
            event.target.classList.remove('dragging');
        });

        this.removePlaceholder();
    }

    removeTask(task) {
        delete this.tasks[task.id];
        task.remove();

        this.addPlaceholder();
    }

    activateTask(task) {
        this.activeTask = task;

        let allTaskElements = this.element.querySelectorAll('.task.active');
        allTaskElements.forEach((taskElement) => {
            taskElement.classList.remove('active');
        });
        this.activeTask.element.classList.add('active');

        EventBus.dispatch('openTaskEditPanel', task);
    }

    deactivateTask() {
        if (this.activeTask) {
            this.activeTask.element.classList.remove('active');
            this.activeTask = null;
        }
    }

    clearEmptyTask() {
        if (this.activeTask && this.activeTask.title === '' && this.activeTask.description === '') {
            this.removeTask(this.activeTask);
            this.updateTasksOrder();
        }
    }

    updateTasksOrder() {
        let taskList = this.getList();
        let taskElements = taskList.querySelectorAll('.task');
        taskElements.forEach((taskElement, order) => {
            taskElement.setAttribute('data-order', order);
            this.tasks[taskElement.id].order = order;
            this.tasks[taskElement.id].save();
        });
    }

    addPlaceholder() {
        let taskList = this.getList();
        let listItems = taskList.querySelectorAll('li');
        if (listItems.length < MAX_PLACEHOLDERS) {
            let li = document.createElement('li');
            li.classList.add('placeholder');

            let span = document.createElement('span');
            li.appendChild(span);

            taskList.appendChild(li);
        }
    }

    removePlaceholder() {
        let taskList = this.getList();
        let listItems = taskList.querySelectorAll('li');
        if (listItems.length > MAX_PLACEHOLDERS) {
            let placeholder = taskList.querySelector('.placeholder');
            if (placeholder) {
                placeholder.remove();
            }
        }
    }
}
