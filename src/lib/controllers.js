import {
    scene, renderer, rafCallbacks, cameraGroup, camera
} from './scene.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'; 

import {
    Mesh,
    MeshBasicMaterial,
    Vector3,
    PointLight,
    PlaneGeometry,
    TextureLoader,
    BufferGeometry,
    BufferAttribute,
    LineBasicMaterial,
    AdditiveBlending,
    Line,
    RepeatWrapping,
    SphereBufferGeometry,
    BackSide,
    SphereGeometry
} from 'three';

import TWEEN from '@tweenjs/tween.js/dist/tween.esm.js';

function positionAtT(inVec,t,p,v,g) {
    inVec.copy(p);
    inVec.addScaledVector(v,t);
    inVec.addScaledVector(g,0.5*t**2);
    return inVec;
}

// Utility Vectors
const g = new Vector3(0,-9.8,0);
const tempVec0 = new Vector3();
const tempVec1 = new Vector3();
const tempVecP = new Vector3();
const tempVecV = new Vector3();

// The guideline
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

// The light at the end of the line
const guidelight = new PointLight(0xffeeaa, 0, 2);

// The target on the ground
const guidespriteTexture = new TextureLoader().load('./images/target.png');
const guidesprite = new Mesh(
    new PlaneGeometry(0.3, 0.3, 1, 1),
    new MeshBasicMaterial({
        map: guidespriteTexture,
        blending: AdditiveBlending,
        color: 0x555555
    })
);
guidesprite.rotation.x = -Math.PI/2;

const controller1 = renderer.xr.getController(0);
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
cameraGroup.add(controller1);
let guidingController = null;

const controller2 = renderer.xr.getController(1);
controller2.addEventListener('selectstart', onSelectStart);
controller2.addEventListener('selectend', onSelectEnd);
cameraGroup.add(controller2);

const controllerModelFactory = new XRControllerModelFactory();

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
cameraGroup.add( controllerGrip1 );

const controllerGrip2 = renderer.xr.getControllerGrip( 1 );
controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
cameraGroup.add( controllerGrip2 );

function onSelectStart() {
    guidingController = this;
    guidelight.intensity = 1;
    this.add(guideline);
    scene.add(guidesprite);
}

function onSelectEnd() {
    if (guidingController === this) {

        // teleport work out vector from feet to cursor

        // feet pos
        const feetPos = tempVec0;
        renderer.xr.getCamera(camera).getWorldPosition(feetPos);
        feetPos.y = 0;

        // cursor pos
        const cursorPos = tempVec1;
        const p = tempVecP;
        guidingController.getWorldPosition(p);
        const v = tempVecV;
        guidingController.getWorldDirection(v);
        v.multiplyScalar(6);
        const t = (-v.y  + Math.sqrt(v.y**2 - 2*p.y*g.y))/g.y;
        positionAtT(cursorPos,t,p,v,g);

        cursorPos.addScaledVector(feetPos ,-1);
        const newPos = new Vector3();
        newPos.copy(cameraGroup.position);
        newPos.add(cursorPos);

        blinkerSphere.visible = true;
        blinkerSphere.scale.set(2.5,2.5,2.5);
        new TWEEN.Tween(blinkerSphere.scale)
            .to({x:1,y:1,z:1}, 400)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
        new TWEEN.Tween(cameraGroup.position)
            .delay(400)
            .to(newPos, 600)
            .chain(
                new TWEEN.Tween(blinkerSphere.scale)
                    .to({x:2.5,y:2.5,z:2.5}, 100)
                    .onComplete(() => blinkerSphere.visible = false)
            )
            .start();

        // clean up
        guidingController = null;
        guidelight.intensity = 0;
        this.remove(guideline);
        scene.remove(guidesprite);
    }
}
rafCallbacks.add(() => {
    if (guidingController) {
        // Controller start position
        const p = tempVecP;
        guidingController.getWorldPosition(p);

        // virtual tele ball velocity
        const v = tempVecV;
        guidingController.getWorldDirection(v);
        v.multiplyScalar(6);

        // Time for tele ball to hit ground
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
        
        // Place the light near the end of the poing
        positionAtT(guidelight.position,t*0.98,p,v,g);
        positionAtT(guidesprite.position,t*0.98,p,v,g);
    }
});

rafCallbacks.add(() => {
    const session = renderer.xr.getSession();
    if (session) for (const source of session.inputSources) {
        // console.log(source.gamepad.axes);
    }
});



// simple grid environment makes motion more comfortable
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
floor2.receiveShadow = true;
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

floor2.renderOrder = -1;
sky2sphere.renderOrder = -2;

window.blinkerSphere = blinkerSphere;

export {
    controllerGrip1,
    controllerGrip2
}