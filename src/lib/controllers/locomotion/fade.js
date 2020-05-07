import {
    cameraGroup, camera
} from '../../scene.js';
import {
    Mesh,
    MeshBasicMaterial,
    SphereBufferGeometry,
    BackSide
} from 'three';

import TWEEN from '@tweenjs/tween.js/dist/tween.esm.js';

function locomotion(offset) {

    blinkerSphere.visible = true;
    blinkerSphere.material.opacity = 0;
    new TWEEN.Tween(blinkerSphere.material)
        .to({opacity: 1}, 200)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(function () {

            // Do the teleport
            cameraGroup.position.add(offset);

            // Fade back
            new TWEEN.Tween(blinkerSphere.material)
            .to({opacity: 0}, 200)
            .onComplete(() => blinkerSphere.visible = false)
            .start();
        })
        .start();
}

const blinkerSphereGeometry = new SphereBufferGeometry(0.3, 16, 16);
blinkerSphereGeometry.translate(0,0.3,0);
const blinkerSphereMaterial = new MeshBasicMaterial({
    side: BackSide,
    color: 0x000000,
    transparent: true
});
const blinkerSphere = new Mesh( blinkerSphereGeometry, blinkerSphereMaterial );
blinkerSphere.rotation.set(Math.PI/2, 0, 0);
blinkerSphere.position.set(0, 0, -0.3);
blinkerSphere.visible = false;
camera.add(blinkerSphere);
blinkerSphereMaterial.renderOrder = -101;

export {
    locomotion
}