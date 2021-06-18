import {Matrix4} from 'three';

/**
 * Modify an Array of Matrixes in place by premultiplying them by the inverse of the first item.
 * 
 * @param { Float32Array } handPose Array of 4x4 Matrixes in column order
 */
export default function normalize(handPose) {

    // handPose is the concatenated data of 4x4 Matrices
    const size = handPose.length/16;

    // The first item in hand pose information is the wrist
    const inverseWristMat = new Matrix4();
    inverseWristMat.fromArray(handPose, 0);
    inverseWristMat.invert();

    const tempMat = new Matrix4();
    for (let i=0; i<size; i++) {
        const offset = i*16;
        tempMat.fromArray(handPose, offset);
        tempMat.premultiply(inverseWristMat);
        tempMat.toArray(handPose, offset);
    }
}