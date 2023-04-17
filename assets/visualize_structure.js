import { 
    WebGLRenderer, Scene, PerspectiveCamera, SphereGeometry,
    Mesh, MeshPhongMaterial, AmbientLight, PointLight, Vector3,
    CylinderGeometry, Quaternion
} from "./three.module.js";

import { OrbitControls } from "./OrbitControls.js"

function setup(container, width, height) {
    let renderer = new WebGLRenderer({antialias: true});
    renderer.setSize(width, height);
    renderer.setClearColor("#000000");
    container.appendChild(renderer.domElement);

    let scene = new Scene();
    let camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 4;

    var ambientLight = new AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);
    var pointLight = new PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    scene.add(camera);

    return { renderer, scene, camera };
}

function VanDerWaalsModel(scene, spheres, colors) {
    let geometry = new SphereGeometry(1.0, 32, 32);

    for (let i=0; i<spheres.length; ++i) {
        let s = spheres[i];
        
        let material = new MeshPhongMaterial({color: parseInt(colors[i])});
        let sphere = new Mesh(geometry, material);

        sphere.position.set(s[0], s[1], s[2]);
        scene.add(sphere);
    }
}

function ballAndStickModel(scene, spheres, bonds, midpoints, colors) {
    let ball_geometry = new SphereGeometry(0.4, 32, 32);

    for (let i=0; i<spheres.length; ++i) {
        // first, create spheres for each atom
        let s = spheres[i];
        
        let material = new MeshPhongMaterial({color: parseInt(colors[i])});
        let sphere = new Mesh(ball_geometry, material);

        sphere.position.set(s[0], s[1], s[2]);
        scene.add(sphere);
    }

    for (let i=0; i<bonds.length; ++i) {
        // and then, create sticks for each bond
        let i1 = bonds[i][0]-1
        let i2 = bonds[i][1]-1

        let e1 = spheres[i1]
        let e2 = spheres[i2]

        // get the endpoints...
        let s1 = new Vector3(e1[0], e1[1], e1[2]);
        let s2 = new Vector3(e2[0], e2[1], e2[2]);
        
        // and colors...
        let c1 = parseInt(colors[i1]);
        let c2 = parseInt(colors[i2]);

        // and the midpoint
        let mi = midpoints[i];

        let m = new Vector3(mi[0], mi[1], mi[2]);

        function addCylinder(s, m, color) {
            const cylinder = new 
                CylinderGeometry(0.2, 0.2, s.distanceTo(m), 32, 2);

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

            // add to geometry list
            scene.add(new Mesh(
                cylinder,
                new MeshPhongMaterial({color: color})
            ))
        }
      
       addCylinder(s1, m,  c1);
       addCylinder(m,  s2, c2);
    }
}

function setupControls(renderer, scene, camera, focus_point) {
    let controls = new OrbitControls( camera, renderer.domElement );
    //controls.listenToKeyEvents( window ); // optional
        
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = true;

    controls.minDistance = 0;
    controls.maxDistance = 500;

    controls.maxPolarAngle = Math.PI / 2;

    controls.target = new Vector3(focus_point[0], focus_point[1], focus_point[2]);
    
    return controls;
}

export { setup, setupControls, VanDerWaalsModel, ballAndStickModel };