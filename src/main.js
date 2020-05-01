/* eslint-disable no-case-declarations */
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    AmbientLight,
    DirectionalLight,
    SphereGeometry,
    BackSide,
    Mesh,
    MeshBasicMaterial,
    Vector3,
    PCFSoftShadowMap,
    MeshStandardMaterial,
    PlaneGeometry,
    TextureLoader,
    Group,
    RepeatWrapping,
    BufferGeometry,
    BufferAttribute,
    LineBasicMaterial,
    AdditiveBlending,
    Line
} from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'; 
import WebXRPolyfill from 'webxr-polyfill';

const canvas = document.querySelector('canvas');
const renderer = new WebGLRenderer({ canvas: canvas });
renderer.xr.enabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new Scene();
scene.name = "xrgarden"
window.scene = scene;
const camera = new PerspectiveCamera();
camera.far = 40;
scene.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI * 0.5;
controls.target = new Vector3(0, 1, -5);
camera.position.set(0, 1.6, 0);
controls.update();

function onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
window.addEventListener('resize', onWindowResize, false);
onWindowResize();

const light = new DirectionalLight(0xffaa33);
light.position.set(-10, 10, 10);
light.intensity = 1.0;
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
light.shadow.camera.near = 1;
light.shadow.camera.far = 30;
scene.add(light);

// Add the sun
light.add(
    new Mesh(new SphereGeometry(1, 32, 32), new MeshBasicMaterial({
        color: 0xffaa33
    }))
)

const light2 = new AmbientLight(0x003973);
light2.intensity = 1.0;
scene.add(light2);

const floorTexture = new TextureLoader().load('https://cdn.glitch.com/3423c223-e1e5-450d-8cfa-2f5215104916%2Fmemphis-mini.png?v=1579618577700');
floorTexture.repeat.multiplyScalar(8);
floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
const floor = new Mesh(
    new PlaneGeometry(50, 50, 5, 5),
    new MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.9
    })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
floor.name = 'floor';
scene.add(floor);

const skygeometry = new SphereGeometry(25, 50, 50, 0, 2 * Math.PI);
const skymaterial = new MeshBasicMaterial();
skymaterial.side = BackSide;
skymaterial.onBeforeCompile = function (shader) {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\n#define USE_UV');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n#define USE_UV');
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', `
        vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
    `)
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        vec4 col1;
        vec4 col2;
        float mixAmount;
        if (vUv.y > 0.5) {
            col1 = vec4( 249, 229, 180, 1 ) / 255.0;
            col2 = vec4( 0, 57, 115, 1 ) / 255.0;
            float newY = (vUv.y - 0.5) * 2.0;
            mixAmount = sqrt(newY)*2.0;
        } else {
            col1 = vec4(0.6,0.6,0.6,1.0);
        }
        diffuseColor *= mix(col1, col2, mixAmount);
    `);
};
const skysphere = new Mesh(skygeometry, skymaterial);
skysphere.name = 'skysphere';
scene.add(skysphere);

const stage = new Group();
scene.add(stage);
stage.position.set(0, 0, -5);
stage.rotation.set(0, -Math.PI / 2, 0);

new WebXRPolyfill();
document.body.appendChild( VRButton.createButton( renderer ) );


function positionAtT(inVec,t,p,v,g) {
    inVec.copy(p);
    inVec.addScaledVector(v,t);
    inVec.addScaledVector(g,0.5*t**2);
    return inVec;
}

const g = new Vector3(0,-9.8,0);
const tempVec0 = new Vector3();
const tempVec1 = new Vector3();
const tempVecP = new Vector3();
const tempVecV = new Vector3();

const lineSegments=10;
const lineGeometry = new BufferGeometry();
const lineGeometryVertices = new Float32Array((lineSegments +1) * 3);
lineGeometryVertices.fill(0);
const lineGeometryColors = new Float32Array((lineSegments +1) * 3);
lineGeometryColors.fill(0.5);
lineGeometry.setAttribute('position', new BufferAttribute(lineGeometryVertices, 3));
lineGeometry.setAttribute('color', new BufferAttribute(lineGeometryColors, 3));
const lineMaterial = new LineBasicMaterial({ vertexColors: true, blending: AdditiveBlending });
const guideline = new Line( lineGeometry, lineMaterial );

function onSelectStart() {
    guidingController = this;
    this.add(guideline);
}
function onSelectEnd(e) {
    console.log(e);
}

const controller1 = renderer.xr.getController(0);
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
controller1.add(guideline);
scene.add(controller1);
let guidingController = controller1;

const controller2 = renderer.xr.getController(1);
controller2.addEventListener('selectstart', onSelectStart);
controller2.addEventListener('selectend', onSelectEnd);
scene.add(controller2);

const controllerModelFactory = new XRControllerModelFactory();

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
scene.add( controllerGrip1 );

const controllerGrip2 = renderer.xr.getControllerGrip( 1 );
controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
scene.add( controllerGrip2 );

renderer.setAnimationLoop(function () {
    // Controller start position
    const p = tempVecP;
    guidingController.getWorldPosition(p);

    // virtual tele ball velocity
    const v = tempVecV;
    guidingController.getWorldDirection(v);
    v.multiplyScalar(3);

    // Time for ball to hit ground
    const t = (-v.y  + Math.sqrt(v.y**2 - 2*p.y*g.y))/g.y;

    const from = tempVec0;
    const to = tempVec1;

    from.set(0,0,0);
    for (let i=1; i<=lineSegments; i++) {

        // Current position of the virtual ball at time t, written to the variable 'to'
        positionAtT(to,i*t/lineSegments,p,v,g);
        guidingController.worldToLocal(to);
        to.toArray(lineGeometryVertices,i*3);
    }
    guideline.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
});