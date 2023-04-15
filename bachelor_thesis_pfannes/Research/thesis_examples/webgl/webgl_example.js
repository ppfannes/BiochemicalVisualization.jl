let cubeRotation = 0.0;
let inVR = false;
let xrSession, xrReferenceSpace, xrFrame, enterVR;

window.onload = main;

function main() {
    const canvasId = 'renderCanvas';
    const canvas = document.getElementById(canvasId);
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
        alert('Failed to get rendering context.');
        return;
    }

    const vertexShaderSource =
        `attribute vec3 aPosition;
         attribute vec4 aVertColor;
         
         uniform mat4 uProjMatrix;
         uniform mat4 uModelViewMatrix;
         
         varying lowp vec4 vColor;
         
         void main() {
            gl_Position = uProjMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
            vColor = aVertColor;
         }`;

    const fragmentShaderSource =
        `varying lowp vec4 vColor;
         
         void main() {
            gl_FragColor = vColor;
         }`;

    const program = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    const progInfo = {
        program: program,
        attribLocs: {
            vertexPosition: gl.getAttribLocation(program, 'aPosition'),
            vertexColor: gl.getAttribLocation(program, 'aVertColor')
        },
        uniformLocs: {
            projMatrix: gl.getUniformLocation(program, 'uProjMatrix'),
            modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix')
        }
    };

    const buffers = initBuffers(gl);

    let then = 0;

    function render(now) {
        if (inVR) {
            return;
        }

        now *= 0.001;
        const deltaTime = now - then;
        then = now;

        sceneDraw(gl, progInfo, buffers, deltaTime);

        requestAnimationFrame(render);
    }

    vrSetup();

    requestAnimationFrame(render);

    enterVR = function enterVR() {
        navigator.xr.requestSession('immersive-vr').then((session) => {
            xrSession = session;
            xrSession.requestReferenceSpace('local').then((referenceSpace) => {
                xrReferenceSpace = referenceSpace;
            });
            inVR = true;

            gl.makeXRCompatible().then((xrContext) => {
                const xrLayer = new XRWebGLLayer(xrSession, gl);
                xrSession.updateRenderState({'baseLayer': xrLayer});
                gl.bindFramebuffer(gl.FRAMEBUFFER, xrLayer.framebuffer);
            });

            const renderVR = (now, frame) => {
                if (xrSession == null || !inVR) {
                    return;
                }

                xrFrame = frame;

                xrSession.requestAnimationFrame(renderVR);

                now *= 0.001;
                const deltaTime = now - then;
                then = now;

                sceneDrawVR(gl, progInfo, buffers, deltaTime);
            };

            xrSession.requestAnimationFrame(renderVR);
        });
    };
}

function sceneDrawVR(gl, progInfo, buffers, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    cubeRotation += deltaTime;

    let pose = xrFrame.getViewerPose(xrReferenceSpace);

    for (eye of pose.views) {
        renderEye(gl, progInfo, buffers, eye);
    }

    gl.finish();
}

function renderEye(gl, progInfo, buffers, eye) {
    let projection, view;
    let viewport = xrSession.renderState.baseLayer.getViewport(eye);
    gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
    projection = eye.projectionMatrix;
    view = eye.transform.inverse.matrix;

    const modelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, new Float32Array([0.0, 0.0, -4.0]));
    glMatrix.mat4.rotateZ(modelViewMatrix, modelViewMatrix, cubeRotation);
    glMatrix.mat4.rotateY(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7);
    glMatrix.mat4.rotateX(modelViewMatrix, modelViewMatrix, cubeRotation * 0.3);

    glMatrix.mat4.multiply(modelViewMatrix, view, modelViewMatrix);

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(progInfo.attribLocs.vertexPosition, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(progInfo.attribLocs.vertexPosition);
    }

    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(progInfo.attribLocs.vertexColor, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(progInfo.attribLocs.vertexColor);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.useProgram(progInfo.program);

    gl.uniformMatrix4fv(progInfo.uniformLocs.projMatrix, false, projection);
    gl.uniformMatrix4fv(progInfo.uniformLocs.modelViewMatrix, false, modelViewMatrix);

    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

function vrSetup() {
    if (!navigator.xr) {
        alert('Your browser does not support WebXR!');
        return;
    }
}

function initBuffers(gl) {
    
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

    /*
    *   v6------v5
    *  /|       /|
    * v1-------v0
    * | |      | |
    * | |      | |
    * | v7-----|v4
    * |/       |/
    * v2-------v3
    */
    const vertices = [
        1.0, 1.0, 1.0,      // v0
        -1.0, 1.0, 1.0,     // v1
        -1.0, -1.0, 1.0,    // v2
        1.0, -1.0, 1.0,     // v3

        1.0, 1.0, 1.0,      // v0
        1.0, -1.0, 1.0,     // v3
        1.0, -1.0, -1.0,    // v4
        1.0, 1.0, -1.0,     // v5

        1.0, 1.0, 1.0,      // v0
        1.0, 1.0, -1.0,     // v5
        -1.0, 1.0, -1.0,    // v6
        -1.0, 1.0, 1.0,     // v1

        -1.0, 1.0, 1.0,     // v1
        -1.0, 1.0, -1.0,    // v6
        -1.0, -1.0, -1.0,   // v7
        -1.0, -1.0, 1.0,    // v2

        1.0, 1.0, -1.0,     // v5
        1.0, -1.0, -1.0,    // v4
        -1.0, -1.0, -1.0,   // v7
        -1.0, 1.0, -1.0,    // v6

        -1.0, -1.0, -1.0,   // v7
        -1.0, -1.0, 1.0,    // v2
        1.0, -1.0, 1.0,     // v3
        1.0, -1.0, -1.0     // v4
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const faceColors = [
        [1.0, 1.0, 1.0, 1.0],
        [1.0, 0.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
        [1.0, 1.0, 0.0, 1.0],
        [1.0, 0.0, 1.0, 1.0]
    ];

    let colors = [];

    for (let i = 0; i < faceColors.length; ++i) {
        const col = faceColors[i];
        colors = colors.concat(col, col, col, col);
    }

    const colBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const indBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indBuffer);
    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 10, 11, 8, 9, 10,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 22, 21, 20, 23, 22
    ]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return {
        position: posBuffer,
        color: colBuffer,
        indices: indBuffer
    };
}

function sceneDraw(gl, progInfo, buffers, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fov = (45 * Math.PI) / 100;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const near = 0.1;
    const far = 100.0;
    const projMatrix = glMatrix.mat4.create();

    glMatrix.mat4.perspective(projMatrix, fov, aspect, near, far);

    const modelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, new Float32Array([0.0, 0.0, -4.0]));
    glMatrix.mat4.rotateZ(modelViewMatrix, modelViewMatrix, cubeRotation);
    glMatrix.mat4.rotateY(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7);
    glMatrix.mat4.rotateX(modelViewMatrix, modelViewMatrix, cubeRotation * 0.3);

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(progInfo.attribLocs.vertexPosition, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(progInfo.attribLocs.vertexPosition);
    }

    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(progInfo.attribLocs.vertexColor, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(progInfo.attribLocs.vertexColor);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.useProgram(progInfo.program);

    gl.uniformMatrix4fv(progInfo.uniformLocs.projMatrix, false, projMatrix);
    gl.uniformMatrix4fv(progInfo.uniformLocs.modelViewMatrix, false, modelViewMatrix);

    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

    cubeRotation += deltaTime;
}

function initShaderProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('An error occurred while initialising the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred while compiling the shader: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}