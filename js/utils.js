'use strict';

class TaskListUtil {

    static validTargetItem(target) {
        if (target.nodeName === 'SPAN') {
            return target.parentElement;
        } else if (target.nodeName === 'LI') {
            return target;
        }
        return null;
    }

    static shouldMoveItem(target, pos) {
        let taskList = document.querySelector('.task-list-panel ul');
        let draggedItem = taskList.querySelector('.dragging');
        let previousSibling = draggedItem.previousElementSibling;
        let nextSibling = draggedItem.nextElementSibling;

        let isSameTargetItem = (target === draggedItem);
        let isMovingUpKeepingPos = (target === previousSibling && pos >= target.offsetHeight/2);
        let isMovingDownKeepingPos = (target === nextSibling && pos <= target.offsetHeight/2);

        if (isSameTargetItem || isMovingUpKeepingPos || isMovingDownKeepingPos) {
            return false;
        }
        return true;
    }

    static resetTaskClasses() {
        let taskList = document.querySelector('.task-list-panel ul');
        let allElements = taskList.querySelectorAll('.task.insert-before, .task.insert-after');
        allElements.forEach((element) => {
            element.classList.remove('insert-before');
            element.classList.remove('insert-after');
        });
    }
}
