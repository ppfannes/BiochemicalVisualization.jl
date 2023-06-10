import { BABYLON } from "./babylon.js";

let meshes = [];
let scene = null;
let engine = null;
let camera = null;

function* zip(arrays) {
  let iterators = arrays.map((a) => a[Symbol.iterator]());
  while (true) {
    let results = iterators.map((it) => it.next());
    if (results.some((r) => r.done)) return;
    yield results.map((r) => r.value);
  }
}

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
  console.log(mesh);
  mesh.children.forEach((child) => {
    scene.addMesh(child);
  });
  console.log(scene);
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
  const material = new BABYLON.StandardMaterial("material");
  for (let key in representation.primitives) {
    console.log(key);
    switch (key) {
      case "spheres":
        console.log("Creating sphere...");
        const sphere_colors = representation.colors["sphere_colors"];
        const spheres = representation.primitives[key];
        var root_sphere = BABYLON.MeshBuilder.CreateSphere(
          "rootSphere",
          { diameter: 1.0 },
          scene
        );
        root_sphere.material = material;
        root_sphere.registerInstancedBuffer("color", 4);
        root_sphere.isVisible = false;

        for (let [sphere, sphere_color] of zip([spheres, sphere_colors])) {
          let instance = root_sphere.createInstance("childSphere");
          instance.isVisible = true;
          instance.instancedBuffers.color = new BABYLON.Color4.FromHexString(
            sphere_color
          );
          instance.position.set(
            sphere.center[0],
            sphere.center[1],
            sphere.center[2]
          );
          instance.scaling = instance.scaling.scale(sphere.r * 2.0);
          mesh.children.push(instance);
        }
        break;

      case "cylinders":
        const cylinder_colors = representation.colors["cylinder_colors"];
        const cylinders = representation.primitives[key];
        var root_cylinder = BABYLON.MeshBuilder.CreateCylinder(
          "rootCylinder",
          { diameter: 1.0, tessellation: 32, height: 1.0 },
          scene
        );
        root_cylinder.material = material;
        root_cylinder.registerInstancedBuffer("color", 4);
        root_cylinder.isVisible = false;

        for (let [cylinder, cylinder_color] of zip([
          cylinders,
          cylinder_colors,
        ])) {
          let instance = createCylinderInstance(
            cylinder_color,
            cylinder,
            root_cylinder
          );
          mesh.children.push(instance);
        }
        break;
    }
  }
  return mesh;
}

function createCylinderInstance(color, cylinder_data, root_instance) {
  let s = new BABYLON.Vector3(
    cylinder_data.origin[0],
    cylinder_data.origin[1],
    cylinder_data.origin[2]
  );
  let m = new BABYLON.Vector3(
    cylinder_data.extremity[0],
    cylinder_data.extremity[1],
    cylinder_data.extremity[2]
  );

  let instance = root_instance.createInstance("childCylinder");
  instance.instancedBuffers.color = new BABYLON.Color4.FromHexString(color);
  instance.scaling = instance.scaling.scale(cylinder_data.r * 2.0);
  instance.scaling.y = BABYLON.Vector3.Distance(s, m);

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
  instance.rotationQuaternion = quaternion;

  instance.translate(
    new BABYLON.Vector3((bx + ax) / 2, (by + ay) / 2, (bz + az) / 2),
    1,
    BABYLON.Space.WORLD
  );
  console.log(instance);

  return instance;
}

function render() {
  engine.runRenderLoop(() => {
    scene.render();
  });
}

function animate() {}

export {
  addRepresentation,
  animate,
  camera,
  engine,
  meshes,
  render,
  scene,
  setup,
  updateRepresentation,
};
