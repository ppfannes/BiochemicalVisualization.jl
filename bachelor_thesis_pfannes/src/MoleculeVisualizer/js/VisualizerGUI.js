/**
 * GUI for the <i>Molecule Visualizer</i>. Supports various settings for choosing molecule visualization models.
 * @module VisualizerGUI
 */

import GUI from "lil_gui";
import EventManager from "./EventManager.js";


//*************************************************************************
//*********** GUI Events Section ******************************************
//*************************************************************************

const _atomColorResetEvent = {type: 'atomColorReset'};
const _atomSelectionEvent = {type: 'atomSelection'};
const _atomSelectionResetEvent = {type: 'atomSelectionReset'};
const _changeAtomColorEvent = {type: 'changeAtomColor'};
const _loadFileEvent = {type: 'loadFile'};
const _loadModelEvent = {type: 'loadModel'};
const _rerenderEvent = {type: 'rerender'};
const _resetCameraEvent = {type: 'resetCamera'};
const _resetViewerEvent = {type: 'resetViewer'};
const _takeScreenshotEvent = {type: 'takeScreenshot'};


export class VisualizerGUI extends GUI {

    /**
     * Creates and sets up the GUI for the <i>Molecule Visualizer</i>.
     * @extends {GUI}
     */
    constructor() {
        super();

        /**
         * State variable that tells rest of GUI components when <i>Visualizer</i> was reset.
         * @private
         * @type {boolean}
         */
        this.isReset = false;

        /**
         * Initial state of the GUI.
         * @private
         * @type {object}
         */
        this.initState = {};

        /**
         * Layout of the GUI.
         * @private
         * @type {object}
         */
        this.api = {
            exampleModels: {
                pdbModels: '', stlModels: '', objModels: ''
            }, atomSearch: {
                searchField: '',
                chooseColor: 0xaabbcc,
                resetColor: () => {
                    /**
                     * Triggered after clicking on the <i>Reset Atom Color</i> button. Signals the <i>Molecule Visualizer</i>
                     * to reset the color of all atoms, whose color has changed, back to their default color.
                     * @event atomColorReset
                     * @type {object}
                     */
                    EventManager.dispatchEvent(_atomColorResetEvent);
                },
                resetSelection: () => {
                    /**
                     * Triggered after clicking on the <i>Reset Atom Selection</i> button. Signals the <i>Molecule Visualizer</i>
                     * to reset the current atom selection.
                     * @event atomSelection
                     * @type {object}
                     */
                    EventManager.dispatchEvent(_atomSelectionResetEvent);
                }
            }, openFile: () => {
                let input = document.createElement('input');
                input.type = 'file';
                input.accept = '.obj, .pdb, .stl';
                input.onchange = _this => {
                    const files = Array.from(input.files);
                    /**
                     * Triggers after choosing a model file to load up in the <i>Molecule Visualizer</i>. Signals the Visualizer which
                     * file was chosen.
                     * @event loadFile
                     * @type {object}
                     * @property {File[]} fileToLoad Contains the file which was chosen by the user and has to be loaded.
                     */
                    EventManager.dispatchEvent({..._loadFileEvent, fileToLoad: files});
                };
                input.click();
            }, Models: {
                BallsAndSticks: true, Wireframe: false, VanDerWaals: false, cartoon: false
            }, resetCamera: () => {
                /**
                 * Triggered after pressing the <i>Reset Camera</i> button. Signals the <i>Molecule Visualizer</i> to reset
                 * the camera's position and rotation to face the loaded object.
                 * @event resetCamera
                 * @type {object}
                 */
                EventManager.dispatchEvent(_resetCameraEvent);
            }, resetViewer: () => {
                this.isReset = true;
                /**
                 * Triggered after pressing the <i>Reset Viewer</i> button. Signals the <i>Molecule Visualizer</i> to reset
                 * itself back to its default state when starting up.
                 * @event resetViewer
                 * @type {object}
                 */
                EventManager.dispatchEvent(_resetViewerEvent);
                this.load(this.initState);
                this.guiSettingsFolders.forEach((value, key, map) => {
                    value.hide();
                });
                this.isReset = false;
            }, takeScreenshot: () => {
                /**
                 * Triggered after pressing the <i>Save Screenshot</i> button. Signals the <i>Molecule Visualizer</i> to
                 * save the current content of the canvas to a screenshot.
                 * @event takeScreenshot
                 * @type {object}
                 */
                EventManager.dispatchEvent(_takeScreenshotEvent);
            }
        };

        /**
         * Map containing settings folders of the GUI. Used for hiding certain settings when loading different molecule models.
         * @private
         * @type {Map<string, g>}
         */
        this.guiSettingsFolders = new Map();

        this.setupGUI();
    }

    /**
     * Add control elements to the GUI according to {@link VisualizerGUI#api|api}.
     * @private
     */
    setupGUI() {
        // Setting up GUI folders.
        const fileFolder = this.addFolder('Load Model');
        this.guiSettingsFolders.set('models', this.addFolder('Models'));
        this.guiSettingsFolders.set('atom_search', this.addFolder('Search for Atoms'));
        const miscFolder = this.addFolder('Misc.');
        const debugFolder = this.addFolder('Debug');

        // Internal method for creating radio button functionality for the checkboxes in the model selection section.
        const setCheck = (id, api) => {
            for (let value in api) {
                api[value] = false;
            }

            api[id] = true;
            /**
             * Triggered after choosing another a molecule model. Updates model settings and signals the
             * <i>Molecule Visualizer</i> to reset the viewport and render the current molecule with the new model settings.
             * @event rerender
             * @type {object}
             * @property {object} modelSettings Updated settings used for rerendering the displayed molecule.
             */
            EventManager.dispatchEvent({..._rerenderEvent, modelSettings: this.api.Models});
        };

        fileFolder.add(this.api, 'openFile').name('Load local model file');


        //*************************************************************************
        //*********** GUI Settings Folder - Models Section ************************
        //*************************************************************************

        // Model settings section. Added listen() function on checkboxes, so they can get updated outside the onChange event
        // (radio button functionality).
        this.guiSettingsFolders.get('models').add(this.api.Models, 'BallsAndSticks').name('Balls and Sticks').listen().onChange(() => {
            if (!this.isReset) {
                setCheck('BallsAndSticks', this.api.Models);
            }
        });
        this.guiSettingsFolders.get('models').add(this.api.Models, 'Wireframe').listen().onChange(() => {
            if (!this.isReset) {
                setCheck('Wireframe', this.api.Models);
            }
        });
        this.guiSettingsFolders.get('models').add(this.api.Models, 'VanDerWaals').name('Van der Waals').listen().onChange(() => {
            if (!this.isReset) {
                setCheck('VanDerWaals', this.api.Models);
            }
        });
        this.guiSettingsFolders.get('models').add(this.api.Models, 'cartoon').name('Cartoon (WIP)').listen().onChange(() => {
            if (!this.isReset) {
                setCheck('cartoon', this.api.Models);
            }
        });
        this.guiSettingsFolders.get('models').hide();


        //*************************************************************************
        //*********** GUI Settings Folder - Atom Search Section *******************
        //*************************************************************************

        this.guiSettingsFolders.get('atom_search').add(this.api.atomSearch, 'searchField', '')
            .name('Search atom group')
            .onFinishChange((value) => {
                /**
                 * Triggered after choosing a group of atoms to select via the search field. Signals the <i>Molecule Visualizer</i>
                 * which atoms to mark as selected and highlight them.
                 * @event atomSelection
                 * @type {object}
                 * @property {string} atomsToSelect String that was input by the user in the search field. Tells the Visualizer which atoms to mark as selected and highlight.
                 */
                EventManager.dispatchEvent({..._atomSelectionEvent, atomsToSelect: value});
            });
        this.guiSettingsFolders.get('atom_search').addColor(this.api.atomSearch, 'chooseColor')
            .name('Atom Color')
            .onFinishChange((value) => {
                /**
                 * Triggered after choosing a different color for selected atoms. Signals the <i>Molecule Visualizer</i>
                 * which color to use now for the selected atoms.
                 * @event changeAtomColor
                 * @type {object}
                 * @property {number} Integer value describing the new color for the selected atoms.
                 */
                EventManager.dispatchEvent({..._changeAtomColorEvent, newColor: value});
            });
        this.guiSettingsFolders.get('atom_search').add(this.api.atomSearch, 'resetColor').name('Reset Atom Color');
        this.guiSettingsFolders.get('atom_search').add(this.api.atomSearch, 'resetSelection').name('Reset Atom Selection');
        this.guiSettingsFolders.get('atom_search').hide();


        //*************************************************************************
        //*********** Misc. Folder Section ****************************************
        //*************************************************************************

        miscFolder.add(this.api, 'resetCamera').name('Reset Camera');
        miscFolder.add(this.api, 'resetViewer').name('Reset Viewer');
        miscFolder.add(this.api, 'takeScreenshot').name('Save Screenshot');


        //*************************************************************************
        //*********** Debug Folder - Example Files Section ************************
        //*************************************************************************

        const load = (value, fileType) => {
            this.guiSettingsFolders.forEach((value, key, map) => {
                value.hide();
            });

            /**
             * Triggered when choosing one of the example models from the drop-down menu. Signals the <i>Molecule Visualizer</i>
             * which URL to load and what type the model file has.
             * @event loadModel
             * @type {object}
             * @property {string} URL URl of the model file to load in the Visualizer.
             * @property {string} fileType Type of the model file that is specified by URL.
             */
            EventManager.dispatchEvent({..._loadModelEvent, URL: value, fileType: fileType});
        };

        const exampleModelsFolder = debugFolder.addFolder('Load example models');
        exampleModelsFolder.add(this.api.exampleModels, 'pdbModels', ['models/pdb/caffeine.pdb', 'models/pdb/1wxr.pdb'])
            .name('Load PDB model')
            .listen()
            .onChange((value) => {
                load(value, 'PDB');

                this.guiSettingsFolders.get('models').show();
                this.guiSettingsFolders.get('atom_search').show();
            });
        exampleModelsFolder.add(this.api.exampleModels, 'stlModels', ['models/stl/1c4k-60k.stl', 'models/stl/2h1l-200k.stl', 'models/stl/2lzx-80k.stl', 'models/stl/2ptc-74k.stl', 'models/stl/6ds5-170k.stl'])
            .name('Load STL model')
            .listen()
            .onChange((value) => {
                load(value, 'STL');
            });
        exampleModelsFolder.add(this.api.exampleModels, 'objModels', ['models/obj/1c4k-60k.obj', 'models/obj/2h1l-200k.obj', 'models/obj/2lzx-80k.obj', 'models/obj/2ptc-74k.obj', 'models/obj/6ds5-170k.obj'])
            .name('Load OBJ model')
            .listen()
            .onChange((value) => {
                load(value, 'OBJ')
            });

        const toggleSettings = (event) => {
            const modelLoaded = event.modelLoaded;

            switch (modelLoaded) {
                case 'obj':
                    this.guiSettingsFolders.forEach((value, key, map) => {
                        value.hide();
                    });

                    break;

                case 'pdb':
                    this.guiSettingsFolders.forEach((value, key, map) => {
                        value.hide();
                    });
                    this.guiSettingsFolders.get('models').show();
                    this.guiSettingsFolders.get('atom_search').show();

                    break;

                case 'stl':
                    this.guiSettingsFolders.forEach((value, key, map) => {
                        value.hide();
                    });

                    break;
            }
        };

        EventManager.addEvents(EventManager, ['toggleSettingsVisibility'], [toggleSettings]);

        // Save initial state.
        this.initState = this.save();
    }
}