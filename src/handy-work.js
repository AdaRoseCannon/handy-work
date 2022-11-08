/**
 * Documentation for using build/esm/handy-work.js or build/esm/handy-work.standalone.js
 * @module handy-work
 */

import {transfer} from 'comlink'; 
import normalize from './normalize.js';

import {default as comlinkHandPose} from "comlink:./handpose.js";
const HandPose = comlinkHandPose.default;

/**
 * Loads a pose from the Web the recommended way of using this API
 * @param {string} name Name of the pose
 * @param {string} url URL of the pose to download and add to the registry
 * @returns {Promise<void>} Resolves once it has been completed
 */
export function loadPose(name, url) {
	return HandPose.loadPose(name, url);
}

/**
 * Get a pose from the registry
 * @param {string} name of the pose to fetch
 * @returns {Promise<Float32Array>} A copy of the pose from the registry in the worker
 */
export function getPose(name) {
	return HandPose.getPose(name);
}

/**
 * Get a pose from the registry
 * @param {string} name of the pose to set
 * @param {Float32Array} pose Array buffer with the information about the current pose
 * @returns {Promise<void>} Resolves once the pose has been uploaded to the worker
 */
export function setPose(name, pose) {
	return HandPose.setPose(name, pose);
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

/**
 * Reset the current tracking performed automatically when the device returns from sleep
 */
export function resetHands() {
	hands.clear();
}

let __dumphands = false;

/**
 * On the next frame save the current hand pose to a file
 */
export function dumpHands() {
	__dumphands = true;	
}

/**
 * Get a pose from the current hand position
 * @param {XRInputSource} inputSources Array of inputs you want to generate inputs for, requires a left AND right hand
 * @param {XRReferenceSpace} referenceSpace Current reference space
 * @param {XRFrame} frame Current active frame
 * @returns {void|Float32Array} The generated pose buffer for the pose.
 */
export function generatePose(inputSources, referenceSpace, frame, float32Array) {
	const tempHands = {};

	for (const source of inputSources) {
		if (!source.hand) continue;
		tempHands[source.handedness] = source.hand;
	}
	if (tempHands.left && tempHands.right) {

		const size = tempHands.left.size;
		const bufferSize = 
			1 +         // store size
			size * 16 + // left hand
			size * 16 + // right hand
			size +      // weighting for individual joints left hand
			size        // weighting for individual joints right hand

		if (float32Array !== undefined && float32Array.byteLength < bufferSize * 4) {
			throw Error(`Provided buffer too small it needs to be a float32 and the size needs to be ${bufferSize} (${bufferSize * 4} bytes)`)
		}
		const outData = float32Array || new Float32Array(bufferSize);

		outData[0] = size;
		const leftHandAccessor = new Float32Array(outData.buffer, 4, size * 16);
		const rightHandAccessor = new Float32Array(outData.buffer, 4 + (size * 16 * 4), size * 16);
		const weights = new Float32Array(outData.buffer, 4 + 2 * (size * 16 * 4), size * 2);
		weights.fill(1);

		frame.fillPoses( tempHands.left.values() , referenceSpace, leftHandAccessor );
		frame.fillPoses( tempHands.right.values() , referenceSpace, rightHandAccessor );

		normalize(leftHandAccessor);
		normalize(rightHandAccessor);

		return outData;
	}
}

function bufferToFile(outData) {

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

/**
 * 
 * @param {Array<XRInputSource>} inputSources The inputs you want to do pose tracking for
 * @param {XRReferenceSpace} referenceSpace The reference space for your scene
 * @param {XRFrame} frame The current active frame
 * @param {function} callback This gets called with an Array of Arrays with the poses and their distances
 */
export function update(inputSources, referenceSpace, frame, callback) {

	if (inputSources && frame) {

		if (frame.session !== session) {
			init(frame.session);
		}

		if (__dumphands) {
			const pose = generatePose(inputSources, referenceSpace, frame);
			if (pose) {
				__dumphands = false;
				bufferToFile(pose);
			}
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
