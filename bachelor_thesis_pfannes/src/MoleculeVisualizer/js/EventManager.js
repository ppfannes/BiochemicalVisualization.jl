/**
 * Responsible for managing all the events inside the <i>Molecule Visualizer</i>. It is able to add multiple
 * event listeners to an object. The event functions for each listener have to be provided as well. Objects are
 * required to derive from the {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget|EventTarget}
 * interface so the <i>EventManager</i> can add and remove event listeners. It keeps a JSON-like map containing
 * all objects with their respective events and event functions.
 * @module EventManager
 */

import {EventDispatcher} from "three";

class EventManager extends EventDispatcher {
    /**
     * Creates <i>EventManager</i> and sets up JSON object to collect all object with their respective event listeners.
     * @extends https://threejs.org/docs/index.html#api/en/core/EventDispatcher
     */
    constructor() {
        super();
        /**
         * Stores managed objects as well as their event listeners and event functions.
         * Objects are stored in a JSON-like format inside a map.
         * @private
         * @type {Map<object, object>}
         * @example
         * {object: {event: function,
         *           event: function,
         *           ...},
         * ...}
         */
        this.managedEvents = new Map();
    }

    /**
     * Takes an object <i>object</i> and a number of events and adds listeners for each of those events to <i>object</i>.
     * The functions for each listener are specified in <i>eventFunctions</i>.
     * @public
     * @param {object} object Object for which to add the event listener for. Needs to extend the
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget|EventTarget} interface so event listeners
     * can be added to the object. It is possible to add multiple listeners to a single object by specifying more than
     * one event in <i>events</i>. <i>events</i> and <i>eventFunctions</i> should have the same length as it is assumed
     * that the i-th function corresponds to the i-th event. After adding the listeners, the object is stored inside
     * the {@link EventManager#managedEvents|managedEvents} object together with the listened events and the
     * corresponding event functions.
     * @param {string[]} events Events which the object should listen for.
     * @param {function[]} eventFunctions Event functions that should be executed if their corresponding event has
     * been triggered.
     * @example
     * // this.managedEvents = {object: {event: eventFunction}} after call.
     * EventManager.addEvents(object, [event], [eventFunction]);
     */
    addEvents(object, events, eventFunctions) {
        // Create object which contains events and their corresponding event functions.
        const mappedEvents = events.reduce((accumulator, event, idx) => {
            return {...accumulator, [event]: eventFunctions[idx]};
        }, {});
        // Add listener for each event.
        Object.entries(mappedEvents).forEach(([event, eventFunction]) => {
            object.addEventListener(event, eventFunction);
        });
        // Add event object to managedEvents.
        this.managedEvents.set(object, mappedEvents);
    }

    /**
     * Looks for the event functions that <i>object</i> executes if an event it listens to has been triggered in
     * {@link EventManager#managedEvents|managedEvents} and returns the corresponding object, if any listeners
     * have been added to the object.
     * @private
     * @param {object} object Object whose event listeners should be retrieved.
     * @returns {object} Event functions that get triggered by events <i>object</i> is listening to.
     */
    getEventFunctions(object) {
        return this.managedEvents.get(object);
    }

    /**
     * Removes event listeners for the events specified in <i>events</i> from <i>object</i>. Also removes entry in
     * {@link EventManager#managedEvents|managedEvents} if all listeners have been removed.
     * @public
     * @param {object} object Object whose listeners should be removed.
     * @param {string[]} events Events whose listeners should be removed from <i>object</i>.
     */
    removeEvents(object, events) {
        // Get all event functions associated with object.
        const eventFunctions = this.getEventFunctions(object);
        // Remove them one by one.
        events.forEach((event) => {
            object.removeEventListener(event, eventFunctions[event]);
            delete this.managedEvents.get(object)[event];
        });
        // Remove object only if no more events are managed for it.
        if (!this.managedEvents.get(object).length) {
            this.managedEvents.delete(object);
        }
    }
}

export default new EventManager();