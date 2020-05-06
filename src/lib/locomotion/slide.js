import {
    cameraGroup, camera
} from '../scene.js';
import {
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    TextureLoader,
    AdditiveBlending,
    RepeatWrapping,
    SphereBufferGeometry,
    BackSide,
    SphereGeometry,
    Vector3
} from 'three';

import TWEEN from '@tweenjs/tween.js/dist/tween.esm.js';

function locomotion(offset) {
    const newPos = new Vector3();
    newPos.copy(cameraGroup.position);
    newPos.add(offset);
    const dist = offset.length();

    blinkerSphere.visible = true;
    blinkerSphere.scale.set(2.5,2.5,2.5);
    new TWEEN.Tween(blinkerSphere.scale)
        .to({x:1,y:1,z:1}, 400)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    new TWEEN.Tween(cameraGroup.position)
        .delay(400)
        .to(newPos, dist*120)
        .chain(
            new TWEEN.Tween(blinkerSphere.scale)
                .to({x:2.5,y:2.5,z:2.5}, 100)
                .onComplete(() => blinkerSphere.visible = false)
        )
        .start();
}

// simple grid environment, locked tot he user's space, makes motion more comfortable
const gridTexture = new TextureLoader().load('./images/grid.png');
gridTexture.repeat.multiplyScalar(50);
gridTexture.wrapS = gridTexture.wrapT = RepeatWrapping;
const floor2 = new Mesh(
    new PlaneGeometry(50, 50, 50, 50),
    new MeshBasicMaterial({
        map: gridTexture,
        color: 0x555555,
        depthWrite: false,
        blending: AdditiveBlending
    })
);
floor2.rotation.x = -Math.PI / 2;
floor2.name = 'floor2';
cameraGroup.add(floor2);

const sky2geometry = new SphereGeometry(25, 50, 50, 0, 2 * Math.PI);
const sky2material = new MeshBasicMaterial({
    color: 0xaaaaaa,
    depthWrite: false
});
sky2material.side = BackSide;
const sky2sphere = new Mesh(sky2geometry, sky2material);
sky2sphere.name = 'sky2sphere';
cameraGroup.add(sky2sphere);

const blinkerSphereGeometry = new SphereBufferGeometry(0.3, 64, 8, 0, Math.PI*2, 0, Math.PI * 0.85);
blinkerSphereGeometry.translate(0,0.3,0);
const blinkerSphereMaterial = new MeshBasicMaterial({
    side: BackSide,
    colorWrite: false
});
const blinkerSphere = new Mesh( blinkerSphereGeometry, blinkerSphereMaterial );
blinkerSphere.rotation.set(Math.PI/2, 0, 0);
blinkerSphere.position.set(0, 0, -0.3);
blinkerSphere.visible = false;
camera.add(blinkerSphere);

blinkerSphereMaterial.renderOrder = -101;
floor2.renderOrder = -102;
sky2sphere.renderOrder = -103;

export {
    locomotion
}