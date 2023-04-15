/**
 * Main module for the <i>Molecule Visualizer</i>. Enables parsing of molecule data in .pdb format and visualization of
 * said molecules. At the moment there are 3 different models you can choose from: <i>Balls and Sticks</i> model,
 * <i>Wireframe</i> model and <i>Van der Waals</i> model. Visualization of surface models using the .stl file format
 * is also possible. It's also possible to view molecules via VR goggles. Includes a small GUI for toggling which model
 * should be used during visualization, which molecule to display (currently a dropdown list with 2 test molecules)
 * and an FPS counter to keep track of the performance of the visualization.
 * @module Visualizer
 */

import * as THREE from "three";

import {Modal} from "./Modal.js";
import {Model} from "./Model.js";
import {ObjectPicker} from './ObjectPicker.js';
import {OBJLoader} from "objloader";
import {PDBLoader} from "pdbloader";
import {STLLoader} from "stlloader";
import {TrackballControls} from "trackballcontrols";
import {VisualizerGUI} from './VisualizerGUI.js';
import {VRButton} from "vr_button";
import {XRControllerModelFactory} from "xr_controller_model_factory";

import Stats from "stats";
import ThreeMeshUI from "three-mesh-ui";
import EventManager from "./EventManager.js";

/**
 * Defines how much the camera can zoom in.
 * @const
 * @type {number}
 */
const NEAR = 1e-6;

/**
 * Defines how much the camera can zoom out.
 * @const
 * @type {number}
 */
const FAR = 2000;

/**
 * Scene in which the molecules will be rendered.
 * @const
 * @type {Scene}
 */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x505050);

/**
 * Used to view the molecules in the scene.
 * @const
 * @type {PerspectiveCamera}
 */
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, NEAR, FAR);

/**
 * Container to render the moleucles in.
 * @const
 * @type {HTMLCanvasElement}
 */
const container = document.getElementById('container');

/**
 * Renderer used to render molecules in the scene. Defined as a <i>WebGLRenderer</i> because
 * it is the widest spread framework for rendering in web browsers.
 * @const
 * @type {WebGLRenderer}
 */
const renderer = new THREE.WebGLRenderer({
    canvas: container, antialias: true, logarithmicDepthBuffer: true
});

/**
 * Measures FPS and is used to monitor performance of visualization.
 * @const
 * @type {object}
 */
const stats = new Stats();

/**
 * Camera group that helps to move the camera in VR.
 * @const
 * @type {Group}
 */
const cameraGroup = new THREE.Group();

/**
 * Registers all controllers and their last input during camera movement in VR.
 * @const
 * @type {Map<any, any>}
 */
const prevGamePads = new Map();

/**
 * Vector to store the camera direction in VR.
 * @type {THREE.Vector3}
 */
let cameraVector = new THREE.Vector3();

/**
 * Stores the speed factors for each axis used to move the camera in VR.
 * @type {number[]}
 */
let speedFactor = [0.1, 0.1, 0.1, 0.1];

/**
 * Lighting for the scene.
 * @type {PointLight}
 */
let frontLight1, frontLight2, backLight1, backLight2;

const _toggleSettingsVisibilityEvent = {type: 'toggleSettingsVisibility'};


export class Visualizer {
    /** Initializes the <i>Molecule Visualizer</i> and its components. */
    constructor() {
        this.initComponents();

        /**
         * Molecules will be added into groups instead of directly into the scene to support visualization of multiple
         * molecules at once in the future.
         * @private
         * @type {Group}
         */
        this.root = new THREE.Group();
        scene.add(this.root);

        /**
         * Defines the controls used by the camera.
         * @private
         * @type {TrackballControls}
         */
        this.controls = new TrackballControls(camera, renderer.domElement);
        this.controls.minDistance = NEAR;
        this.controls.maxDistance = FAR;
        this.controls.update();

        /**
         * Decides which objects to pick after triggering mouse/touch events.
         * @private
         * @type {ObjectPicker}
         */
        this.objectPicker = new ObjectPicker(this.root, camera);

        /**
         * Contains functionality for preparing the meshes of the different molecule models.
         * @private
         * @type {Model}
         */
        this.moleculeModel = new Model();

        /**
         * Controls the 'Rendering on Demand'.
         * @private
         * @type {boolean}
         */
        this.renderRequested = false;

        /**
         * User interface which contains various options for choosing different molecule models etc.
         * @private
         * @type {VisualizerGUI}
         */
        this.debugGUI = new VisualizerGUI();

        /** Container for molecule data retrieved by <i>loader</i>.
         * @private
         * @type {object}
         */
        this.moleculeStruct = {};

        /**
         * Object managing the modal content.
         * @private
         * @type {Modal}
         */
        this.modal = new Modal(document.querySelector('#modal'));

        /**
         * Map managing selected atoms via the search field.
         * @private
         * @type {Map<string, number[]>}
         */
        this.selectedAtoms = new Map();

        /**
         * Map managing the atoms whose color has been changed.
         * @private
         * @type {Map<string, number[]>}
         */
        this.changedAtomColor = new Map();

        this.addEvents();
    }


    //*************************************************************************
    //*********** Normal Scene Function Section *******************************
    //*************************************************************************

    /** Add all window and communication events to the <i>Molecule Visualizer</i>.
     * @private
     */
    addEvents() {
        let mouseDownTime;  // Used to calculate total downtime of mouse later.
        const renderingOnDemand = this.renderOnDemand.bind(this);   // Bind current context to renderOnDemand to properly call it in the event function.


        //*************************************************************************
        //*********** Events - Component Communication Events Section *************
        //*************************************************************************

        const atomColorReset = () => {
            for (let [key, indexList] of this.changedAtomColor.entries()) {
                this.selectedAtoms.delete(key);
                indexList.forEach((meshIndex, index, array) => {
                    this.moleculeModel.modelMesh.atomMesh.setColorAt(meshIndex, this.moleculeModel.modelMesh.atomMesh.userData[meshIndex.toString()].clone());
                    this.moleculeModel.modelMesh.atomMesh.userData[meshIndex.toString()] = undefined;
                    this.moleculeModel.modelMesh.atomMesh.instanceColor.needsUpdate = true;
                    this.changedAtomColor.delete(key);
                    this.renderOnDemand();
                });
            }
        };
        const atomSelectionReset = () => {
            for (let [key, indexList] of this.selectedAtoms.entries()) {
                indexList.forEach((meshIndex, index, array) => {
                    this.moleculeModel.modelMesh.atomMesh.setColorAt(meshIndex, this.moleculeModel.modelMesh.atomMesh.userData[meshIndex.toString()].clone());
                    this.moleculeModel.modelMesh.atomMesh.userData[meshIndex.toString()] = undefined;
                    this.moleculeModel.modelMesh.atomMesh.instanceColor.needsUpdate = true;
                    this.selectedAtoms.delete(key);
                    this.renderOnDemand();
                });
            }
        };
        const cameraReset = () => {
            this.controls.reset();
            this.transformCamera();
        };
        const changeAtomColor = (event) => {
            for (let [key, indexList] of this.selectedAtoms.entries()) {
                let newColor = new THREE.Color('#' + event.newColor.toString(16).padStart(6, '0'));

                indexList.forEach((meshIndex, index, array) => {
                    this.moleculeModel.modelMesh.atomMesh.setColorAt(meshIndex, newColor);
                    this.moleculeModel.modelMesh.atomMesh.instanceColor.needsUpdate = true;
                    this.renderOnDemand();
                });

                this.changedAtomColor.set(key, indexList);
                this.selectedAtoms.delete(key);
            }
        };
        const changeLighting = (event) => {
            if (event.model === 'cartoon') {
                frontLight1.visible = false;
                frontLight2.visible = false;
                backLight2.visible = false;
            } else {
                frontLight1.visible = true;
                frontLight2.visible = true;
                backLight2.visible = true;
            }
        };
        const loadFile = (event) => {
            this.clean();
            const [file] = event.fileToLoad;
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            const reader = new FileReader();

            reader.addEventListener('progress', (event) => {
                const size = '(' + Math.floor(event.total / 1000) + ' KB)';
                const progress = Math.floor((event.loaded / event.total) * 100) + '%';

                console.log('Loading', fileName, size, progress);
            });

            switch (fileExtension) {
                case 'pdb':
                    reader.addEventListener('load', (event) => {
                        const contents = event.target.result;

                        const jsonObject = new PDBLoader().parse(contents);
                        this.moleculeStruct['atomPositions'] = jsonObject.geometryAtoms;
                        this.moleculeStruct['bondPositions'] = jsonObject.geometryBonds;
                        this.moleculeStruct['json'] = jsonObject.json;
                        console.log(jsonObject);

                        this.renderMesh();
                        cameraReset();
                        console.log(renderer.info);
                    }, false);

                    reader.readAsText(file);

                    /**
                     * Triggered when loading a model file. Signals the <i>Molecule Visualizer</i> which settings in the GUI
                     * to hide, because they are not available for the loaded model.
                     * @event toggleSettingsVisibility
                     * @type {object}
                     * @property {string} modelLoaded Type of the loaded model.
                     */
                    EventManager.dispatchEvent({..._toggleSettingsVisibilityEvent, modelLoaded: 'pdb'});

                    break;

                case 'obj':
                    reader.addEventListener('load', (event) => {
                        const contents = event.target.result;

                        const object = new OBJLoader().parse(contents);
                        object.name = fileName;
                        this.root.add(object);
                        cameraReset();
                        console.log(renderer.info);
                    }, false);

                    reader.readAsText(file);

                    EventManager.dispatchEvent({..._toggleSettingsVisibilityEvent, modelLoaded: 'obj'});

                    break;

                case 'stl':
                    reader.addEventListener('load', (event) => {
                        const contents = event.target.result;

                        const objectGeometry = new STLLoader().parse(contents);
                        const object = new THREE.Mesh(objectGeometry, new THREE.MeshPhongMaterial());
                        object.name = fileName;
                        this.root.add(object);
                        cameraReset();
                        console.log(renderer.info);
                    }, false);

                    if (reader.readAsBinaryString !== undefined) {
                        reader.readAsBinaryString(file);
                    } else {
                        reader.readAsArrayBuffer(file);
                    }

                    EventManager.dispatchEvent({..._toggleSettingsVisibilityEvent, modelLoaded: 'stl'});

                    break;
            }
        };
        const loadModel = (event) => {
            this.loadMolecule(event.URL, event.fileType);
        };
        const rerender = (event) => {
            this.moleculeModel.updateSettings(event.modelSettings);
            this.renderMesh();
        };
        const resetPicker = () => {
            this.objectPicker.reset();
            this.renderOnDemand();
        };
        const resetViewer = () => {
            this.clean();
            this.renderOnDemand();
        };
        const selectAtoms = (event) => {
            for (let atomType of event.atomsToSelect.split(',')) {
                let indexList = [];
                for (let meshIndex in this.moleculeStruct.json['atoms']) {
                    if (this.moleculeStruct.json['atoms'][meshIndex][4] === atomType) {
                        indexList.push(meshIndex);
                        let initialColor = new THREE.Color();
                        this.moleculeModel.modelMesh.atomMesh.getColorAt(meshIndex, initialColor);

                        if (this.moleculeModel.modelMesh.atomMesh.userData[meshIndex.toString()] === undefined) {
                            this.moleculeModel.modelMesh.atomMesh.userData[meshIndex.toString()] = initialColor;
                        }

                        this.moleculeModel.modelMesh.atomMesh.setColorAt(meshIndex, initialColor.clone().addScalar(0.5));
                        this.moleculeModel.modelMesh.atomMesh.instanceColor.needsUpdate = true;
                        this.renderOnDemand();
                    }
                }
                this.selectedAtoms.set(atomType, indexList);
            }
        };
        const takeScreenshot = () => {
            const saveScreenshot = (blob) => {
                const a = document.createElement('a');
                a.href = window.URL.createObjectURL(blob);
                a.download = `screenshot-${container.width}x${container.height}-${new Date().toLocaleString().replace(',', '').replace(' ', '-')}.png`;
                a.click();
            };

            this.render();

            container.toBlob((blob) => {
                saveScreenshot(blob);
            });
        };

        EventManager.addEvents(EventManager,
            ['rerender', 'resetObjectPicker', 'resetCamera', 'loadFile', 'resetViewer', 'loadModel', 'atomSelection', 'atomColorReset', 'changeAtomColor', 'atomSelectionReset', 'takeScreenshot', 'changeLighting'],
            [rerender, resetPicker, cameraReset, loadFile, resetViewer, loadModel, selectAtoms, atomColorReset, changeAtomColor, atomSelectionReset, takeScreenshot, changeLighting]);


        //*************************************************************************
        //*********** Events - Canvas Events Section ******************************
        //*************************************************************************

        const clickEvent = (event) => {
            const mouseUpTime = event.timeStamp;
            const timeDiff = mouseUpTime - mouseDownTime;
            // TODO: Change the initial format to conform to this one here.
            if (this.objectPicker.pickedObject && timeDiff < 125) {
                let json = {
                    'Position': '( ' + this.moleculeStruct.json['atoms'][this.objectPicker.pickedObject.instanceId][0] + ', ' + this.moleculeStruct.json['atoms'][this.objectPicker.pickedObject.instanceId][1] + ', ' + this.moleculeStruct.json['atoms'][this.objectPicker.pickedObject.instanceId][2] + ' )',
                    'Color': this.moleculeStruct.json['atoms'][this.objectPicker.pickedObject.instanceId][3],
                    'Periodic Table Symbol': this.moleculeStruct.json['atoms'][this.objectPicker.pickedObject.instanceId][4]
                };
                this.modal.setModalContent(json);
                this.modal.showModal();
            }
        };
        const mousedownEvent = (event) => {
            mouseDownTime = event.timeStamp;
        };
        const moveEvent = (event) => {
            this.controls.update();
            this.objectPicker.setPickPosition(event);
            this.objectPicker.pickObject();

            if (this.objectPicker.pickedObject) {
                this.renderOnDemand();
            } else if (!this.objectPicker.pickedObject && this.objectPicker.foundObject) {
                this.objectPicker.foundObject = false;
                this.objectPicker.reset();
                this.renderOnDemand();
            }
        };
        const touchstartEvent = (event) => {
            this.objectPicker.setPickPosition(event.touches[0]);
        };

        EventManager.addEvents(container,
            ['click', 'mousedown', 'mousemove', 'mouseout', 'mouseleave', 'touchstart', 'touchend', 'touchmove'],
            [clickEvent, mousedownEvent, moveEvent, this.objectPicker.resetPickPosition, this.objectPicker.resetPickPosition, touchstartEvent, this.objectPicker.resetPickPosition, moveEvent]);


        //*************************************************************************
        //*********** Events - VR Events Section ***********************************
        //*************************************************************************

        const onSelectEndVR = (event) => {
            const controller = event.target;
            const textField = cameraGroup.getObjectByName('atomInformation');

            if (controller.userData.selected && !textField) {
                const textField = this.makeTextPanel();
                cameraGroup.add(textField);

            } else if (textField) {
                cameraGroup.remove(textField);
            }
        };
        const vrEnd = () => {
            // Stop render loop.
            renderer.setAnimationLoop(null);

            // Remove controllers from scene.
            for (let i = 0; i < 2; i++) {
                const controller = renderer.xr.getController(i);
                const controllerGrip = renderer.xr.getControllerGrip(i);
                EventManager.removeEvents(controller, ['selectend']);
                cameraGroup.remove(controller);
                cameraGroup.remove(controllerGrip);
            }

            // Remove text box from scene if still present.
            const textField = cameraGroup.getObjectByName('atomInformation');

            if (textField) {
                cameraGroup.remove(textField);
            }

            // Reset camera to work in normal scene again.
            cameraGroup.position.set(0, 0, 0);
            cameraGroup.rotation.set(0, 0, 0);

            this.renderOnDemand();

            console.log('Exit VR...');
        };
        const vrStart = () => {
            console.log('Entered VR...');

            // Set up line geometry for controllers.
            const geometry = new THREE.BufferGeometry();
            geometry.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);

            // Set up camera for VR.
            cameraGroup.position.set(0, 1.6, 10); // TODO: find out why camera itself can't be moved.

            // Set up controllers for object picking.
            this.setupControllers(cameraGroup, renderer, [onSelectEndVR], ['selectend']);

            // Start render loop for VR.
            this.animateVR();
        };


        // Browser events.
        EventManager.addEvents(this.controls, ['change', 'start'], [renderingOnDemand, renderingOnDemand]);
        EventManager.addEvents(window, ['resize'], [renderingOnDemand]);

        // Modal events.
        this.modal.addModalEvents();

        // VR Events.
        EventManager.addEvents(renderer.xr,
            ['sessionstart', 'sessionend'],
            [vrStart, vrEnd]);
    }

    animate() {
        this.renderRequested = false;
        this.render();
    }

    /** Clean up scene before rendering.
     * @private
     */
    clean() {
        const groups = [];
        const boundBoxes = [];

        scene.traverse(function (object) {
            if (object.isGroup) {
                groups.push(object);
            } else if (object.type === 'BoxHelper') {
                boundBoxes.push(object);
            }
        });

        // Be careful when removing groups as camera is embedded in a group as well.
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];

            for (let j = group.children.length - 1; j >= 0; j--) {
                const child = group.children[j];

                if (child.isMesh) {
                    child.material.dispose();
                    child.geometry.dispose();
                    group.remove(child);
                }
            }
        }

        // Remove bounding boxes from scene.
        for (let i = 0; i < boundBoxes.length; i++) {
            scene.remove(boundBoxes[i]);
        }
    }

    /** Create lighting for the scene.
     * @private
     */
    createLighting() {
        frontLight1 = new THREE.PointLight(0x888888, 1, 0);
        frontLight1.position.set(0, 200, 0);
        scene.add(frontLight1);

        frontLight2 = new THREE.PointLight(0x888888, 1, 0);
        frontLight2.position.set(-100, -200, -100);
        scene.add(frontLight2);

        backLight1 = new THREE.PointLight(0x888888, 1, 0);
        backLight1.position.set(100, 200, 100);
        scene.add(backLight1);

        backLight2 = new THREE.PointLight(0x888888, 1, 0);
        backLight2.position.set(-100, -200, -100);
        scene.add(backLight2);
    }

    /** Initializes all components of the <i>Molecule Visualizer</i>.
     * @private
     */
    initComponents() {
        // Set up renderer.
        renderer.setPixelRatio(devicePixelRatio);
        renderer.xr.enabled = true;

        // Set up camera.
        camera.position.z = 10;
        scene.add(cameraGroup);
        cameraGroup.add(camera);

        // Set up lighting.
        this.createLighting();

        // Set up stats.
        document.body.appendChild(stats.domElement);

        // Set up VR button.
        document.body.appendChild(VRButton.createButton(renderer));
    }

    /** Loads the molecule file at the specified URL <i>url</i> and saves the data in <i>this.moleculeStruct</i>.
     * @private
     * @param {string} url Path of the molecule file.
     * @param {string} fileType Type of file to load.
     */
    async loadMolecule(url, fileType) {
        // Use fileType parameter to distinguish the different loaders and when to use which loader.
        if (fileType === 'STL' && url !== '') {
            let geometry = await new STLLoader().loadAsync(url);
            this.renderSurface(geometry);

        } else if (fileType === 'PDB' && url !== '') {
            let pdb = await new PDBLoader().loadAsync(url);
            this.moleculeStruct['atomPositions'] = pdb.geometryAtoms;
            this.moleculeStruct['bondPositions'] = pdb.geometryBonds;
            this.moleculeStruct['json'] = pdb.json;

            this.renderMesh();

        } else if (fileType === 'OBJ' && url !== '') {
            let obj = await new OBJLoader().loadAsync(url);
            this.renderOBJ(obj);
        }
    }

    /**
     * Moves the camera so the object is properly positioned within the camera's frustum.
     * @private
     * @param {number} frustumSize Size of the camera frustum after transformation.
     * @param {number} boundBoxSize Size of bounding box surrounding the viewed object.
     * @param {Vector3} boundBoxCenter Coordinates of the bounding box center.
     * @param {PerspectiveCamera} camera Camera that is transformed.
     * @see {@link https://threejs.org/manual/#en/load-obj} For further information on the transformation.
     */
    newCameraFrustum(frustumSize, boundBoxSize, boundBoxCenter, camera) {
        // Compute the distance between camera and object center based on trigonometry and SOHCAHTOA:
        // https://threejs.org/manual/#en/load-obj
        const halfFrustumSize = frustumSize * 0.5;
        const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
        const distance = halfFrustumSize / Math.tan(halfFovY);

        // Compute new direction the camera is facing on the XZ plane from the bounding box center.
        const direction = (new THREE.Vector3)
            .subVectors(camera.position, boundBoxCenter)
            .multiply(new THREE.Vector3(1, 0, 1))
            .normalize();

        // Now move the camera away from the bounding box center by the distance we previously calculated.
        camera.position.copy(direction.multiplyScalar(distance).add(boundBoxCenter));

        // Set appropriate near and far values for the camera.
        camera.near = boundBoxSize / 1000;
        camera.far = boundBoxSize * 1000;

        camera.updateProjectionMatrix();

        camera.lookAt(boundBoxCenter.x, boundBoxCenter.y, boundBoxCenter.z);
    }

    /** Renders the objects added to the scene <i>scene</i> and within the FOV of the camera <i>camera</i>.
     * @private
     */
    render() {
        if (this.resizeNeeded()) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        stats.update();
        this.controls.update();
        renderer.render(scene, camera);
    }

    /** Populates the molecule group <i>this.root</i> with the necessary meshes to be rendered.
     * @private
     */
    renderMesh() {
        this.clean();
        this.objectPicker.isPicking = true;

        this.moleculeModel.initMoleculeMesh(this.moleculeStruct['atomPositions'], this.moleculeStruct['bondPositions'], this.moleculeStruct['json']);

        // Add the meshes for molecule bonds and atoms to the displayed group.
        for (let mesh of Object.keys(this.moleculeModel.modelMesh)) {
            this.root.add(this.moleculeModel.modelMesh[mesh]);
        }

        if (this.moleculeModel.modelMesh.hasOwnProperty('atomMesh')) {
            const box = new THREE.BoxHelper(this.moleculeModel.modelMesh.atomMesh);
            scene.add(box);
        }

        this.transformCamera();

        this.renderOnDemand();
        console.log(this.moleculeModel.modelMesh);
        console.info(renderer.info);
    }

    /**
     * Adds the mesh for a molecular surface extracted from an OBJ file to the scene.
     * @private
     * @param {Object3D} obj Mesh representing a molecular surface.
     */
    renderOBJ(obj) {
        this.clean();

        this.root.add(obj);

        const box = new THREE.BoxHelper(this.root);
        scene.add(box);

        this.transformCamera();

        this.renderOnDemand();
        console.info(renderer.info);
    }

    /**
     * Implements 'Render on Demand'. Only rerender objects in the scene if something has changed instead of every frame.
     * @private
     * @see https://threejs.org/manual/#en/rendering-on-demand Describes advantages of rendering on demand.
     */
    renderOnDemand() {
        const animating = this.animate.bind(this);

        if (!this.renderRequested) {
            this.renderRequested = true;
            requestAnimationFrame(animating);
        }
    }

    /**
     * Renders molecular surfaces according to the geometry extracted from STL files.
     * @param {BufferGeometry} geometry Geometry extracted from the STL file describing the surface.
     */
    renderSurface(geometry) {
        this.clean();
        this.objectPicker.isPicking = false;

        const surfaceMesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial());
        this.root.add(surfaceMesh);

        const box = new THREE.BoxHelper(this.root);
        scene.add(box);

        this.transformCamera();

        this.renderOnDemand();
        console.log(surfaceMesh);
        console.info(renderer.info);
    }

    /**
     * Determines if a resize of the rendered content is needed.
     * @returns {boolean} Boolean, indicating the need of a resize for the rendered content.
     */
    resizeNeeded() {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const resize = canvas.height !== height || canvas.width !== width;

        if (resize) {
            renderer.setSize(width, height, false);
        }

        return resize;
    }

    /**
     * Starts the <i>Molecule Visualizer</i>.
     * @public
     */
    start() {
        this.renderOnDemand();
    }

    /**
     * Compute bounding box of current scene and transform camera according to it.
     * @private
     */
    transformCamera() {
        // See https://stackoverflow.com/questions/46164308/how-to-center-a-three-group-based-on-the-width-of-its-children
        // for how to get the center of a group in three.js.

        // Get bounding box of objects inside root.
        const rootBoundBox = new THREE.Box3().setFromObject(this.root);
        // Get center and size of the bounding box.
        const rootBoundCenter = rootBoundBox.getCenter(new THREE.Vector3());
        const rootBoundSize = rootBoundBox.getSize(new THREE.Vector3()).length();

        // Calculate a new camera frustum based on the object's bounding box.
        this.newCameraFrustum(rootBoundSize, rootBoundSize, rootBoundCenter, camera);

        // Update controls to accommodate the changed frustum.
        this.controls.maxDistance = rootBoundSize * 100;
        this.controls.target.copy(rootBoundCenter);
        this.controls.update();
    }


    //*************************************************************************
    //*********** VR Scene Function Section ***********************************
    //*************************************************************************

    /**
     * Allows for continuous rendering in VR scene. <i>renderer.setAnimationLoop</i> has to be used here, because
     * <i>requestAnimationFrame</i> does not work during VR sessions.
     * @private
     */
    animateVR() {
        const vrRendering = this.renderVR.bind(this);
        renderer.setAnimationLoop(vrRendering);
    }

    /**
     * Creates a text box for VR scene.
     * @returns {ThreeMeshUI.Block} Text block, containing the formatted information to be displayed.
     */
    makeTextPanel() {
        const container = new ThreeMeshUI.Block({
            ref: 'container',
            padding: 0.025,
            width: 2,
            fontFamily: 'assets/Roboto-msdf.json',
            fontTexture: 'assets/Roboto-msdf.png',
            fontColor: new THREE.Color(0xFFFFFF),
            fontSupersampling: true
        });

        container.name = 'atomInformation';
        container.position.set(-1, 1.6, -1.3);
        container.rotation.set(0.55, 0.3, 0);

        const headerContainer = new ThreeMeshUI.Block({
            contentDirection: 'row',
            padding: 0.01,
            margin: 0.025,
            fontSize: 0.07,
            backgroundOpacity: 0
        });

        const contentContainer = new ThreeMeshUI.Block({
            contentDirection: 'row',
            padding: 0.01,
            margin: 0.025,
            fontSize: 0.05,
            backgroundOpacity: 0
        });

        container.add(headerContainer);
        container.add(contentContainer);

        const posHeader = new ThreeMeshUI.Block({
            height: 0.4,
            width: 0.6,
            textAlign: 'center',
            justifyContent: 'start',
            backgroundOpacity: 0
        });

        posHeader.add(new ThreeMeshUI.Text({
            content: 'Position'
        }));

        posHeader.autoLayout = false;
        posHeader.position.set(-0.6, -0.03, 0);

        const colHeader = new ThreeMeshUI.Block({
            height: 0.4,
            width: 0.6,
            textAlign: 'center',
            justifyContent: 'start',
            backgroundOpacity: 0
        });

        colHeader.add(new ThreeMeshUI.Text({
            content: 'Color'
        }));

        colHeader.autoLayout = false;
        colHeader.position.set(0, -0.03, 0);

        const symHeader = new ThreeMeshUI.Block({
            height: 0.4,
            width: 0.6,
            textAlign: 'center',
            justifyContent: 'start',
            backgroundOpacity: 0
        });

        symHeader.add(new ThreeMeshUI.Text({
            content: 'Atom Symbol'
        }));

        symHeader.autoLayout = false;
        symHeader.position.set(0.6, -0.03, 0);

        headerContainer.add(posHeader);
        headerContainer.add(colHeader);
        headerContainer.add(symHeader);

        const posContent = new ThreeMeshUI.Block({
            height: 0.3,
            width: 0.6,
            textAlign: 'center',
            justifyContent: 'start',
            backgroundOpacity: 0
        });

        posContent.add(new ThreeMeshUI.Text({
            content: '( ' + this.moleculeStruct.json['atoms'][this.objectPicker.pickedObject.instanceId][0] + ', ' + this.moleculeStruct.json['atoms'][this.objectPicker.pickedObject.instanceId][1] + ', ' + this.moleculeStruct.json['atoms'][this.objectPicker.pickedObject.instanceId][2] + ' )'
        }));

        const colContent = new ThreeMeshUI.Block({
            height: 0.3,
            width: 0.6,
            textAlign: 'center',
            justifyContent: 'start',
            backgroundOpacity: 0
        });

        colContent.add(new ThreeMeshUI.Text({
            content: this.moleculeStruct.json['atoms'][this.objectPicker.pickedObject.instanceId][3].toString()
        }));

        const symContent = new ThreeMeshUI.Block({
            height: 0.3,
            width: 0.6,
            textAlign: 'center',
            justifyContent: 'start',
            backgroundOpacity: 0
        });

        symContent.add(new ThreeMeshUI.Text({
            content: this.moleculeStruct.json['atoms'][this.objectPicker.pickedObject.instanceId][4]
        }));

        contentContainer.add(posContent);
        contentContainer.add(colContent);
        contentContainer.add(symContent);

        return container;
    }

    /**
     * Implements camera controls via two controllers in a VR scene.
     * @see {@link https://stackoverflow.com/questions/62476426/webxr-controllers-for-button-pressing-in-three-js} for further information on how camera movement is achieved.
     * Button map (Oculus Rift):
     *  0: ?
     *  1: Left/Right Paddle
     *  2: ?
     *  3: Left/Right Thumbstick
     *  4: X/A Button
     *  5: Y/B Button
     *  6: ?
     * Axis Map (Oculus Rift):
     *  0: ?
     *  1: ?
     *  2: X-Axis
     *  3: Z-Axis
     * @private
     */
    moveCameraVR() {
        let handedness = 'unknown';

        const session = renderer.xr.getSession();

        // Only execute if valid VR session available.
        if (session) {
            let xrCamera = renderer.xr.getCamera(camera);
            xrCamera.getWorldDirection(cameraVector);

            // Loop through the available controllers.
            for (const source of session.inputSources) {
                if (source && source.handedness) {
                    handedness = source.handedness;
                }
                if (!source.gamepad) continue;
                const old = prevGamePads.get(source);
                // Save important data regarding current controller.
                const data = {
                    handedness: handedness,
                    buttons: source.gamepad.buttons.map(b => b.value),
                    axes: source.gamepad.axes.slice(0)
                };
                // If this controller has been registered already.
                if (old) {
                    // Handler for button presses. See button map which i corresponds to which button (Oculus Rift controller).
                    data.buttons.forEach((value, i) => {
                        if (value !== old.buttons[i] || Math.abs(value) < 0.8) {
                            if (value === 1) {
                                if (data.handedness == 'left') {
                                    // Move down if left paddle has been pressed.
                                    if (i == 1) {
                                        cameraGroup.position.y -= speedFactor[i] * value;
                                    }
                                    if (i == 3) {
                                        // Reset camera position to VR default.
                                        cameraGroup.position.set(0, 1.6, 10);
                                        cameraGroup.rotation.set(0, 0, 0);
                                    }
                                } else {
                                    // Move up if right paddle has been pressed.
                                    if (i == 1) {
                                        cameraGroup.position.y += speedFactor[i] * value;
                                    }
                                }
                            } else {
                                // Move up or down if any of the paddles has been pressed slightly only.
                                if (i == 1) {
                                    if (data.handedness == 'left') {
                                        cameraGroup.position.y -= speedFactor[i] * value;
                                    } else {
                                        cameraGroup.position.y += speedFactor[i] * value;
                                    }
                                }
                            }
                        }
                    });
                    // Handler for thumbstick movement. See axis map which i corresponds to which axis (Oculus Rift controller).
                    data.axes.forEach((value, i) => {
                        // If thumbstick has been moved beyond threshold begin movement tracking.
                        if (Math.abs(value) > 0.2) {
                            // Ensure speed to never exceed max speed on each axis.
                            speedFactor[i] > 1 ? (speedFactor[i] = 1) : (speedFactor[i] * 1.001);
                            // console.log(value, speedFactor[i], i);

                            // Handle left and right movement of thumbstick.
                            if (i == 2) {
                                // When left thumbstick is moved left or right camera should strafe to left or right by reversing the vectors by 90 degrees.
                                if (data.handedness == 'left') {
                                    cameraGroup.position.x -= cameraVector.z * speedFactor[i] * data.axes[2];
                                    cameraGroup.position.z += cameraVector.x * speedFactor[i] * data.axes[2];

                                    // Provide haptic feedback (if available).
                                    if (source.gamepad.hapticActuators && source.gamepad.hapticActuators[0]) {
                                        let pulseStrength = Math.abs(data.axes[2]) + Math.abs(data.axes[3]);
                                        if (pulseStrength > 0.75) {
                                            pulseStrength = 0.75;
                                        }

                                        let didPulse = source.gamepad.hapticActuators[0].pulse(pulseStrength, 100);
                                    }
                                } else {
                                    // When right thumbstick is moved left or right camera should pan left or right along the Y-axis.
                                    cameraGroup.rotateY(-THREE.MathUtils.degToRad(data.axes[2]));
                                }
                                this.controls.update();
                            }

                            // Handle up and down movement of thumbstick.
                            if (i == 3) {
                                // When left thumbstick is moved up or down camera should move forward or backward.
                                if (data.handedness == 'left') {
                                    cameraGroup.position.x -= cameraVector.x * speedFactor[i] * data.axes[3];
                                    cameraGroup.position.z -= cameraVector.z * speedFactor[i] * data.axes[3];

                                    // Provide haptic feedback (if available).
                                    if (source.gamepad.hapticActuators && source.gamepad.hapticActuators[0]) {
                                        let pulseStrength = Math.abs(data.axes[3]);
                                        if (pulseStrength > 0.75) {
                                            pulseStrength = 0.75;
                                        }

                                        let didPulse = source.gamepad.hapticActuators[0].pulse(pulseStrength, 100);
                                    }
                                } else {
                                    // When right thumbstick is moved up or down camera should pan up or down along the X-axis.
                                    cameraGroup.rotateX(THREE.MathUtils.degToRad(data.axes[3]));

                                    // Provide haptic feedback (if available).
                                    if (source.gamepad.hapticActuators && source.gamepad.hapticActuators[0]) {
                                        let pulseStrength = Math.abs(data.axes[2]) + Math.abs(data.axes[3]);
                                        if (pulseStrength > 0.75) {
                                            pulseStrength = 0.75;
                                        }

                                        let didPulse = source.gamepad.hapticActuators[0].pulse(pulseStrength, 100);
                                    }
                                }
                                this.controls.update();
                            }
                        } else {
                            // Thumbsticks are not moved above threshold, reset speedFactor in this case.
                            if (Math.abs(value) > 0.025) {
                                speedFactor[i] = 0.025;
                            }
                        }
                    });
                }
                // If controller not registered, register it now for future tracking.
                prevGamePads.set(source, data);
            }
        }
    }

    /**
     * Render function for VR scene.
     * @private
     */
    renderVR() {
        // Update text boxes.
        ThreeMeshUI.update();

        // Get current VR session and update all used controllers.
        const session = renderer.xr.getSession();

        if (session) {
            let i = 0;
            for (const source of session.inputSources) {
                this.objectPicker.pickObjectVR(renderer.xr.getController(i++));
            }
        }

        // Move camera when using controllers and update TrackballControls.
        this.moveCameraVR();

        renderer.render(scene, camera);
    }

    /**
     * Sets up the line that is cast from the controller to visualize where one is pointing at.
     * Also adds controllers to scene.
     * @public
     * @param {Group} group Group to add the controllers to.
     * @param {WebGLRenderer} renderer Renderer of the VR content.+
     * @param {Function[]} eventFuncList List of event functions that should be executed.
     * @param {String[]} eventList List of events to add listeners for.
     */
    setupControllers(group, renderer, eventFuncList, eventList) {
        const session = renderer.xr.getSession(); // TODO: Find out why session.inputSources contradicts itself (shown as filled and empty at the same time).
        console.log(session);
        console.log(session.inputSources);
        console.log(session.inputSources[0]);

        // Set up controller and line models.
        const controllerModelFactory = new XRControllerModelFactory();
        const pointerGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1),
        ]);

        // Initialize controllers and controller models.
        for (let i = 0; i < 2; i++) {
            const controller = renderer.xr.getController(i);
            const controllerGrip = renderer.xr.getControllerGrip(i);

            EventManager.addEvents(controller, eventList, eventFuncList);

            controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
            group.add(controller);
            group.add(controllerGrip);

            const line = new THREE.Line(pointerGeometry);
            line.name = 'line';
            line.scale.z = 10;
            controller.add(line);
        }
    }
}