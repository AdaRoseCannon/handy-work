/* global AFRAME, THREE */

const __version__ = __version__;
const DEFAULT_HAND_PROFILE_PATH = "https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/";
const LIB_URL = "https://cdn.jsdelivr.net/npm/handy-work" + (__version__ ? '@' + __version__ : '');
const LIB = LIB_URL + "/build/esm/handy-work.standalone.js";
const POSE_FOLDER = LIB_URL + "/poses/";
const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
const invlerp = (x, y, a) => clamp((a - x) / (y - x));
const joints = [
  "wrist",
  "thumb-metacarpal",
  "thumb-phalanx-proximal",
  "thumb-phalanx-distal",
  "thumb-tip",
  "index-finger-metacarpal",
  "index-finger-phalanx-proximal",
  "index-finger-phalanx-intermediate",
  "index-finger-phalanx-distal",
  "index-finger-tip",
  "middle-finger-metacarpal",
  "middle-finger-phalanx-proximal",
  "middle-finger-phalanx-intermediate",
  "middle-finger-phalanx-distal",
  "middle-finger-tip",
  "ring-finger-metacarpal",
  "ring-finger-phalanx-proximal",
  "ring-finger-phalanx-intermediate",
  "ring-finger-phalanx-distal",
  "ring-finger-tip",
  "pinky-finger-metacarpal",
  "pinky-finger-phalanx-proximal",
  "pinky-finger-phalanx-intermediate",
  "pinky-finger-phalanx-distal",
  "pinky-finger-tip",
];

AFRAME.registerComponent("handy-controls", {
  schema: {
    left: {
      description: 'URL for left controller',
      type: 'model',
      default: DEFAULT_HAND_PROFILE_PATH + "left.glb",
    },
    right: {
      description: 'URL for right controller',
      type: 'model',
      default: DEFAULT_HAND_PROFILE_PATH + "right.glb",
    },
    materialOverride: {
      description: 'Which hand to use the `material` component for',
      oneOf: ['both', 'left', 'right', 'none'],
      default: 'both'
    },
    fuseVShort: {
      description: 'Time for a pose to trigger a pose event (ms)',
      default:48
    },
    fuseShort: {
      description: 'Time for a pose to trigger a pose_fuseShort event (ms)',
      default:480
    },
    fuseLong: {
      description: 'Time for a pose to trigger a pose_fuseLong event (ms)',
      default:1440
    }
  },
  init() {
    this.handyWorkCallback = this.handyWorkCallback.bind(this);
    
    const webxrData = this.el.sceneEl.getAttribute('webxr');
    const optionalFeaturesArray = webxrData.optionalFeatures;
    if (!optionalFeaturesArray.includes('hand-tracking')) {
      optionalFeaturesArray.push('hand-tracking');
      this.el.sceneEl.setAttribute('webxr', webxrData);
    }
    
    const self = this;
    const dracoLoader = this.el.sceneEl.systems['gltf-model'].getDRACOLoader();
    const meshoptDecoder = this.el.sceneEl.systems['gltf-model'].getMeshoptDecoder();
    this.model = null;
    this.loader = new THREE.GLTFLoader();
    if (dracoLoader) {
      this.loader.setDRACOLoader(dracoLoader);
    }
    if (meshoptDecoder) {
      this.ready = meshoptDecoder.then(function (meshoptDecoder) {
        self.loader.setMeshoptDecoder(meshoptDecoder);
      });
    } else {
      this.ready = Promise.resolve();
    }
    
    import(LIB)
    .then(function ({
			update,
			loadPose,
			dumpHands,
      setPose,
      getPose
    }) {
      this.handyWorkUpdate = update;
      this.dumpHands = dumpHands;
      this.loadPose = loadPose;
      this.setPose = setPose;
      this.getPose = getPose;

      loadPose('relax', POSE_FOLDER + 'relax.handpose');
      loadPose('fist', POSE_FOLDER + 'fist.handpose');
      loadPose('flat', POSE_FOLDER + 'flat.handpose');
      loadPose('point', POSE_FOLDER + 'point.handpose');
      loadPose('horns', POSE_FOLDER + 'horns.handpose');
      loadPose('shaka', POSE_FOLDER + 'shaka.handpose');
      loadPose('vulcan', POSE_FOLDER + 'vulcan.handpose');
    }.bind(this));
    
    for (const handedness of ['left', 'right']) {
      const els = Array.from(this.el.querySelectorAll(`[data-${handedness}]`));
      for (const el of els) {
        el.object3D.visible = false;
      }
    }
    
    this.gripOffset = {
      right: new THREE.Vector3(-0.005, -0.03, 0),
      left: new THREE.Vector3(0.005, -0.03, 0)
    };
    this.gripQuaternions = {
      right: [new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0,0,-1),
        new THREE.Vector3(-1,0,0).normalize()
      ),new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0,1,0),
        new THREE.Vector3(-1,0,0)
      )],
      left: [new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0,0,1),
        new THREE.Vector3(1,0,0).normalize()
      ),new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(1,1,0),
        new THREE.Vector3(-1,0,-1)
      )]
    };

    this.tempVector3 = new THREE.Vector3();
    this.tempVector3_A = new THREE.Vector3();
    this.tempVector3_B = new THREE.Vector3();
    this.tempQuaternion_A = new THREE.Quaternion();
    this.tempQuaternion_B = new THREE.Quaternion();

  },

  async gltfToJoints(src, name) {
    const el = this.el;
    await this.ready;

    const gltf = await new Promise(function (resolve, reject) {
      this.loader.load(src, resolve, undefined, reject);
    }.bind(this));

    const object = gltf.scene.children[0];
    const mesh = object.getObjectByProperty("type", "SkinnedMesh");
    
    if (this.el.components.material) {
      if (this.data.materialOverride === 'both' || this.data.materialOverride === name) {
        mesh.material = this.el.components.material.material;
      }
    }
    
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.skeleton.pose();
    
    const bones = [];
    for (const jointName of joints) {
      const bone = object.getObjectByName(jointName);
      if (bone !== undefined) {
        bone.jointName = jointName;
        bones.push(bone);
        bone.applyMatrix4(this.el.object3D.matrixWorld);
        bone.updateMatrixWorld();
      } else {
        console.warn(`Couldn't find ${jointName} in ${src} hand mesh`);
        bones.push(undefined); // add an empty slot
      }
    }
    el.setObject3D('hand-mesh-' + name, mesh);
    el.emit("model-loaded", { format: "gltf", model: mesh });
    return bones;
  },

  async update() {
    const el = this.el;
    const srcLeft = this.data.left;
    const srcRight = this.data.right;

    this.remove();
    try {
      this.bonesRight = await this.gltfToJoints(srcRight, "right");
      this.bonesLeft = await this.gltfToJoints(srcLeft, "left");
    } catch (error) {
      const message = error && error.message ? error.message : "Failed to load glTF model";
      console.warn(message);
      el.emit("hand-model-error", { message });
    }
  },
  tick() {
    const session = this.el.sceneEl.xrSession;
    if (!session) return;
    const referenceSpace = this.el.sceneEl.renderer.xr.getReferenceSpace();
    const toUpdate = [];
    const frame = this.el.sceneEl.frame;
    
    inputSourceLoop:
    for (const inputSource of session.inputSources) {
      
      const magnetEl = this.el.querySelector(`[data-magnet][data-${inputSource.handedness}]`);
      let magnetTarget = null;
      let fadeT = 1;
      
      const currentMesh = this.el.getObject3D("hand-mesh-" + inputSource.handedness);
      if (!currentMesh) return;
      
      const allEls = Array.from(this.el.querySelectorAll(`[data-${inputSource.handedness}]`));

      const elMap = new Map();
      for (const el of allEls) {
        const poseName = el.dataset[inputSource.handedness];
        const elArray = elMap.get(poseName) || [];
        elArray.push(el);
        elMap.set(poseName, elArray);
      }

      if (!inputSource.hand) {
        for (const el of allEls) {
          el.object3D.visible = false;
        }
        currentMesh.visible = false;
        continue;
      }
      toUpdate.push(inputSource);

      const bones =
        (inputSource.handedness === "right" && this.bonesRight) ||
        (inputSource.handedness === "left" && this.bonesLeft);
      if (!bones) continue;
      for (const bone of bones) {
        const joint = inputSource.hand.get(bone.jointName);
        if (joint) {
          const pose = frame.getJointPose(joint, referenceSpace);
          if (pose) {
            currentMesh.visible = true;
            if (elMap.has(bone.jointName)) {
              for (const el of elMap.get(bone.jointName)) {
                el.object3D.position.copy(pose.transform.position);
                el.object3D.quaternion.copy(pose.transform.orientation);
                el.object3D.visible = (el.getDOMAttribute('visible') !== false);
              }
            }
            
            if (bone.jointName === "middle-finger-metacarpal") {
              if (elMap.has('grip')) {
                for (const el of elMap.get('grip')) {
                  el.object3D.quaternion.copy(pose.transform.orientation);
                  this.gripQuaternions[inputSource.handedness].forEach(q => el.object3D.quaternion.multiply(q));
                  el.object3D.position.copy(this.gripOffset[inputSource.handedness]);
                  el.object3D.position.applyQuaternion(el.object3D.quaternion);
                  el.object3D.position.add(pose.transform.position);
                  el.object3D.visible = (el.getDOMAttribute('visible') !== false);
                }
              }
            }
            
            bone.position.copy(pose.transform.position);
            bone.quaternion.copy(pose.transform.orientation);
          } else {
            // Failed to get hand pose so continue looping over other inputSource
            continue inputSourceLoop;
          }
        }
      }
      if (elMap.has('ray') && inputSource.targetRaySpace) {
        const pose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
        if (pose) {
          for (const el of elMap.get('ray')) {
            el.object3D.position.copy(pose.transform.position);
            el.object3D.quaternion.copy(pose.transform.orientation);
            el.object3D.visible = (el.getDOMAttribute('visible') !== false);
          }
        }
      }
      
      if (magnetEl) {
        magnetEl.object3D.updateWorldMatrix(true, false);
        const magnetTargets = Array.from(document.querySelectorAll(magnetEl.dataset.magnet));
        for (const el of magnetTargets) {
          const [magnetRange,fadeEnd] = (el.dataset.magnetRange || "0.2,0.1").split(',').map(n => Number(n));
          el.object3D.getWorldPosition(this.tempVector3);
          magnetEl.object3D.worldToLocal(this.tempVector3);
          
          const d = this.tempVector3.length();
          if (d < magnetRange) {
            magnetTarget = el;
            
            if (fadeEnd) {
              fadeT = invlerp(magnetRange,fadeEnd,d);
            } else {
              fadeT = 1;
            }
            
            break;
          }
        }
      }
      
      if (magnetTarget) {
        
        magnetTarget.object3D.getWorldPosition(this.tempVector3_A);
        magnetEl.object3D.getWorldPosition(this.tempVector3_B);
        this.tempVector3_A.lerp(this.tempVector3_B, 1-fadeT).sub(this.tempVector3_B);
        
        magnetTarget.object3D.getWorldQuaternion(this.tempQuaternion_A);
        magnetEl.object3D.getWorldQuaternion(this.tempQuaternion_B);
        this.tempQuaternion_A.slerp(this.tempQuaternion_B, 1-fadeT).multiply(this.tempQuaternion_B.invert());
        
        for (const bone of bones) {
          bone.position.sub(magnetEl.object3D.position);
          bone.position.applyQuaternion(this.tempQuaternion_A);
          bone.position.add(magnetEl.object3D.position);
          bone.applyQuaternion(this.tempQuaternion_A);
          bone.position.add(this.tempVector3_A);
          bone.applyMatrix4(this.el.object3D.matrixWorld);
          bone.updateMatrixWorld();
        }

        // Move elements to match the bones but skil elements which are marked data-no-magnet
        for (const el of allEls.filter(el => el.dataset.noMagnet === undefined)) {
          el.object3D.position.sub(magnetEl.object3D.position);
          el.object3D.position.applyQuaternion(this.tempQuaternion_A);
          el.object3D.position.add(magnetEl.object3D.position);
          el.object3D.applyQuaternion(this.tempQuaternion_A);
          el.object3D.position.add(this.tempVector3_A);
        }
      } else {
        for (const bone of bones) {
          bone.applyMatrix4(this.el.object3D.matrixWorld);
          bone.updateMatrixWorld();
        }
      }
    }

    // perform hand tracking
    if (toUpdate.length && this.handyWorkUpdate) {
      this.handyWorkUpdate(
        toUpdate,
        referenceSpace,
        frame,
        this.handyWorkCallback
      );
    }
  },
  handyWorkCallback: function ({
		distances, handedness
	}) {
		this.emit(distances[0][0], handedness, {
      pose: distances[0][0],
      poses: distances,
      handedness
    });
	},
  emit(name, handedness, details) {
    if (name === this[handedness + '_currentPose']) return;
    const els = Array.from(this.el.querySelectorAll(`[data-${handedness}]`));
    
    clearTimeout(this[handedness + '_vshortTimeout']);
    clearTimeout(this[handedness + '_shortTimeout']);
    clearTimeout(this[handedness + '_longTimeout']);
    
    this[handedness + '_currentPose'] = name;

    this[handedness + '_vshortTimeout'] = setTimeout(() => {
      this.el.emit('pose_' + name, details);
      this.el.emit('pose', details);

      for (const el of els) {
        el.emit('pose_' + name, details, false);
        el.emit('pose', details, false);
      }
    }, this.data.fuseVShort);
    
    this[handedness + '_shortTimeout'] = setTimeout(() => {
      // console.log('Emiting ', name + '_fuseShort');
      this.el.emit('pose_' + name + '_fuseShort', details);
      for (const el of els) el.emit('pose_' + name + '_fuseShort', details, false);
    }, this.data.fuseShort);
    
    this[handedness + '_longTimeout'] = setTimeout(() => {
      // console.log('Emiting ', name + '_fuseLong');
      this.el.emit('pose_' + name + '_fuseLong', details);    
      for (const el of els) el.emit('pose_' + name + '_fuseLong', details, false);
    }, this.data.fuseLong);
  },
  remove() {
    if (this.bonesLeft) {
      this.bonesLeft = null;
      this.el.removeObject3D("hand-mesh-left");
    }
    if (this.bonesRight) {
      this.bonesRight = null;
      this.el.removeObject3D("hand-mesh-right")
    }
  },
});
