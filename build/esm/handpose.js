import { M as Matrix4, Q as Quaternion, V as Vector3, n as normalize, t as transfer, e as expose } from './shared.js';

// this runs as a web worker

console.log('Worker started');

const poses = new Map();
const tempMat1 = new Matrix4();
const tempMat2 = new Matrix4();
const tempQuat1 = new Quaternion();
const tempQuat2 = new Quaternion();
const tempVec1 = new Vector3();
const tempVec2 = new Vector3();


class HandPose {
	#matches
	constructor () {
		this.#matches = [];
	}
	static async loadPose(name, path) {
		const url = new URL(path);
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

			const jointCount = Math.min(poseHandDataSize, handPose.length/16);
			let dist = 0;
			for (let i=0; i<jointCount; i++) {

				// Algo based on join rotation apply quaternion to a vector and
				// compare positions of vectors should work a bit better
				const o = i*16;
				tempMat1.fromArray(poseHandData, o);
				tempMat2.fromArray(handPose, o);
				tempQuat1.setFromRotationMatrix(tempMat1);
				tempQuat2.setFromRotationMatrix(tempMat2);
				tempVec1.set(0,0,0.1).applyQuaternion(tempQuat1);
				tempVec2.set(0,0,0.1).applyQuaternion(tempQuat2);
				dist += tempVec1.distanceTo(tempVec2);

				// Alternative simpler & faster algo based on joint position
				// const o = i*16;
				// dist += Math.pow(
				// 	(poseHandData[o + 12] - handPose[o + 12]) ** 2 +
				// 	(poseHandData[o + 13] - handPose[o + 13]) ** 2 +
				// 	(poseHandData[o + 14] - handPose[o + 14]) ** 2
				// , 0.5);
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
//# sourceMappingURL=handpose.js.map
