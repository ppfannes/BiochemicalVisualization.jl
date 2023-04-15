/**
 * Used for checking which object is currently picked by a user click.
 * Uses raycasting to determine the picked object. <i>ObjectPicker</i> is also able to pick objects in a VR environment.
 * @see {@link https://threejs.org/manual/#en/webxr-point-to-select} for further information on how VR object picking is achieved.
 * @module ObjectPicker
 */

import * as THREE from "three";
import {EventDispatcher} from "three";

export class ObjectPicker extends EventDispatcher {

    /**
     * Sets up the <i>ObjectPicker</i> to pick objects in {@link ObjectPicker#location|location} using
     * {@link ObjectPicker#camera|camera} and a raycaster.
     * @param {Scene|Group} location Location in which objects should be picked.
     * @param {PerspectiveCamera} camera Camera which should be used for raycasting.
     */
    constructor(location, camera) {
        super();
        /**
         * Raycaster used to detect objects hovered over by a mouse/touched by a user.
         * @private
         * @type {Raycaster}
         */
        this.raycaster = new THREE.Raycaster();

        /**
         * Position of mouse/touch. Origin of ray cast by the raycaster. Default is (0, 0);
         * @private
         * @type {object}
         */
        this.pickPosition = {x: 0, y: 0};

        /**
         * Currently picked object. Default is undefined.
         * @public
         * @type {object}
         */
        this.pickedObject = undefined;

        /**
         * Boolean indicating if object picking is currently active. Default is true.
         * @public
         * @type {boolean}
         */
        this.isPicking = true;

        /**
         * Location in which the object picker should pick objects. Can either be a Scene or Group.
         * @private
         * @type {Scene|Group}
         */
        this.location = location;

        /**
         * Camera which the object picker should use for raycasting.
         * @private
         * @type {PerspectiveCamera}
         */
        this.camera = camera;

        /**
         * Boolean indicating if an object has been found by the object picker. Used to make the highlight on the object
         * disappear once it's not picked anymore. Default is false.
         * @public
         * @type {boolean}
         */
        this.foundObject = false;
    }


    //*************************************************************************
    //*********** Normal Scene Function Section *******************************
    //*************************************************************************

    /**
     * Uses the raycaster to pick the object in the current scene at the currently set pick position.
     * @public
     */
    pickObject() {
        this.reset();

        // Only pick objects if it's explicitly enabled (disabled for surface meshes).
        if (this.isPicking) {
            // Use raycasting to determine the object under the mouse pointer.
            this.raycaster.setFromCamera(this.pickPosition, this.camera);
            const intersections = this.raycaster.intersectObjects(this.location.children);

            // Only proceed if we found at least one intersection during raycasting.
            if (intersections.length) {
                const mesh = intersections[0].object;

                // Check if we picked an atom and change its color. Store the initial color to change it back if the atom
                // not picked anymore.
                if (mesh.geometry.type == 'IcosahedronGeometry') {
                    this.foundObject = true;
                    this.pickedObject = intersections[0];
                    const initialColor = new THREE.Color();
                    mesh.getColorAt(this.pickedObject.instanceId, initialColor);
                    mesh.userData.initialColor = initialColor;
                    mesh.setColorAt(this.pickedObject.instanceId, initialColor.clone().addScalar(0.5));
                    mesh.instanceColor.needsUpdate = true;
                }
            }
        }
    }

    /** Resets the state of the <i>Object Picker</i> and the color of the picked object to their initial values.
     * @public
     */
    reset() {
        const pickedObject = this.pickedObject;

        // Only reset if we picked an object before.
        if (pickedObject) {
            const mesh = pickedObject.object;
            mesh.setColorAt(pickedObject.instanceId, mesh.userData.initialColor.clone());
            mesh.instanceColor.needsUpdate = true;
            mesh.userData.initialColor = undefined;
            this.pickedObject = undefined;
        }
    }

    /** Resets the {@link ObjectPicker#pickPosition|pickPosition} of the <i>Object Picker</i>.
     * @public
     */
    resetPickPosition() {
        this.pickPosition = {x: undefined, y: undefined};
    }

    /**
     * Sets the {@link ObjectPicker#pickPosition|pickPosition} of the <i>Object Picker</i> according to the received event.
     * @public
     * @param {MouseEvent|Touch} event Current event that was triggered in the window.
     */
    setPickPosition(event) {
        event.preventDefault();

        this.pickPosition.x = (event.clientX / innerWidth) * 2 - 1;
        this.pickPosition.y = -(event.clientY / innerHeight) * 2 + 1;
    }


    //*************************************************************************
    //*********** VR Scene Function Section ***********************************
    //*************************************************************************

    /**
     * Calculates all intersections of a controller using raycasting.
     * @param {any} controller
     */
    getIntersectionsController(controller) {
        // Store controller rotation in temp matrix.
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.identity().extractRotation(controller.matrixWorld);
        // Set origin of cast ray to be the controller.
        this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        // Ray points in the same direction as the controller.
        this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
        return this.raycaster.intersectObjects(this.location.children);
    }

    /**
     * Picks an object in a VR environment and highlights it.
     * @public
     * @param {any} controller Controller who is picking objects in VR.
     */
    pickObjectVR(controller) {
        this.resetControllerVR(controller);

        // Only pick objects if it's explicitly enabled (disabled for surface meshes).
        if (this.isPicking) {
            // Use raycasting to determine the object picked by the controller
            const intersections = this.getIntersectionsController(controller);
            const line = controller.getObjectByName('line');

            // Only proceed if we didn't pick an object before (to prevent picking with both controllers at the same time)
            // and we found at least one intersection during raycasting.
            if (intersections.length && !this.pickedObject) {
                const mesh = intersections[0].object;

                // Check if we picked an atom and change its color. Store the initial color to change it back if the atom
                // not picked anymore. Also scale the line coming out of the controller, so it touches the picked atom.
                if (mesh.geometry.type == 'IcosahedronGeometry') {
                    controller.userData.selected = intersections[0];
                    line.scale.z = controller.userData.selected.distance;
                    this.pickedObject = intersections[0];
                    const initialColor = new THREE.Color();
                    mesh.getColorAt(controller.userData.selected.instanceId, initialColor);
                    mesh.userData.initialColor = initialColor;
                    mesh.setColorAt(controller.userData.selected.instanceId, initialColor.clone().addScalar(0.5));
                    mesh.instanceColor.needsUpdate = true;
                }
            } else {
                // Scale line back to normal if nothing is picked.
                line.scale.z = 10;
            }
        }
    }

    /**
     * Resets VR object picking components to their initial state.
     * @private
     * @param {any} controller Controller whose state has to be reset.
     */
    resetControllerVR(controller) {
        const pickedObject = controller.userData.selected;

        // Only reset if an object was picked before.
        if (pickedObject) {
            const mesh = pickedObject.object;
            mesh.setColorAt(pickedObject.instanceId, mesh.userData.initialColor.clone());
            mesh.instanceColor.needsUpdate = true;
            mesh.userData.initialColor = undefined;
            controller.userData.selected = undefined;
            this.pickedObject = undefined;
        }
    }
}
