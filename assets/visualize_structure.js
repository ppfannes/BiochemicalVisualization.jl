import BABYLON from "./babylon.js";

let meshes = [];
let scene = null;
let engine = null;
let camera = null;
let hlMesh = null;
// let assetManager = null;

// TODO: Create base functionality for animations.

function* zip(arrays) {
  let iterators = arrays.map((a) => a[Symbol.iterator]());
  while (true) {
    let results = iterators.map((it) => it.next());
    if (results.some((r) => r.done)) return;
    yield results.map((r) => r.value);
  }
}

// function create_SSAO() {
//   const ssaoRatio = {
//     ssaoRatio: 0.5,
//     combineRatio: 1.0,
//   };
//   var ssao = new BABYLON.SSAORenderingPipeline(
//     "ssao",
//     scene,
//     ssaoRatio,
//     null,
//     false
//   );
//   ssao.maxZ = 500;
//   ssao.totalStrength = 1.3;
//   ssao.radius = 6e-4;
//   ssao.area = 1.0;
//   ssao.fallOff = 1e-6;
//   ssao.base = 0.5;
//   return ssao;
// }

// function create_SSAO2() {
//   const ssaoRatio = {
//     ssaoRatio: 0.5,
//     blurRatio: 0.5,
//   };
//   var ssao = new BABYLON.SSAO2RenderingPipeline(
//     "ssao",
//     scene,
//     ssaoRatio,
//     null,
//     false
//   );
//   ssao.maxZ = 500;
//   ssao.radius = 12.0;
//   ssao.totalStrength = 1.3;
//   ssao.expensiveBlur = false;
//   ssao.samples = 16;
//   scene.prePassRenderer.samples = 16;
//   return ssao;
// }

function update_mesh(mesh1, mesh2) {
  mesh1.setEnabled(true);
  mesh1.position.copyFrom(mesh2.position);
  mesh1.scaling.copyFrom(mesh2.scaling);
  mesh1.rotation.copyFrom(mesh2.rotation);
}

function disable_highlight(pickedMesh, hlMesh) {
  pickedMesh.setEnabled(true);
  hlMesh.setEnabled(false);
  pickedMesh = null;
}

// function create_modal() {
//   const modal_content = document.getElementById("modal-iframe");
//   const modal = document.getElementById("modal");
//   const close_button = document.getElementById("close-button");
//   modal_content.innerHTML = "This is some really long info text to see if text wrapping is working or not for this info box.";

//   window.addEventListener("click", function (event) {
//     if (event.target === modal) {
//       modal.classList.toggle("m-showModal");
//     }
//   });
//   close_button.addEventListener("click", function () {
//     modal.classList.toggle("m-showModal");
//   });

//   return [modal, modal_content];
// }

// function attach_SSAO(ssao) {
//   console.log("Attaching SSAO....");
//   scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
//     "ssao",
//     camera
//   );
//   scene.postProcessRenderPipelineManager.enableEffectInPipeline(
//     "ssao",
//     ssao.SSAOCombineRenderEffect,
//     camera
//   );

//   return true;
// }

// function detach_SSAO(ssao) {
//   console.log("Detaching SSAO....");
//   scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(
//     "ssao",
//     camera
//   );
//   scene.postProcessRenderPipelineManager.disableEffectInPipeline(
//     "ssao",
//     ssao.SSAOCombineRenderEffect,
//     camera
//   );

//   return false;
// }

// function draw_effect_SSAO(isAttached, ssao) {
//   console.log("Draw SSAO effect...");
//   if (!isAttached) {
//     isAttached = true;
//     scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
//       "ssao",
//       camera
//     );
//   }
//   scene.postProcessRenderPipelineManager.disableEffectInPipeline(
//     "ssao",
//     ssao.SSAOCombineRenderEffect,
//     camera
//   );
// }

// function create_and_attach_SSAO(isAttached, ssao, pipeline_name) {
//   if (isAttached) {
//     isAttached = detach_SSAO(ssao);
//   }

//   if (pipeline_name === "SSAO1") {
//     console.log("Creating + attaching SSAO1...");
//     ssao = create_SSAO();
//   } else if (pipeline_name === "SSAO2") {
//     console.log("Creating + attaching SSAO2...");
//     ssao = create_SSAO2();
//   }

//   isAttached = attach_SSAO(ssao);
// }

// function debug_scene(scene) {
//   const instrumentation = new BABYLON.SceneInstrumentation(scene);
//   var active_meshes_eval = document.getElementById("active-meshes-eval");
//   var render_targets = document.getElementById("render-targets");
//   var frame_time = document.getElementById("frame-time");
//   var render_time = document.getElementById("render-time");
//   var draw_calls = document.getElementById("draw-calls");

//   instrumentation.captureActiveMeshesEvaluationTime = true;
//   instrumentation.captureRenderTargetsRenderTime = true;
//   instrumentation.captureFrameTime = true;
//   instrumentation.captureRenderTime = true;

//   scene.onAfterRenderObservable.add(() => {
//     active_meshes_eval.innerHTML = (instrumentation.activeMeshesEvaluationTimeCounter.current * 0.000001).toFixed(2) + " ms";
//     render_targets.innerHTML = (instrumentation.renderTargetsRenderTimeCounter.current + 0.000001).toFixed(2) + " ms";
//     frame_time.innerHTML = instrumentation.frameTimeCounter.current;
//     render_time.innerHTML = (instrumentation.renderTimeCounter.current).toFixed(2) + " FPS";
//     draw_calls.innerHTML = instrumentation.drawCallsCounter.current;
//   });
// }

function setup(container, width, height) {
  engine = new BABYLON.Engine(container);
  engine.setSize(width, height);
  scene = new BABYLON.Scene(engine);
  assetManager = new BABYLON.AssetsManager(scene);
  scene.clearColor = BABYLON.Color3.White();

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

  // var ssao = create_SSAO();
  // const [modal, modal_content] = create_modal();
  // var isAttached = attach_SSAO(ssao);

  // debug_scene(scene);

  let pickedMesh = null;
  scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
      // case BABYLON.PointerEventTypes.POINTERUP:
      //   var result = scene.pick(scene.pointerX, scene.pointerY);
      //   if (result.hit) {
      //     modal.classList.toggle("m-showModal");
      //     modal_content.innerHTML = pickedMesh.position;
      //   } else if (!result.hit && modal.classList.contains("m-showModal")) {
      //     modal.classList.toggle("m-showModal");
      //   }
      case BABYLON.PointerEventTypes.POINTERMOVE:
        var result = scene.pick(scene.pointerX, scene.pointerY);
        if (
          result.hit &&
          result.pickedMesh !== pickedMesh &&
          result.pickedMesh !== hlMesh
        ) {
          if (pickedMesh) {
            update_mesh(pickedMesh, hlMesh);
          }

          pickedMesh = result.pickedMesh;
          pickedMesh.setEnabled(false);

          update_mesh(hlMesh, pickedMesh);
        } else if (!result.hit && pickedMesh) {
          disable_highlight(pickedMesh, hlMesh);
        }
    }
  });

  // assetManager.onTaskSuccessObservable.add((task) => {
  //   let mesh = task.loadedMeshes[0];
  //   console.log("Task successful...", task, mesh);
  // });

  // assetManager.onTaskErrorObservable.add((task) => {
  //   console.log("Task failed...", task.errorObject.message, task.errorObject.exception);
  // });

  // window.addEventListener("keydown", function (event) {
  //   console.log(event.key);
  //   if (event.key === "1") {
  //     if (!isAttached) {
  //       isAttached = attach_SSAO(ssao);
  //     }
  //   } else if (event.key === "2") {
  //     if (isAttached) {
  //       isAttached = detach_SSAO(ssao);
  //     }
  //   } else if (event.key === "3") {
  //     draw_effect_SSAO(isAttached, ssao);
  //   } else if (event.key === "9") {
  //     create_and_attach_SSAO(isAttached, ssao, "SSAO1");
  //   } else if (event.key === "0") {
  //     create_and_attach_SSAO(isAttached, ssao, "SSAO2");
  //   }
  // });
}

function addRepresentation(r) {
  let mesh = renderRepresentation(r);
  mesh.children.forEach((child) => {
    scene.addMesh(child);
  });
  scene.freezeMaterials();
  scene.meshes.forEach((m) => {
    m.alwaysSelectAsActiveMesh = true;
    m.freezeWorldMatrix();
  });
  setTimeout(() => {
    scene.freezeActiveMeshes(true);
  }, 1000);
  meshes.push(mesh);
}

function addMesh(vertices, indices) {
  const material = new BABYLON.StandardMaterial("material", scene);
  material.backFaceCulling = false;
  var mesh = new BABYLON.Mesh("mesh", scene);
  mesh.material = material;
  var vertexData = new BABYLON.VertexData();
  var normals = [];
  BABYLON.VertexData.ComputeNormals(vertices, indices, normals);
  vertexData.positions = Array.from(vertices);
  vertexData.indices = indices;
  vertexData.normals = normals;
  vertexData.applyToMesh(mesh);
  meshes.push(mesh);
}

function addTube(splinePoints) {
  const material = new BABYLON.StandardMaterial("material", scene);
  material.backFaceCulling = false;
  var path = splinePoints.map(
    (point) => new BABYLON.Vector3(point[0], point[1], point[2])
  );
  var tubeMesh = new BABYLON.MeshBuilder.CreateTube(
    "tube",
    { path: path, updatable: true, radius: 0.5 },
    scene
  );
  tubeMesh.material = material;
  meshes.push(tubeMesh);
}

function updateRepresentation(i, r) {
  let old_geo = meshes[i];
  let new_geo = renderRepresentation(r);
  old_geo.children.forEach(c => {
    c.dispose();
    c = null;
  });
  new_geo.children.forEach(c => scene.addMesh(c));
  scene.freezeMaterials();
  scene.meshes.forEach((m) => {
    m.alwaysSelectAsActiveMesh = true;
    m.freezeWorldMatrix();
  });
  setTimeout(() => {
    scene.freezeActiveMeshes(true);
  }, 1000);
  meshes[i] = new_geo;
}

function removeMeshFromScene(i) {
  let mesh = meshes[i]
  mesh.children.forEach(c => {
    c.dispose();
    c = null;
  });
}

// function loadGLTFMesh(files) {
//   let fileName = files[0].name;
//   let blob = new Blob([files[0]]);

//   BABYLON.FilesInput.FilesToLoad[fileName.toLowerCase()] = blob;

//   assetManager.addMeshTask("GLTFModel", "", "file:", fileName.toLowerCase());
//   assetManager.load();
// }

function renderRepresentation(representation) {
  console.log("Start rendering....");
  let mesh = { children: [] };
  const material = new BABYLON.StandardMaterial("material");
  for (let key in representation.primitives) {
    switch (key) {
      case "spheres":
        console.log("Building Atoms....");
        const sphere_colors = representation.colors["sphere_colors"];
        const spheres = representation.primitives[key];
        var root_sphere = BABYLON.MeshBuilder.CreateSphere(
          "rootSphere",
          { diameter: 1.0 },
          scene
        );

        root_sphere.material = material;
        root_sphere.registerInstancedBuffer("color", 4);

        const hl = new BABYLON.HighlightLayer("h1", scene);
        hlMesh = root_sphere.clone("hlMesh");
        hl.addMesh(hlMesh, BABYLON.Color3.Blue());
        hlMesh.setEnabled(false);

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

  return instance;
}

function render() {
  engine.runRenderLoop(() => {
    scene.render();
  });
}

function animate() { }

export {
  addMesh,
  addRepresentation,
  addTube,
  animate,
  camera,
  engine,
  meshes,
  render,
  scene,
  setup,
  updateRepresentation,
  removeMeshFromScene,
  // loadGLTFMesh,
};

