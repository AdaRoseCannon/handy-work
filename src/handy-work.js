import {transfer} from 'comlink'; 
import normalize from './normalize.js';

import {default as comlinkHandPose} from "comlink:./handpose.js";
const HandPose = comlinkHandPose.default;

function loadPose(name, url) {
	return HandPose.loadPose(name, url);
}

// Add event listeners
let listenersLoaded = false;
window.addEventListener('enter-vr', resetHands);
window.addEventListener('exit-vr', resetHands);

const handPoses = new EventTarget();

class HandInfo {
	#ready

	constructor({
		source, handPose
	}) {
		this.handPose = handPose;
		this.size = source.hand.size;
		this.jointKeys = Array.from(source.hand.keys());
		this.hand = source.hand;
		this.jointMatrixArray = new Float32Array(source.hand.size * 16);
		this.handedness = source.handedness;

		if (!listenersLoaded) {
			listenersLoaded = true;
		}
		this.#ready = true;
	}

	async update(xrViewerPose, referenceSpace, frame) {
		if (!this.#ready) {
			// console.warn('Pose detection taking too long');
			return [];
		}

		// transfer the pose array buffer to the thread, we now cannot do anything until it returns so mark it as not ready
		this.#ready = false;
		frame.fillPoses( this.hand.values() , referenceSpace, this.jointMatrixArray );
		const returnData = await this.handPose.update(
			xrViewerPose.transform.matrix,
			transfer(this.jointMatrixArray, [this.jointMatrixArray.buffer]),
			this.handedness
		);
		this.jointMatrixArray = returnData.usedHandArrayBuffer;
		this.#ready = true;
		return returnData.distances;
	}
}
const hands = new Map();

function resetHands() {
	hands.clear();
}

window.__dumpHands = false;
function dumpHands() {
	window.__dumpHands = true;	
}

function handDataToFile(inputSources, referenceSpace, frame) {
	const tempHands = {};

	for (const source of inputSources) {
		if (!source.hand) continue;
		tempHands[source.handedness] = source.hand;
	}
	if (tempHands.left && tempHands.right) {
		window.__dumpHands = false;

		const size = tempHands.left.size;
		const outData = new Float32Array(
			1 +         // store size
			size * 16 + // left hand
			size * 16 + // right hand
			size +      // weighting for individual joints left hand
			size        // weighting for individual joints right hand
		);

		outData[0] = size;
		const leftHandAccessor = new Float32Array(outData.buffer, 4, size * 16);
		const rightHandAccessor = new Float32Array(outData.buffer, 4 + (size * 16 * 4), size * 16);
		const weights = new Float32Array(outData.buffer, 4 + 2 * (size * 16 * 4), size * 2);
		weights.fill(1);

		frame.fillPoses( tempHands.left.values() , referenceSpace, leftHandAccessor );
		frame.fillPoses( tempHands.right.values() , referenceSpace, rightHandAccessor );

		normalize(leftHandAccessor);
		normalize(rightHandAccessor);

		console.log(outData);

		const a = window.document.createElement('a');

		a.href = window.URL.createObjectURL(
			new Blob(
				[new Uint8Array(outData.buffer)],
				{ type: 'application/octet-stream' }
			)
		);
		a.download = 'untitled.handpose';
		
		// Append anchor to body.
		document.body.appendChild(a);
		a.click();
		
		// Remove anchor from body
		document.body.removeChild(a);
	}
}


// what to do once a pose is found
function done(distances, handInfo, callback) {

	const detail = {
		handedness: handInfo.handedness,
		distances
	};

	const handPoseEvent = new CustomEvent('pose', {
		detail
	});
	
	handPoses.dispatchEvent(handPoseEvent);
	if (callback) {
		callback(detail);
	}
}


let session;
function init(session) {
	session.addEventListener('reset', resetHands);
	session.addEventListener('end', resetHands);
	session.addEventListener('visibilitychange', resetHands);
	session.addEventListener('inputsourceschange', resetHands);
}

function update(inputSources, referenceSpace, frame, callback) {

	if (inputSources && frame) {

		if (frame.session !== session) {
			init(frame.session);
		}

		if (window.__dumpHands) {
			handDataToFile(inputSources, referenceSpace, frame);
		}

		const xrViewerPose = frame.getViewerPose(referenceSpace);
		for (const source of inputSources) {			
			const hand = source.handedness;
			
			if (!source.hand) {
				continue;
			}

			if (!hands.has(hand)) {
				const handPosePromise = new HandPose();
				hands.set(hand, handPosePromise);
				handPosePromise.then(handPose => {
					const session = frame.session;
					const handInfo = new HandInfo({session, source, handPose});
					hands.set(hand, handInfo);
				});
			} else {
				const handInfo = hands.get(hand);
				if (handInfo instanceof Promise) continue;

				handInfo.update(xrViewerPose, referenceSpace, frame)
				.then(distances => {
					if (distances.length) {
						done(distances, handInfo, callback);
					}
				})
				.catch(function (err) {
					console.log(err);
				});
			}
		}
	}
}

export {
	update,
	resetHands,
	dumpHands,
	handPoses,
	loadPose,
	normalize,
	handDataToFile
};
