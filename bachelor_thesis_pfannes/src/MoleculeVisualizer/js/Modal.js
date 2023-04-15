/**
 * Module responsible for managing <i>Modal</i> content. Content is visualized as a table inside the modal.
 * @module Modal
 */

import EventManager from './EventManager.js';

export class Modal {

    /**
     * Saves reference to a modal <i>modal</i>.
     * @param {Element} modal Modal whose content is managed.
     */
    constructor(modal) {
        /**
         * Modal whose content is managed.
         * @type {Element}
         * @private
         */
        this.modal = modal;
    }

    /**
     * Adds events to the modal components <i>modalCloseButton</i> and <i>overlay</i> to control closing the modal.
     * @public
     */
    addModalEvents() {
        // Query necessary components.
        const closeModalButton = this.modal.querySelector('[data-close-button]');
        const overlay = document.querySelector('#overlay');
        const table = this.modal.querySelector('[data-table-description]');

        // Emit events that hide modals when clicking the close button or anywhere on the page.
        /**
         * Triggered after either clicking the overlay or the close button on the modal to close the modal.
         * Signals the <i>ObjectPicker</i> to reset to its initial state.
         * @event resetObjectPicker
         */
        closeModalButton.addEventListener('click', () => {
            EventManager.dispatchEvent({type: 'resetObjectPicker'});
            this.hideModal(overlay, table);
        });
        overlay.addEventListener('click', () => {
            EventManager.dispatchEvent({type: 'resetObjectPicker'});
            this.hideModal(overlay, table);
        });
    }

    /**
     * Hide the modal and its overlay by removing the <i>active</i> tag from their class lists.
     * @private
     * @param {Element} overlay Overlay of the modal.
     * @param {HTMLTableElement} table Table of the modal from where to remove the content.
     */
    hideModal(overlay, table) {
        // Query necessary components.
        const tableHead = table.querySelector('[data-table-header]');

        // Hide modal and overlay by removing their active flag.
        this.modal.classList.remove('active');
        overlay.classList.remove('active');
        // Remove table content.
        tableHead.removeChild(tableHead.children[0]);
        table.deleteRow(-1);
    }

    /**
     * Sets the modal content according to the information inside the <i>json</i> object.
     * @public
     * @param {object} json Contains information that should be displayed inside the modal.
     */
    setModalContent(json) {
        // Query necessary components.
        const tableRow = this.modal.querySelector('[data-table-description]').insertRow();
        const tableHead = this.modal.querySelector('[data-table-header]').insertRow();

        // Fill the table rows of the modal according to the data of the atoms in the json object.
        for (let [key, _] of Object.entries(json)) {
            let cellHead = document.createElement('th');
            cellHead.textContent = key;
            tableHead.appendChild(cellHead);
            let cellRow = tableRow.insertCell();
            cellRow.textContent = json[key];
        }
    }

    /**
     * Show the modal and its overlay by adding the <i>active</i> tag to their class lists.
     * @public
     */
    showModal() {
        // Show modal and overlay by adding an active flag to them.
        this.modal.classList.add('active');
        document.querySelector('#overlay').classList.add('active');
    }
}