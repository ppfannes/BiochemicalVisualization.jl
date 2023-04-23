import { 
    WebGLRenderer, Scene, PerspectiveCamera, SphereGeometry,
    Mesh, MeshPhongMaterial, AmbientLight, PointLight, Vector3,
    CylinderGeometry, Quaternion
} from "./three.module.js";

import { OrbitControls } from "./OrbitControls.js"

let geometries = []
let scene = null
let renderer = null
let camera = null
let controls = null

function setup(container, width, height) {
    renderer = new WebGLRenderer({antialias: true});
    renderer.setSize(width, height);
    renderer.setClearColor("#000000");
    container.appendChild(renderer.domElement);

    camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 4;

    var ambientLight = new AmbientLight(0xcccccc, 0.4);
    var pointLight = new PointLight(0xffffff, 0.8);
    camera.add(pointLight);

    scene = new Scene();
    scene.add(ambientLight);
    scene.add(camera);
}

function addRepresentation(r) {
    let geo = renderRepresentation(r)
    geo.children.forEach(c => scene.add(c))
    geometries.push(geo)
}

function updateRepresentation(i, r) {
    let old_geo = geometries[i]
    let new_geo = renderRepresentation(r)

    old_geo.children.forEach(c => {
        scene.remove(c)
        c.geometry.dispose()
        c.material.dispose()
    })

    new_geo.children.forEach(c => scene.add(c))
    geometries[i] = new_geo
}

function renderRepresentation(representation) {
    let geometry = { children: [] }
    for (let i=0; i<representation.primitives.length; ++i) {
        let material = new MeshPhongMaterial(
            {
                color: parseInt(representation.colors[i])
            }
        );

        let p = representation.primitives[i]

        // check the type of representation
        if ('center' in p && 'r' in p) {
            // a sphere
            let sphere_geometry = new SphereGeometry(p.r, 32, 32);

            let sphere = new Mesh(sphere_geometry, material);

            sphere.position.set(p.center[0], p.center[1], p.center[2]);
            geometry.children.push(sphere);
        } else if ('origin' in p && 'extremity' in p && 'r' in p) {
            // a cylinder
            let cylinder = createCylinder(p.origin, p.extremity, p.r)

            // add to geometry list
            geometry.children.push(new Mesh(
                cylinder,
                material
            ))
        }
    }

    return geometry
}

function createCylinder(s_i, m_i, r) {
    let s = new Vector3(s_i[0], s_i[1], s_i[2]);
    let m = new Vector3(m_i[0], m_i[1], m_i[2]);

    const cylinder = new 
        CylinderGeometry(r, r, s.distanceTo(m), 32, 2);

    // stick endpoints define the axis of stick alignment
    const { x:ax, y:ay, z:az } = s
    const { x:bx, y:by, z:bz } = m
    const stickAxis = new Vector3(bx-ax, by-ay, bz-az).normalize()

    // Use quaternion to rotate cylinder from default to target orientation
    const quaternion = new Quaternion()
    const cylinderUpAxis = new Vector3( 0, 1, 0 )
    quaternion.setFromUnitVectors(cylinderUpAxis, stickAxis)
    cylinder.applyQuaternion(quaternion)

    // Translate oriented stick to location between endpoints
    cylinder.translate((bx+ax)/2, (by+ay)/2, (bz+az)/2)

    return cylinder;
}

function setupControls(focus_point) {
    controls = new OrbitControls( camera, renderer.domElement );
    //controls.listenToKeyEvents( window ); // optional
        
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = true;

    controls.minDistance = 0;
    controls.maxDistance = 500;

    controls.maxPolarAngle = Math.PI / 2;

    controls.target = new Vector3(focus_point[0], focus_point[1], focus_point[2]);
    
    controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
}

function render() {
    renderer.render(scene, camera)
}
	
function animate() {         
    requestAnimationFrame( animate );                  
    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true              
    render();
}

export { 
    setup, setupControls, animate, render, addRepresentation, updateRepresentation,
    renderer, camera, scene, geometries, controls
};