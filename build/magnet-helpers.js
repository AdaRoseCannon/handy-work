(function () {
	'use strict';

	/* eslint-disable no-unused-labels */
	/* jshint esversion: 9 */
	/* global THREE, AFRAME */

	console.log(`### linear-constraint

linear-constraint is designed to place the element it's attached to 
place elements as close as possible to the target element whilst being restrained along a line
defined by the \`axis\`, between the \`min\` and \`max\` on either side of the original position
of the object when this component is first run.

This is useful for creating magnetic lines. Put linear-constraint on a magnetic element and set it's target
to the **non-magnet** version of the hand element with the data-magnet property. i.e. the same part but with \`data-no-magnet\`
`);

	const tempVec3A = new THREE.Vector3();
	const tempVec3B = new THREE.Vector3();
	const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
	AFRAME.registerComponent('linear-constraint', {
		schema: {
			axis: {
				type: 'vec3',
				description: `Axis upon which the element is constrained, does not need to be normalized.`,
				default: { x: 0, y: 0, z: -1 }
			},
			max: {
				description: `How far can it travel along the axis`,
				default: Infinity
			},
			min: {
				description: `How far can it travel opposite to the axis`,
				default: -Infinity
			},
			radius: {
				description: 'Outside this distance it will not work',
				default: Infinity
			},
			useFixedValueIfOutOfRange: {
				description: 'Should the object remain at a fixed position if out of the radius.',
				default: false
			},
			valueIfOutOfRange: {
				description: 'Value the object should be set to if out of the radius',
				default: 0
			},
			step: {
				description: "Steps it should take from the origin.",
				default: 0
			},
			target: {
				description: `Element it should try to follow`,
				type: 'selectorAll'
			},
			part: {
				description: `If applied to a 3D model this is the name of the part that should be used instead.`,
				default: ''
			},
			enabled: {
				description: `Whether it should currently run or not`,
				default: true
			},
			upEventName: {
				description: `Name of event to trigger when t is increasing`,
				default: ''
			},
			upEventThreshold: {
				description: `Threshold to trigger up event`,
				default: 0
			},
			downEventName: {
				description: `Name of event to trigger when t is decreasing`,
				default: ''
			},
			downEventThreshold: {
				description: `Threshold to trigger up event`,
				default: 0
			}
		},
		init() {
			this.n = new THREE.Vector3();
			this.el.addEventListener('object3dset', this.update.bind(this));
			this.oldT = null;
		},
		update() {
			// Ensure the axis is normalized
			this.n.copy(this.data.axis).normalize();
			if (this.data.part) this.part = this.el.object3D.getObjectByName(this.data.part);
		},
		tick() {
			if (!this.data.enabled || !this.data.target || this.data.target.length === 0 ) return;
			const object3D = this.data.part ? this.part : this.el.object3D;
			const step = this.data.step;
			if (!object3D) return;
			if (!this.originalOffset) this.originalOffset = new THREE.Vector3().copy(object3D.position);
			const n = this.n;
			const p0 = tempVec3A;

			// For the case of multiple targets pick the closest point.
			let closestD = Infinity;
			const testPoint = tempVec3B;
			for (const target of this.data.target) {
				target.object3D.getWorldPosition(testPoint);
				object3D.parent.worldToLocal(testPoint);
				testPoint.sub(this.originalOffset);
				const distance = testPoint.length();
				if (distance < closestD) {
					closestD = distance;
					p0.copy(testPoint);
				}
			}

			// We have a plane with normal n that contains p0
			// We want to place the object where a vector n from the origin intersects the plane
			// n.x x + n.y y + n.z z = p0.n
			// Sub in vector equation p=tn
			// t * n.x * n.x + t * n.y * n.y + t * n.z * n.z = p0.n
			// equivalent to  t * n.length() = p0.n
			let t = clamp(p0.dot(n) / n.length(), this.data.min, this.data.max);
			if (step) t = step*Math.round(t/step);
			const r = p0.addScaledVector(n ,-t).length();
			if (r > this.data.radius) {
				if (this.data.useFixedValueIfOutOfRange) {
					t = this.data.valueIfOutOfRange;
				} else {

					// Out of range so just stop.
					return;
				}
			}

			if (this.oldT !== null) {
				if (
					this.data.upEventName &&
					t >= this.data.upEventThreshold &&
					this.oldT < this.data.upEventThreshold
				) {
					this.el.emit(this.data.upEventName);
				}
				
				if (
					this.data.downEventName &&
					t <= this.data.downEventThreshold &&
					this.oldT > this.data.downEventThreshold
				) {
					this.el.emit(this.data.downEventName);
				}
			}
			
			object3D.position.copy(n).multiplyScalar(t).add(this.originalOffset);
			this.oldT = t;
		}
	});

	console.log(`### attach-to-model

Each frame attach-to-model will move an object to the same position as part of the 3D model of it's parent element.

This is useful for attaching magnetic elements to moving elements of a 3D model so it can be grabbed in different ways.
`);
	AFRAME.registerComponent("attach-to-model", {
		schema: {
			description: `Name of part to follow`,
			default: ''
		},
		init() {
			this.el.parentNode.addEventListener('object3dset', this.update.bind(this));
		},
		update() {
			if (this.data) this.part = this.el.parentNode.object3D.getObjectByName(this.data);
		},
		tick() {
			if (this.part) {
				const p = this.el.object3D.position;
				this.el.object3D.parent.worldToLocal(this.part.getWorldPosition(p));
			}
		}
	});


	console.log(`### grab-magnet-target

This should be added to the hand elements with the \`data-magnet\`.

When one of the \`startEvents\` events is fired it will start a grab action where it will
consider itself grabbing whatever magnetic item it is currently being attracted to and fires the "grabbed" event
on the object.

If the object has \`data-pick-up\` set then the object will be reparented to the hand element that fired
the grab event. The "pickup" event will be fired on the object.

If the object has \`data-pick-up="parent"\` set then the object's parent will be reparented to the hand element that fired
the grab event. The "pickup" event will be fired on the object's parent.

When either the release event is fired or the object stops being magnet target then it will consider itself released.
it will reparent objects back to where they were originally and fire the "putdown" event on what was held if it had been picked up.
If the held object has \`data-reset-transform\` set then it will also restore it's oriingal position. Otherwise the world position and rotation of the object will remain the same.

Finally the "released" event is fired on whatever was being held.
`);

	const tempQuaternion = new THREE.Quaternion();
	const tempVector3 = new THREE.Vector3();
	AFRAME.registerComponent("grab-magnet-target", {
		schema: {
			startEvents: {
				type: 'array',
				description: 'Event to start grabbing'
			},
			stopEvents: {
				type: 'array',
				description: 'Event to stop grabbing'
			},
			noMagnetEl: {
				type: 'selector',
				description: 'The version of the grip with no magnet providing it helps physics things.',
			}
		},
		init() {
			this.grabStart = this.grabStart.bind(this);
			this.grabEnd = this.grabEnd.bind(this);
			this.isGrabbing = false;
			this.oldParent = null;
			this.grabbedEl = null;
			this.targetEl = null;
			this.oldQuaternion = new THREE.Quaternion();
			this.oldPosition = new THREE.Quaternion();
		},
		update(oldData) {
			if (oldData.startEvents) {
				for (const eventName of oldData.startEvents) {
					this.el.removeEventListener(eventName, this.grabStart);
				}
			}
			if (oldData.stopEvents) {
				for (const eventName of oldData.stopEvents) {
					this.el.removeEventListener(eventName, this.grabEnd);
				}
			}
			for (const eventName of this.data.startEvents) {
				this.el.addEventListener(eventName, this.grabStart);
			}
			for (const eventName of this.data.stopEvents) {
				this.el.addEventListener(eventName, this.grabEnd);
			}
		},
		grabStart(e) {
			const targetId = this.el.dataset.magnetTarget;
			if (this.isGrabbing === false && targetId) {
				const magnetClasses = this.el.dataset.magnet.split(' ');
				const target = document.getElementById(targetId);
				const pickUp = target.dataset.pickUp;
				const el = pickUp === 'parent' ? target.parentNode : target;
				this.isGrabbing = true;
				this.grabbedEl = el;
				this.targetEl = target;
				this.removedClasses = [];
				if (pickUp !== undefined) {
					for (const classname of magnetClasses) {
						if (el.classList.contains(classname)) {
							el.classList.remove(classname);
							this.removedClasses.push(classname);
						}
					}
					const oldGrabber = el.dataset.oldGrabber;
					if (oldGrabber) document.getElementById(oldGrabber).components["grab-magnet-target"].grabEnd(e);
					el.dataset.oldGrabber = this.el.id;

					this.oldParent = el.parentNode;
					this.el.add(el);
					this.oldQuaternion.copy(el.object3D.quaternion);
					el.object3D.quaternion.identity();
					this.oldPosition.copy(el.object3D.position);
					el.object3D.position.set(0, 0, 0);
					if (pickUp === 'parent') {
						tempQuaternion.copy(target.object3D.quaternion).invert();
						tempVector3.copy(target.object3D.position).applyQuaternion(tempQuaternion);
						el.object3D.applyQuaternion(tempQuaternion);
						el.object3D.position.sub(tempVector3);
					}
					el.emit('pickup', Object.assign({ by: this.el, byNoMagnet: this.data.noMagnetEl }, e && e.detail));
				}
				el.emit('grabbed', Object.assign({ by: this.el, byNoMagnet: this.data.noMagnetEl }, e && e.detail));
			}
		},
		grabEnd(e) {
			if (this.isGrabbing) {
				const el = this.grabbedEl;
				if (this.oldParent) {
					for (const classname of this.removedClasses.splice(0)) {
						el.classList.add(classname);
					}
					delete el.dataset.oldGrabber;
					if (el.dataset.resetTransform !== undefined) {
						el.object3D.quaternion.copy(this.oldQuaternion);
						el.object3D.position.copy(this.oldPosition);
					} else {
						// Keep in place in the new parent
						this.oldParent.object3D.worldToLocal(el.object3D.getWorldPosition(el.object3D.position));

						this.oldParent.object3D.getWorldQuaternion(tempQuaternion).invert();
						el.object3D.getWorldQuaternion(el.object3D.quaternion).premultiply(tempQuaternion);
					}
					this.oldParent.add(el);
					this.oldParent = null;
					el.emit('putdown', Object.assign({ by: this.el, byNoMagnet: this.data.noMagnetEl }, e && e.detail));
				}
				this.isGrabbing = false;
				this.grabbedEl = null;
				this.targetEl = null;
				el.emit('released', Object.assign({ by: this.el, byNoMagnet: this.data.noMagnetEl }, e && e.detail));
			}
		},
		tick() {
			if (this.isGrabbing) {
				if (this.targetEl.dataset.pickUp === undefined && this.el.dataset.magnetTarget !== this.targetEl.id) {
					this.grabEnd();
				}
			}
		}
	});

})();
//# sourceMappingURL=magnet-helpers.js.map
