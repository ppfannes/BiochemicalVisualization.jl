/**
 * Contains functionality for initializing meshes of the different molecule models.
 * @module Model
 */

import * as THREE from "three";
import EventManager from "./EventManager.js";

/**
 * Geometry of molecule bonds.
 * @const
 * @type {THREE.BoxBufferGeometry}
 */
const bondGeometry = new THREE.BoxBufferGeometry();

/**
 * Geometry of atoms.
 * @const
 * @type {IcosahedronGeometry}
 */
const atomGeometry = new THREE.IcosahedronBufferGeometry(0.5, 3);

const _changeLightingEvent = {type: 'changeLighting'};


export class Model {

    /** Initialize <i>Model</i> object with default model settings, different atom radii and the resulting model mesh. */
    constructor() {
        /**
         * Model mesh corresponding to the molecule model to be rendered.
         * @type {object}
         * @public
         */
        this.modelMesh = {};

        /**
         * Model settings for the <i>Visualizer GUI</i>. Initial value corresponds to default settings.
         * @type {object}
         * @private
         */
        this.modelSettings = {
            BallsAndSticks: true,
            Wireframe: false,
            VanDerWaals: false
        };

        /**
         * Standard atom radii.
         * @type {object}
         * @private
         */
        this.atomRadiiNormal = {
            "H": 0.32,
            "C": 0.75,
            "O": 0.63,
            "N": 0.71
        };

        /**
         * Van der Waals atom radii.
         * @type {object}
         * @private
         */
        this.atomRadiiVDW = {
            "H": 1.20,
            "C": 1.70,
            "O": 1.52,
            "N": 1.55
        };
    }

    //*************************************************************************
    //*********** Model - Math Function Section *******************************
    //*************************************************************************

    /**
     * Calculates the transformation matrix of one atom in the mesh.
     * @public
     * @param {Matrix4} matrix Stores the transformation matrix for the corresponding atom.
     * @param {BufferAttribute} positions Contain all atom positions.
     * @param {any} json Meta information regarding the atoms in the molecule (position, color, symbol in periodic table).
     * @param {object} atomRadii Atom radii for each atom type.
     * @param {number} index Index of the atom that is currently processed.
     */
    atomTransformMatrix(matrix, positions, json, atomRadii, index) {
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        position.x = positions.getX(index);
        position.y = positions.getY(index);
        position.z = positions.getZ(index);

        rotation.x = rotation.y = rotation.z = 0;
        quaternion.setFromEuler(rotation);  // Use quaternion to express rotations as they are numerically more stable than rotations with Euler angles.
                                            // See "ESA multibody simulator for spacecrafts’ ascent and landing in a microgravity environment" (DOI 10.1007/s12567-015-0081-5)
                                            // and "3D Math Primer for Graphics and Game Development".

        // Choose right radius to scale atom.
        if (json.atoms[index][4] === "H") {
            scale.x = scale.y = scale.z = atomRadii["H"];
        } else if (json.atoms[index][4] === "C") {
            scale.x = scale.y = scale.z = atomRadii["C"];
        } else if (json.atoms[index][4] === "O") {
            scale.x = scale.y = scale.z = atomRadii["O"];
        } else if (json.atoms[index][4] === "N") {
            scale.x = scale.y = scale.z = atomRadii["N"];
        }

        matrix.compose(position, quaternion, scale);
    }

    /**
     * Calculates transformation matrix for a single bond.
     * @public
     * @param {Matrix4} matrix Stores the transformation matrix for the corresponding bond.
     * @param {BufferAttribute} positions Contains start and end positions for each bond in the molecule.
     * @param {number} index Index of the bond that is currently processed.
     */
    bondTransformationMatrix(matrix, positions, index) {
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        const end = new THREE.Vector3();
        const dummy = new THREE.Object3D(); // Used to get correct rotation, position and scale for bonds.

        position.x = positions.getX(index);
        position.y = positions.getY(index);
        position.z = positions.getZ(index);

        end.x = positions.getX(index + 1);
        end.y = positions.getY(index + 1);
        end.z = positions.getZ(index + 1);

        dummy.position.copy(position);
        dummy.position.lerp(end, 0.5);  // Interpolate the position of the bond between start and end position to change its length.
        dummy.scale.set(0.01, 0.01, position.distanceTo(end));  // Scale box to make it look like an atomic bond.
        dummy.lookAt(end);  // Rotates bond, so it correctly runs from one atomic center to another.

        dummy.getWorldPosition(position);
        dummy.getWorldQuaternion(quaternion);
        dummy.getWorldScale(scale);

        matrix.compose(position, quaternion, scale);
    }

    /**
     * Calculates the transformation matrix for each atom in the atom mesh and applies the matrix to each atom.
     * Also colors all atoms according to chemical standards.
     * @public
     * @param {InstancedMesh} atomMesh Mesh containing all the atoms of the molecule. Has to be an {@link https://threejs.org/docs/index.html?q=instanced#api/en/objects/InstancedMesh|InstancedMesh} to make sure the Visualizer is performant enough.
     * @param {BufferAttribute} positions Attribute containing the positions of all atoms in the mesh.
     * @param {BufferAttribute} colors Attribute containing the color information of all atoms in the mesh.
     * @param {object} atomRadii Object containing the radii to scale the atoms with.
     * @param {any} json Meta information regarding the atoms in the molecule (position, color, symbol in periodic table).
     */
    createAtoms(atomMesh, positions, colors, atomRadii, json) {
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();

        for (let i = 0; i < positions.count; i++) {
            this.atomTransformMatrix(matrix, positions, json, atomRadii, i);

            color.r = colors.getX(i);
            color.g = colors.getY(i);
            color.b = colors.getZ(i);

            atomMesh.setMatrixAt(i, matrix);
            atomMesh.setColorAt(i, color);
        }
    }

    //*************************************************************************
    //*********** Model - Model Function Section ******************************
    //*************************************************************************

    /**
     * Initializes {@link Model#modelMesh|modelMesh} for the Balls and Sticks molecule model. Atoms are represented as colored spheres and bonds are
     * represented as boxes that are scaled to appear as sticks.
     * @public
     * @param {BufferGeometry} atomPositions Positions of atoms given in local coordinates.
     * @param {BufferGeometry} bondPositions Position of atomic bonds given in local coordinates.
     * @param {object} atomRadii Atomic radii for the model. Balls and Sticks model uses standard atomic radii.
     * @param {any} json Meta information regarding the atoms in the molecule (position, color, symbol in periodic table).
     */
    ballAndStickModel(atomPositions, bondPositions, atomRadii, json) {
        const atomMesh = new THREE.InstancedMesh(atomGeometry, new THREE.MeshPhongMaterial(), json.atoms.length);
        const bondMesh = new THREE.InstancedMesh(bondGeometry, new THREE.MeshPhongMaterial(0xFFFFFF), bondPositions.getAttribute('position').count / 2);

        let positions = atomPositions.getAttribute('position');
        const colors = atomPositions.getAttribute('color');
        this.createAtoms(atomMesh, positions, colors, atomRadii, json);

        positions = bondPositions.getAttribute('position');
        this.createBonds(bondMesh, positions);

        this.modelMesh = {atomMesh, bondMesh};
        EventManager.dispatchEvent({..._changeLightingEvent, model: 'ballsAndSticks'});
    }

    /**
     * Calculates the transformation matrix for each bond present in the molecule and applies the matrix to the bonds.
     * @public
     * @param {InstancedMesh} bondMesh Mesh containing all bonds of the molecule. Has to be an {@link https://threejs.org/docs/index.html?q=instanced#api/en/objects/InstancedMesh|InstancedMesh} to make sure the visualizer is performant enough.
     * @param {BufferAttribute} positions Contains start and end positions for each bond in the molecule.
     */
    createBonds(bondMesh, positions) {
        const matrix = new THREE.Matrix4();

        for (let i = 0; i < positions.count; i += 2) {
            this.bondTransformationMatrix(matrix, positions, i);

            bondMesh.setMatrixAt(i / 2, matrix);
        }
    }

    /**
     * Initializes the model mesh for the desired molecule model. Mesh to be instantiated is chosen
     * according to the model settings which are updated by the <i>Visualizer GUI</i>.
     * @public
     * @param {BufferGeometry} atomPositions Positions of the atoms given in local coordinates.
     * @param {BufferGeometry} bondPositions Positions of the atomic bonds given in local coordinates.
     * @param {any} json Meta information regarding the atoms in the molecule (position, color, symbol in periodic table).
     */
    initMoleculeMesh(atomPositions, bondPositions, json) {
        const offset = new THREE.Vector3();

        atomPositions.computeBoundingBox();
        atomPositions.boundingBox.getCenter(offset).negate();   // Center atom positions within their bounding box.

        atomPositions.translate(offset.x, offset.y, offset.z);
        bondPositions.translate(offset.x, offset.y, offset.z);

        // Choose which model to render according to the model settings (get modified by GUI).
        if (this.modelSettings.BallsAndSticks) {
            this.ballAndStickModel(atomPositions, bondPositions, this.atomRadiiNormal, json);
        }
        if (this.modelSettings.Wireframe) {
            this.wireframeModel(bondPositions);
        }
        if (this.modelSettings.VanDerWaals) {
            this.vanDerWaalsModel(atomPositions, this.atomRadiiVDW, json);
        }
        if (this.modelSettings.cartoon) {
            const controlPoints = [
                new THREE.Vector3(0, 10, -10), new THREE.Vector3(10, 0, -10),
                new THREE.Vector3(20, 0, 0), new THREE.Vector3(30, 0, 10),
                new THREE.Vector3(30, 0, 20), new THREE.Vector3(20, 0, 30),
                new THREE.Vector3(10, 0, 30), new THREE.Vector3(0, 0, 30),
                new THREE.Vector3(-10, 10, 30), new THREE.Vector3(-10, 20, 30),
                new THREE.Vector3(0, 30, 30), new THREE.Vector3(10, 30, 30),
                new THREE.Vector3(20, 30, 15), new THREE.Vector3(10, 30, 10),
                new THREE.Vector3(0, 30, 10), new THREE.Vector3(-10, 20, 10),
                new THREE.Vector3(-10, 10, 10), new THREE.Vector3(0, 0, 10),
                new THREE.Vector3(10, -10, 10), new THREE.Vector3(20, -15, 10),
                new THREE.Vector3(30, -15, 10), new THREE.Vector3(40, -15, 10),
                new THREE.Vector3(50, -15, 10), new THREE.Vector3(60, 0, 10),
                new THREE.Vector3(70, 0, 0), new THREE.Vector3(80, 0, 0),
                new THREE.Vector3(90, 0, 0), new THREE.Vector3(100, 0, 0)
            ];
            this.cartoonModel(controlPoints);
        }
    }

    /**
     * Update the model settings of the <i>Model</i> object.
     * @public
     * @param {object} settings New settings for the <i>Model</i> object.
     */
    updateSettings(settings) {
        this.modelSettings = settings;
    }

    /**
     * Initializes {@link Model#modelMesh|modelMesh} for the Van der Waals molecule model. Atoms are represented as colored spheres
     * with increased radius compared to the Balls and Sticks model. Bonds are left out of this model.
     * @public
     * @param {BufferGeometry} atomPositions Positions of atoms given in local coordinates.
     * @param {object} atomRadii Atomic radii for the model. Van der Waals model uses Van der Waals atomic radii.
     * @param {any} json Meta information regarding the atoms in the molecule (position, color, symbol in periodic table).
     */
    vanDerWaalsModel(atomPositions, atomRadii, json) {
        const atomMesh = new THREE.InstancedMesh(atomGeometry, new THREE.MeshPhongMaterial(), json.atoms.length);

        const positions = atomPositions.getAttribute('position');
        const colors = atomPositions.getAttribute('color');
        this.createAtoms(atomMesh, positions, colors, atomRadii, json);

        this.modelMesh = {atomMesh};
        EventManager.dispatchEvent({..._changeLightingEvent, model: 'vanDerWaals'});
    }

    /**
     * Initializes {@link Model#modelMesh|modelMesh} for the Wireframe molecule model. Bonds are
     * represented as boxes that are scaled to appear as sticks and atoms are left out.
     * @public
     * @param {BufferGeometry} bondPositions Position of atomic bonds given in local coordinates.
     */
    wireframeModel(bondPositions) {
        const bondMesh = new THREE.InstancedMesh(bondGeometry, new THREE.MeshPhongMaterial(0xFFFFFF), bondPositions.getAttribute('position').count / 2);

        let positions = bondPositions.getAttribute('position');
        this.createBonds(bondMesh, positions);

        this.modelMesh = {bondMesh};
        EventManager.dispatchEvent({..._changeLightingEvent, model: 'wireframe'});
    }

    /**
     * WIP for the cartoon model. Takes an array of control points to calculate a Catmull-Rom spline and the use
     * the THREE.TubeBufferGeometry to create a tubular shape along the spline.
     * @public
     * @param {Vector3[]} controlPoints Array containing the control that serve as the base for the Catmull-Rom spline.
     */
    cartoonModel(controlPoints) {
        const pipeSpline = new THREE.CatmullRomCurve3(controlPoints);

        const tubeGeometry = new THREE.TubeBufferGeometry(pipeSpline, 500, 2, 50, false);

        const colors = new Uint8Array(5);

        for (let c = 0; c <= colors.length; c++) {

            colors[c] = (c / colors.length) * 256;

        }

        const format = THREE.RedFormat;

        const gradientMap = new THREE.DataTexture(colors, colors.length, 1, format);
        gradientMap.needsUpdate = true;

        const tubeMaterial = new THREE.MeshToonMaterial({color: 0x049EF4, gradientMap: gradientMap});
        tubeMaterial.side = THREE.DoubleSide;

        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);

        this.modelMesh = {tube};
        EventManager.dispatchEvent({..._changeLightingEvent, model: 'cartoon'});
    }
}