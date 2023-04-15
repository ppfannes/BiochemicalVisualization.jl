import * as THREE from "three";
import {VRButton} from "vrbutton";

let inVR = false;

function initScene() {
    const canvas = document.getElementById('renderCanvas');
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 1.6, 3.5);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer));

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;

    const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const boxMaterials = [
        new THREE.MeshBasicMaterial({color: 0xFFFFFF}),
        new THREE.MeshBasicMaterial({color: 0xFF0000}),
        new THREE.MeshBasicMaterial({color: 0x00FF00}),
        new THREE.MeshBasicMaterial({color: 0x0000FF}),
        new THREE.MeshBasicMaterial({color: 0xFFFF00}),
        new THREE.MeshBasicMaterial({color: 0xFF00FF})
    ];

    const box = new THREE.Mesh(boxGeometry, boxMaterials);
    box.position.set(0, 1.6, 0);

    scene.add(box);

    function render(time) {
        if (inVR) {
            return;
        }

        time *= 0.001;

        box.rotation.z = time;
        box.rotation.y = time * 0.7;
        box.rotation.x = time * 0.3;

        renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(render);
}

initScene();