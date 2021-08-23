import {transfer} from 'comlink'; 
import normalize from './normalize.js';

import {default as comlinkHandPose} from "comlink:./handpose.js";
const HandPose = comlinkHandPose.default;

function loadPose(name, url) {
	return HandPose.loadPose(name, url);
}

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

let __dumpHands = false;
function dumpHands() {
	__dumpHands = true;
}

function handDataToFile(inputSources, referenceSpace, frame) {

	const hands = {};
	for (const source of inputSources) {
		if (!source.hand) continue;
		hands[source.handedness] = source.hand;
	}
	if (hands.left && hands.right) {
		window.__dumpHands = false;

		const size = hands.left.size;
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

		frame.fillPoses( hands.left.values() , referenceSpace, leftHandAccessor );
		frame.fillPoses( hands.right.values() , referenceSpace, rightHandAccessor );

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

function update(inputSources, referenceSpace, frame, callback) {

	if (inputSources && frame) {
		const xrViewerPose = frame.getViewerPose(referenceSpace);

		if (__dumpHands) {
			handDataToFile(inputSources, referenceSpace, frame);
		}

		for (const source of inputSources) {			
			const hand = source.handedness;
			
			if (!source.hand) {
				continue;
			}

			if (!hands.has(hand)) {
				const handPosePromise = new HandPose();
				hands.set(hand, handPosePromise);
				handPosePromise.then(handPose => {
					const handInfo = new HandInfo({source, handPose});
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