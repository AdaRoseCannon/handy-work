import {
    scene, renderer, rafCallbacks, cameraGroup, camera, envMap
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
    SphereGeometry,
    CanvasTexture
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
const model1 = controllerModelFactory.createControllerModel( controllerGrip1 );
controllerGrip1.add( model1 );
cameraGroup.add( controllerGrip1 );
model1.setEnvironmentMap(envMap);

const controllerGrip2 = renderer.xr.getControllerGrip( 1 );
const model2 = controllerModelFactory.createControllerModel( controllerGrip2 );
controllerGrip2.add( model2 );
cameraGroup.add( controllerGrip2 );
model2.setEnvironmentMap(envMap);

const canvas = document.createElement('canvas');
const canvasTexture = new CanvasTexture(canvas);
canvas.width = 1024;
canvas.height = 128;
const ctx = canvas.getContext('2d');
function writeText(text) {
    if (typeof text !== 'string') text = JSON.stringify(text,null,2);
    ctx.font = "120px Comic Sans MS";
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = 'black';
    text.split('\n').forEach((str, i) => ctx.fillText(str, 0, (i+1)*120));
    canvasTexture.needsUpdate = true;
}
writeText('hello\nworld');
const geometry = new PlaneGeometry( 0.3, 0.0375 );
const material = new MeshBasicMaterial( {map: canvasTexture, color: 0xffeeff} );
const consolePlane = new Mesh( geometry, material );
consolePlane.position.set(0, 0.01875, -0.1);
consolePlane.rotation.set(-Math.PI/4,0,0);
controller1.add( consolePlane );

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
        const offset = cursorPos;
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

const prevGamePads = new Map();
const gamepad = new EventTarget();
rafCallbacks.add(() => {
    const session = renderer.xr.getSession();
    let i = 0;
    if (session) for (const source of session.inputSources) {
        const controller = renderer.xr.getController(i++);
        const old = prevGamePads.get(source);
        const data = {
            buttons: source.gamepad.buttons.map(b => b.value),
            axes: source.gamepad.axes.slice(0)
        };
        if (old) {
            data.buttons.forEach((value,i)=>{
                if (value !== old.buttons[i]) {
                    if (value === 1) {
                        const event = new CustomEvent(`button${i}Down`, {detail: {value, source, controller,data}});
                        writeText(event.type);
                        gamepad.dispatchEvent(event);
                    } else {
                        const event = new CustomEvent(`button${i}Up`, {detail: {value, source, controller,data}});
                        gamepad.dispatchEvent(event);
                        writeText(event.type);
                    }
                }
            });
            data.axes.forEach((value,i)=>{
                if (value !== old.axes[i]) {
                    const event = new CustomEvent(`axes${i}Move`, {detail: {value, source, controller,data}});
                    gamepad.dispatchEvent(event);
                    if (old.axes[i] === 0) {
                        const event = new CustomEvent(`axes${i}MoveStart`, {detail: {value, source, controller,data}});
                        writeText(event.type);
                        gamepad.dispatchEvent(event);
                    }
                    if (Math.abs(old.axes[i]) < 0.5 && Math.abs(value) > 0.5) {
                        const event = new CustomEvent(`axes${i}MoveMiddle`, {detail: {value, source, controller,data}});
                        writeText(event.type);
                        gamepad.dispatchEvent(event);
                    }
                    if (value === 0) {
                        const event = new CustomEvent(`axes${i}MoveEnd`, {detail: {value, source, controller,data}});
                        writeText(event.type);
                        gamepad.dispatchEvent(event);
                    }
                }
            });
        }
        prevGamePads.set(source, data);
    }
});

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
gamepad.addEventListener('axes0MoveMiddle', handleMove, true);
gamepad.addEventListener('axes2MoveMiddle', handleMove, true);

function handleUp({detail}) {
    if (detail.value < 0) {
        onSelectStart.bind(detail.controller)();
    }
}
function handleUpEnd({detail}) {
    onSelectEnd.bind(detail.controller)();
}
gamepad.addEventListener('axes1MoveMiddle', handleUp, true);
gamepad.addEventListener('axes3MoveMiddle', handleUp, true);
gamepad.addEventListener('axes1MoveEnd', handleUpEnd, true);
gamepad.addEventListener('axes3MoveEnd', handleUpEnd, true);


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
    controllerGrip2,
    gamepad
}