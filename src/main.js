import {
    renderer,
    scene,
    camera
} from './lib/scene.js';

import './lib/controllers';

import {
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    TextureLoader,
    AdditiveBlending
} from 'three';

const targetTexture = new TextureLoader().load('./images/target.png');
const target = new Mesh(
    new PlaneGeometry(0.5, 0.5, 1, 1),
    new MeshBasicMaterial({
        map: targetTexture,
        blending: AdditiveBlending,
        color: 0xff0000,
        transparent: true
    })
);
target.position.z = -5;
target.position.y = 0.1;
target.rotation.x = -Math.PI/2;
scene.add(target);

window.renderer = renderer;
window.camera = camera;