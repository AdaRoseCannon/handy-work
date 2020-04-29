import { OrbitControls } from 'https://unpkg.com/three@0.108.0/examples/jsm/controls/OrbitControls.js'
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
    SpotLight,
    PCFSoftShadowMap,
    Matrix4,
    Color,
    MeshStandardMaterial,
    PlaneGeometry,
    TextureLoader,
    Vector2,
    Group,
    RepeatWrapping
} from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

const canvas = document.querySelector('canvas');
const renderer = new WebGLRenderer({ canvas: canvas });
renderer.xr.enabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild( VRButton.createButton( renderer ) );

const scene = new Scene();
scene.name = "xrgarden"
window.scene = scene;
const camera = new PerspectiveCamera();
camera.far = 40;
scene.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);
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

light.add(
    new Mesh(new SphereGeometry(2, 32, 32), new MeshBasicMaterial({
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
            col1 = vec4(0.6);
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

renderer.setAnimationLoop(function () {
    renderer.render(scene, camera);
});
