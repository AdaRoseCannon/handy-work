// this runs as a web worker
import {transfer} from 'comlink';
import normalize from './normalize.js';
import { Matrix4, Quaternion } from 'three';

console.log('Worker started');

const poses = new Map();
const tempMat1 = new Matrix4();
const tempMat2 = new Matrix4();
const tempQuat1 = new Quaternion();
const tempQuat2 = new Quaternion();
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
	static setPose(name, pose) {
		poses.set(name, pose);
	}
	static getPose(name) {
		// This is a copy not a transfer
		return poses.get(name);
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
			const poseWeightData = new Float32Array(poseData.buffer, (
				1 + // poseHandDataSize offset
				(poseHandDataSize * 16) * 2 + // offset for after hand data
				(poseHandDataSize * isRight)      // offset for right hand
			)*4 , poseHandDataSize);

			const jointCount = Math.min(poseHandDataSize, handPose.length/16);
			let dist = 0;
			let totalWeight = 0.0001;
			for (let i=0; i<jointCount; i++) {
				const poseWeight = poseWeightData[i];
				totalWeight += poseWeight;
				if (i === 0) continue;

				// Algo based on join rotation apply quaternion to a vector and
				// compare positions of vectors should work a bit better
				const o = i*16;
				tempMat1.fromArray(poseHandData, o);
				tempMat2.fromArray(handPose, o);
				tempQuat1.setFromRotationMatrix(tempMat1);
				tempQuat2.setFromRotationMatrix(tempMat2);
				dist += tempQuat1.angleTo(tempQuat2) * poseWeight;
			}
			dist = dist / totalWeight;
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

export default HandPose;
