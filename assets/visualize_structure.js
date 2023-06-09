import { BABYLON } from "./babylon.js";

let meshes = [];
let scene = null;
let engine = null;
let camera = null;

function setup(container, width, height) {
  engine = new BABYLON.Engine(container);
  scene = new BABYLON.Scene(engine);
  camera = new BABYLON.ArcRotateCamera(
    "camera",
    -2 * Math.PI,
    2 * Math.PI,
    12,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(container, true);
  var light1 = new BABYLON.HemisphericLight(
    "light1",
    new BABYLON.Vector3(0, 5, -10),
    scene
  );
  light1.intensity = 0.8;
  var light2 = new BABYLON.HemisphericLight(
    "light2",
    new BABYLON.Vector3(0, 5, 10),
    scene
  );
  light2.intensity = 0.8;
  window.addEventListener("resize", function () {
    engine.resize();
  });
}

function addRepresentation(r) {
  let mesh = renderRepresentation(r);
  mesh.children.forEach((child) => {
    scene.addMesh(child);
  });
  meshes.push(mesh);
}

function updateRepresentation(i, r) {
  // let old_geo = meshes[i]
  // let new_geo = renderRepresentation(r)
  // old_geo.children.forEach(c => {
  //     scene.remove(c)
  //     c.geometry.dispose()
  //     c.material.dispose()
  // })
  // new_geo.children.forEach(c => scene.add(c))
  // meshes[i] = new_geo
}

function renderRepresentation(representation) {
  let mesh = { children: [] };
  for (let i = 0; i < representation.primitives.length; i++) {
    let primitive = representation.primitives[i];

    // check the type of representation
    if ("center" in primitive && "r" in primitive) {
      // a sphere
      let sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere" + i,
        { diameter: primitive.r * 2.0 },
        scene
      );
      let material = new BABYLON.StandardMaterial("material" + i);
      material.diffuseColor = BABYLON.Color3.FromHexString(
        representation.colors[i]
      );
      sphere.material = material;

      sphere.position.set(
        primitive.center[0],
        primitive.center[1],
        primitive.center[2]
      );
      mesh.children.push(sphere);
    } else if (
      "origin" in primitive &&
      "extremity" in primitive &&
      "r" in primitive
    ) {
      // a cylinder
      let cylinder = createCylinder(
        primitive.origin,
        primitive.extremity,
        primitive.r,
        i,
        representation.colors[i]
      );

      // add to geometry list
      mesh.children.push(cylinder);
    }
  }

  return mesh;
}

function createCylinder(s_i, m_i, r, i, color) {
  let s = new BABYLON.Vector3(s_i[0], s_i[1], s_i[2]);
  let m = new BABYLON.Vector3(m_i[0], m_i[1], m_i[2]);

  let cylinder = BABYLON.MeshBuilder.CreateCylinder(
    "cylinder" + i,
    {
      diameter: r * 2.0,
      tessellation: 32,
      height: BABYLON.Vector3.Distance(s, m),
    },
    scene
  );
  console.log(cylinder);
  let material = new BABYLON.StandardMaterial("material" + i);
  material.diffuseColor = BABYLON.Color3.FromHexString(color);
  cylinder.material = material;

  const { x: ax, y: ay, z: az } = s;
  const { x: bx, y: by, z: bz } = m;
  const stickAxis = new BABYLON.Vector3(bx - ax, by - ay, bz - az).normalize();
  const cylinderUpAxis = new BABYLON.Vector3(0, 1, 0);

  const quaternion = new BABYLON.Quaternion();
  BABYLON.Quaternion.FromUnitVectorsToRef(
    cylinderUpAxis,
    stickAxis,
    quaternion
  );
  cylinder.rotationQuaternion = quaternion;

  cylinder.translate(
    new BABYLON.Vector3((bx + ax) / 2, (by + ay) / 2, (bz + az) / 2),
    1,
    BABYLON.Space.WORLD
  );

  return cylinder;
}

function render() {
  engine.runRenderLoop(() => {
    scene.render();
  });
}

function animate() {}

export {
  addRepresentation, animate, camera, engine, meshes, render, scene, setup, updateRepresentation
};

