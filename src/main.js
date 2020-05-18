import {
    renderer,
    scene,
    camera
} from './lib/scene.js';

import {
    controller1
} from './lib/controllers/controllers.js';

import {
    gamepad
} from './lib/controllers/gamepad.js';

import {
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    TextureLoader,
    AdditiveBlending,
    CanvasTexture,
    DoubleSide
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// Red target on the floor
const targetTexture = new TextureLoader().load('./assets/target.png');
const target = new Mesh(
    new PlaneGeometry(0.5, 0.5, 1, 1),
    new MeshBasicMaterial({
        map: targetTexture,
        blending: AdditiveBlending,
        color: 0x660000,
        transparent: true
    })
);
target.position.z = -5;
target.position.y = 0.01;
target.rotation.x = -Math.PI/2;
scene.add(target);

// Debugging 

const canvas = document.createElement('canvas');
const canvasTexture = new CanvasTexture(canvas);
canvas.width = 1024;
canvas.height = 256;
const ctx = canvas.getContext('2d');
function writeText(text) {
    if (typeof text !== 'string') text = JSON.stringify(text,null,2);
    ctx.font = "120px fantasy";
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    text.split('\n').forEach((str, i) => ctx.fillText(str, 0, (i+1)*120));
    canvasTexture.needsUpdate = true;
}

const geometry = new PlaneGeometry( 0.3 * canvas.width/1024, 0.3 * canvas.height/1024 );
const material = new MeshBasicMaterial( {map: canvasTexture, blending: AdditiveBlending} );
const consolePlane = new Mesh( geometry, material );
consolePlane.renderOrder = 1;
consolePlane.position.set(0, 0.5 * 0.3 * canvas.height/1024, -0.1);
consolePlane.rotation.set(-Math.PI/4,0,0);
controller1.add( consolePlane );
writeText('hi');

gamepad.addEventListener('gamepadInteraction', function (event) {
    writeText(`${event.detail.type} ${event.detail.value}`);
});

(async function () {

    // Forest from Google Poly, https://poly.google.com/view/2_fv3tn3NG_
    const {scene: gltfScene} = await new Promise(resolve => loader.load('./assets/forest.glb', resolve));
    const trees = gltfScene.children[0];
    trees.position.z = -5;
    trees.position.y = 2.5;
    trees.scale.multiplyScalar(10);
    trees.traverse(o => {
        if (o.material) {
            o.material.side = DoubleSide;
            o.material.depthWrite = true;
        }
    });
    scene.add(trees);
}());

window.renderer = renderer;
window.camera = camera;