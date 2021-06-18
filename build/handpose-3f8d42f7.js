import { n as normalize, t as transfer, e as expose } from './shared-d00c46b0.js';
import './three-b47b1406.js';

// this runs as a web worker

console.log('Worker started');

const poses = new Map();

class HandPose {
	#matches
	constructor () {
		this.#matches = [];
	}
	static async loadPose(name, path) {
		const url = new URL(path, import.meta.url);
		const buffer = await fetch(url).then(response => response.arrayBuffer());
		const pose = new Float32Array(buffer);
		poses.set(name, pose);
	}
	update (headPose, handPose, handedness) {

		normalize(handPose);

		const distances = [];
		for (const [name, poseData] of poses) {
			const isRight = Number(handedness === "right");
			const poseHandDataSize = poseData[0];
			const poseHandData = new Float32Array(poseData.buffer, (
				1 + // poseHandDataSize offset
				(poseHandDataSize * 16) * isRight // offset for right hand
			)*4 , poseHandDataSize * 16);
			new Float32Array(poseData.buffer, (
				1 + // poseHandDataSize offset
				(poseHandDataSize * 16) * 2 + // offset for after hand data
				(poseHandDataSize * isRight)      // offset for right hand
			)*4 , poseHandDataSize);

			const range = Math.min(poseHandDataSize, handPose.length/16);
			let dist = 0;
			for (let i=0; i<range; i++) {
				const o = i*16;
				dist += Math.pow(
					(poseHandData[o + 12] - handPose[o + 12]) ** 2 +
					(poseHandData[o + 13] - handPose[o + 13]) ** 2 +
					(poseHandData[o + 14] - handPose[o + 14]) ** 2
				, 0.5);
			}

			distances.push([name, dist]);
		}

		return transfer({
			usedHandArrayBuffer: handPose,
			distances: distances.sort((a,b)=>a[1]-b[1])
		}, [handPose.buffer]);
	}
	getMatchedPoses () {
		return this.#matches;
	}
}

var m = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': HandPose
});

expose(m);
//# sourceMappingURL=handpose-3f8d42f7.js.map
