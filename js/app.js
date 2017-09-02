'use strict';

ready(() => {
    new App();
});

class App {

    constructor() {
        this.taskListPanel = new TaskListPanel();
        this.taskEditPanel = new TaskEditPanel();

        this.setUpListeners();
    }

    setUpListeners() {
        EventBus.addEventListener('openTaskEditPanel', (task) => {
            this.switchToEditMode();
            this.taskEditPanel.open();

            this.taskEditPanel.activeTask = task;
        });

        EventBus.addEventListener('closeTaskEditPanel', () => {
            this.switchToViewMode();
            this.taskEditPanel.close();
            this.taskListPanel.clearEmptyTask();
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
        setTimeout(() => {
            panels.classList.remove('edit-mode');
            panels.classList.add('view-mode');
        }, 500);
    }

    switchToEditMode() {
        let panels = document.querySelector('.panels');
        panels.classList.remove('view-mode');
        panels.classList.add('edit-mode');
    }
}
