import {
    renderer, rafCallbacks
} from '../scene.js';

import {
    update
} from './hand-poses/index.js'

const prevGamePads = new Map();
const gamepad = new EventTarget();

function dispatchEvent(type, detail) {
    const specificEvent = new CustomEvent(type, {detail});

    const generalDetail = {type};
    Object.assign(generalDetail, detail);
    const generalEvent = new CustomEvent('gamepadInteraction', {detail: generalDetail});

    gamepad.dispatchEvent(specificEvent);
    gamepad.dispatchEvent(generalEvent);
}

rafCallbacks.add((timestamp, frame) => {
    
    const session = renderer.xr.getSession();
    update(renderer.xr.getReferenceSpace(), frame);
    let i = 0;
    if (session) for (const source of session.inputSources) {
        if (!source.gamepad) continue;
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
                        dispatchEvent(`button${i}Down`, {value, source, controller,data});
                    } else {
                        dispatchEvent(`button${i}Up`, {value, source, controller,data});
                    }
                }
            });
            data.axes.forEach((value,i)=>{
                if (value !== old.axes[i]) {
                    dispatchEvent(`axes${i}Move`, {value, source, controller,data});
                    if (old.axes[i] === 0) {
                        dispatchEvent(`axes${i}MoveStart`, {value, source, controller,data});
                    }
                    if (Math.abs(old.axes[i]) < 0.5 && Math.abs(value) > 0.5) {
                        dispatchEvent(`axes${i}MoveMiddle`, {value, source, controller,data});
                    }
                    if (value === 0) {
                        dispatchEvent(`axes${i}MoveEnd`, {value, source, controller,data});
                    }
                }
            });
        }
        prevGamePads.set(source, data);
    }
});

export {
    gamepad
}