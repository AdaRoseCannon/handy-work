import {
    scene, renderer, camera, rafCallbacks, cameraGroup
} from '../scene.js';

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
    Line
} from  'three';

import {
    gamepad
} from '../controllers/gamepad.js';

import {
    locomotion
} from './fade.js';

import {
    controller1,
    controller2
} from '../controllers/index.js'

// Utility Vectors
const g = new Vector3(0,-9.8,0);
const tempVec = new Vector3();
const tempVec1 = new Vector3();
const tempVecP = new Vector3();
const tempVecV = new Vector3();

// Guideline parabola function
function positionAtT(inVec,t,p,v,g) {
    inVec.copy(p);
    inVec.addScaledVector(v,t);
    inVec.addScaledVector(g,0.5*t**2);
    return inVec;
}

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
const guideLight = new PointLight(0xffeeaa, 0, 2);

// The target on the ground
const guideSpriteTexture = new TextureLoader().load('./assets/target.png');
const guideSprite = new Mesh(
    new PlaneGeometry(0.3, 0.3, 1, 1),
    new MeshBasicMaterial({
        map: guideSpriteTexture,
        blending: AdditiveBlending,
        color: 0x555555,
        transparent: true
    })
);
guideSprite.rotation.x = -Math.PI/2;

let guidingController = null;
function onSelectStart(e) {

    // This is e.data is an XRInputSource and if 
    // it has a hand and being handled by hand tracking so do nothing
    if (e && e.data && e.data.hand) {
        return;
    }

	const controller = this;

    console.log("startGuide", controller);

    guidingController = controller;
    guideLight.intensity = 1;
    controller.add(guideline);
    scene.add(guideSprite);
}

function onPointStart() {

	const controller = this;

    console.log("startGuide", controller);

    guidingController = controller;
    guideLight.intensity = 1;
    controller.add(guideline);
    scene.add(guideSprite);
}

function onSelectEnd() {
    if (guidingController === this) {
		console.log("onSelectEnd", this);

        // first work out vector from feet to cursor

        // feet position
        const feetPos = renderer.xr.getCamera(camera).getWorldPosition(tempVec);
        feetPos.y = 0;

        // cursor position
        const p = guidingController.getWorldPosition(tempVecP);
        const v = guidingController.getWorldDirection(tempVecV);
        v.multiplyScalar(6);
        const t = (-v.y  + Math.sqrt(v.y**2 - 2*p.y*g.y))/g.y;
        const cursorPos = positionAtT(tempVec1,t,p,v,g);

        // Offset
        const offset = cursorPos.addScaledVector(feetPos ,-1);

        // Do the locomotion
        locomotion(offset);

        // clean up
        guidingController = null;
        guideLight.intensity = 0;
        this.remove(guideline);
        scene.remove(guideSprite);
    }
}

function handleMove({detail}) {
    // Turn left
    if (detail.value > 0) {
        cameraGroup.rotation.y -= Math.PI/4;
    }
    // Turn right
    if (detail.value < 0) {
        cameraGroup.rotation.y += Math.PI/4;
    }
}

function handleUp({detail}) {
    if (detail.value < 0) {
        onSelectStart.bind(detail.controller)();
    }
}
function handleUpEnd({detail}) {
    onSelectEnd.bind(detail.controller)();
}

gamepad.addEventListener('axes0MoveMiddle', handleMove, true);
gamepad.addEventListener('axes2MoveMiddle', handleMove, true);

gamepad.addEventListener('axes1MoveMiddle', handleUp, true);
gamepad.addEventListener('axes3MoveMiddle', handleUp, true);
gamepad.addEventListener('axes1MoveEnd', handleUpEnd, true);
gamepad.addEventListener('axes3MoveEnd', handleUpEnd, true);

controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
controller2.addEventListener('selectstart', onSelectStart);
controller2.addEventListener('selectend', onSelectEnd);

rafCallbacks.add(() => {
    if (guidingController) {
        // Controller start position
        const p = guidingController.getWorldPosition(tempVecP);

        // Set Vector V to the direction of the controller, at 1m/s
        const v = guidingController.getWorldDirection(tempVecV);

        // Scale the initial velocity to 6m/s
        v.multiplyScalar(6);

        // Time for tele ball to hit ground
        const t = (-v.y  + Math.sqrt(v.y**2 - 2*p.y*g.y))/g.y;

        const vertex = tempVec.set(0,0,0);
        for (let i=1; i<=lineSegments; i++) {

            // set vertex to current position of the virtual ball at time t
            positionAtT(vertex,i*t/lineSegments,p,v,g);
            guidingController.worldToLocal(vertex);
            vertex.toArray(lineGeometryVertices,i*3);
        }
        guideline.geometry.attributes.position.needsUpdate = true;
        
        // Place the light and sprite near the end of the line
        positionAtT(guideLight.position,t*0.98,p,v,g);
        positionAtT(guideSprite.position,t*0.98,p,v,g);
    }
});