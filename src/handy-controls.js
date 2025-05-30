/* global AFRAME, THREE */
import { XRControllerModelFactory } from './lib/XRControllerModelFactory.js';
const __version__ = __version__;
const DEFAULT_PROFILES_PATH = "https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles";
const DEFAULT_HAND_PROFILE_PATH = DEFAULT_PROFILES_PATH + "/generic-hand";
const LIB_URL = "https://cdn.jsdelivr.net/npm/handy-work" + (__version__ ? '@' + __version__ : '');
const LIB = LIB_URL + "/build/esm/handy-work.standalone.js";
const POSE_FOLDER = LIB_URL + "/poses/";
const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
const invlerp = (x, y, a) => clamp((a - x) / (y - x));
const prevGamePads = new Map();
const changedAxes = new Set();

const tempVector3_A = new THREE.Vector3();
const tempVector3_B = new THREE.Vector3();
const tempQuaternion_A = new THREE.Quaternion();
const tempQuaternion_B = new THREE.Quaternion();
const tempQuaternion_C = new THREE.Quaternion();
const handednesses = ['left', 'right', 'none'];

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
    renderGamepad: {
      oneOf: ['any', 'left', 'right', 'none', 'never'],
      default: 'any',
      description: `Whether to render a gamepad model when it's not doing hand tracking, right, none and left are the names of controller handedness, any is all of them, and never is to not draw gamepads`
    },
    left: {
      description: 'URL for left controller',
      type: 'model',
      default: DEFAULT_HAND_PROFILE_PATH + "/left.glb",
    },
    right: {
      description: 'URL for right controller',
      type: 'model',
      default: DEFAULT_HAND_PROFILE_PATH + "/right.glb",
    },
    materialOverride: {
      description: 'Which hand to use the `material` component for',
      oneOf: ['both', 'left', 'right', 'neither'],
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
    const sceneEl = this.el.sceneEl;
    const webxrData = this.el.sceneEl.getAttribute('webxr');
    const optionalFeaturesArray = webxrData.optionalFeatures;
    if (!optionalFeaturesArray.includes('hand-tracking')) {
      optionalFeaturesArray.push('hand-tracking');
      this.el.sceneEl.setAttribute('webxr', webxrData);
    }
    
    this.loader = new THREE.GLTFLoader();
    const self = this;
    const dracoLoader = this.el.sceneEl.systems['gltf-model'].getDRACOLoader();
    const meshoptDecoder = this.el.sceneEl.systems['gltf-model'].getMeshoptDecoder();
    this.controllerModelFactory = new XRControllerModelFactory(this.loader);
    this.controllerModelFactory.setPath(DEFAULT_PROFILES_PATH);
    this.model = null;
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
    
    for (const handedness of handednesses) {
      const els = Array.from(this.el.querySelectorAll(`[data-${handedness}]`));
      for (const el of els) {
        el.object3D.visible = false;
      }
    }

    sceneEl.addEventListener("enter-vr", () => {
      for (const name of ["select", "selectstart", "selectend", "squeeze", "squeezeend", "squeezestart"])
        sceneEl.xrSession.addEventListener(name, this.eventFactory(name, this));
    });

    this.elArrays = { left: [], right: [], none: [] };
    this.elMaps = { left: new Map(), right: new Map(), none: new Map() };
    this.magnetEls = new Map();
    this.magnetTargets = new Map();

    function reconstructElMaps() {
      for (const handedness of handednesses) {
        self.elArrays[handedness].splice(0);
        self.elMaps[handedness].clear();
        self.magnetEls.clear();
        self.magnetTargets.clear();
      }

      const els = Array.from(self.el.children).filter(el=>el.dataset.left||el.dataset.right||el.dataset.none);
      for (const el of els) {
        for (const handedness of handednesses) {
          if (el.dataset[handedness] !== undefined) {
            self.elArrays[handedness].push(el);
            const poseName = el.dataset[handedness];
            const poseElArray = self.elMaps[handedness].get(poseName) || [];
            poseElArray.push(el);
            self.elMaps[handedness].set(poseName, poseElArray);

            if (el.dataset.magnet) {
              self.magnetEls.set(handedness, el);
              self.magnetTargets.set(el, null);
            }
          }
        }
      }
    }
    reconstructElMaps();
    // if the children of this element change then rebuild the lists
    new MutationObserver(reconstructElMaps).observe(this.el, { childList: true });
    // If any of the hands change position rebuild it
    new MutationObserver(function (changes) {
      if (changes.find(change => (
        change.attributeName === 'data-none' ||
        change.attributeName === 'data-left' ||
        change.attributeName === 'data-right' ||
        change.attributeName === 'data-magnet'
      ))) reconstructElMaps();
    }).observe(this.el, { attributes: true, subtree: true });
  },

  getMagnetTargets(el) {
    const magnetTargets = this.magnetTargets.get(el);
    if (magnetTargets === null) {
      const magnetTargets = document.getElementsByClassName(el.dataset.magnet);
      this.magnetTargets.set(el, magnetTargets);
      return magnetTargets;
    }
    return magnetTargets;
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

  async update(oldData) {
    const el = this.el;
    const srcLeft = this.data.left;
    const srcRight = this.data.right;

    // Only reload models if they changed
    if (
      oldData.left !== this.data.left ||
      oldData.right !== this.data.right ||
      oldData.renderGamepad !== this.data.renderGamepad
    ) {
      this.remove();
    }
    if (oldData.left !== this.data.left || oldData.right !== this.data.right) {
      try {
        this.bonesRight = await this.gltfToJoints(srcRight, "right");
        this.bonesLeft = await this.gltfToJoints(srcLeft, "left");
      } catch (error) {
        const message = error && error.message ? error.message : "Failed to load glTF model";
        console.warn(message);
        el.emit("hand-model-error", { message });
      }
    }
  },

  eventFactory(eventName, bindTarget, event) {
    function eventHandler(e) {
      const session = this.el.sceneEl.xrSession;
      const frame = e.frame;
      const inputSource = e.inputSource;
      const referenceSpace = this.el.sceneEl.renderer.xr.getReferenceSpace();
      const pose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
      const handedness = e.inputSource.handedness;
      const details = {
        inputSource,
        handedness,
        frame
      }
      if (!pose) return;

      const allEls = this.elArrays[handedness];
      if (inputSource.targetRayMode === "screen") {
        const name = `screen-${
          Array.from(session.inputSources).filter(i=>i.targetRayMode === "screen").indexOf(inputSource)
        }`;
        for (const el of allEls) {
          if (el.dataset[handedness] === name) {
            el.object3D.position.copy(pose.transform.position);
            el.object3D.quaternion.copy(pose.transform.orientation);
            el.object3D.visible = (el.getDOMAttribute('visible') !== false);
            el.emit(eventName, details);
          }
        }
      } else if (inputSource.gamepad || inputSource.hand) {
        for (const el of allEls) el.emit(eventName, details);
      }
    }
    if (event) return eventHandler.call(bindTarget, event);
    return eventHandler.bind(bindTarget);
  },

  createControllerModel(index, inputSource) {
    const renderer = this.el.sceneEl.renderer;
    const controllerGrip = renderer.xr.getControllerGrip(index);
    const model = this.controllerModelFactory.createControllerModel(controllerGrip);

    // The controllerGrip may switch to a different inputSource if the
    // controllers disconnected and reconnected, so we need to track which
    // handedness the controllerGrip is currently controlling.
    controllerGrip.addEventListener('connected', (event) => {
      const xrInputSource = event.data;
      model.userData.handedness = xrInputSource.handedness;
    });
    controllerGrip.addEventListener('disconnected', () => {
      model.userData.handedness = 'unknown';
    });
    // This tells the controllerModel that a new inputSource was just added and a model should be generated
    controllerGrip.dispatchEvent({ type: 'connected', data: inputSource });
    this.el.setObject3D('controller-model-' + index, model);
    return model;
  },

  getControllerModel(inputSource) {
    const model0 = this.el.getObject3D('controller-model-0') || this.createControllerModel(0, inputSource);
    if (model0.userData.handedness === inputSource.handedness) {
      return model0;
    }

    const model1 = this.el.getObject3D('controller-model-1') || this.createControllerModel(1, inputSource);
    if (model1.userData.handedness === inputSource.handedness) {
      return model1;
    }

    return null;
  },

  tick() {
    const self = this;
    const session = this.el.sceneEl.xrSession;
    if (!session) return;
    const renderer = this.el.sceneEl.renderer;
    const referenceSpace = renderer.xr.getReferenceSpace();
    const toUpdate = [];
    const frame = this.el.sceneEl.frame;
    if (!frame) return;

    let transientSourceIndex = 0;
    inputSourceLoop:
    for (const inputSource of session.inputSources) {
      const magnetEl = this.magnetEls.get(inputSource.handedness);
      let magnetTarget = null;
      let fadeT = 1;
      let bones = [];
      const toMagnet = [];
      let handMesh;
      
      const allEls = this.elArrays[inputSource.handedness];
      const elMap = this.elMaps[inputSource.handedness];

      handMesh = this.el.getObject3D("hand-mesh-" + inputSource.handedness);
      if (inputSource.hand) {
        toUpdate.push(inputSource);
  
        bones =
          (inputSource.handedness === "right" && this.bonesRight) ||
          (inputSource.handedness === "left" && this.bonesLeft);
        if (!bones.length) continue;
        let hadAJointPose = false;
        for (const bone of bones) {
          const joint = inputSource.hand.get(bone.jointName);
          toMagnet.push(bone);
          if (joint) {

            const pose = frame.getJointPose(joint, referenceSpace);
            if (pose) {
              hadAJointPose = true;

              // if there are objects make them visible and set their position
              if (elMap.has(bone.jointName)) {

                if (handMesh.visible === false) {
                  for (const el of elMap.get(bone.jointName)) {
                    el.object3D.visible = (el.getDOMAttribute('visible') !== false);
                  }
                }

                for (const el of elMap.get(bone.jointName)) {
                  el.object3D.position.copy(pose.transform.position);
                  el.object3D.quaternion.copy(pose.transform.orientation);
                  if (el.dataset.noMagnet === undefined) toMagnet.push(el.object3D);
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
        if (hadAJointPose) {
          handMesh.visible = true;
        }
      } else if (handMesh)  {
        handMesh.visible = false;

        for (const el of allEls){
          el.object3D.visible = false;
        }
      }

      if (inputSource.targetRayMode === "screen") {
        const name = `screen-${transientSourceIndex++}`;
        if (elMap.has(name)) {
          const pose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
          if (!pose) continue inputSourceLoop;
          for (const el of elMap.get(name)) {
            el.object3D.position.copy(pose.transform.position);
            el.object3D.quaternion.copy(pose.transform.orientation);
            el.object3D.visible = (el.getDOMAttribute('visible') !== false);
          }
        }

        // Don't do the magnet behaviour and don't render any gamepads
        continue inputSourceLoop;
      }

      // handle any tracked elements attached to the ray space of the input source this works for any types
      for (const [name, inputSourcePose] of [
        ['ray', inputSource.targetRaySpace],
        ['grip', inputSource.gripSpace]
      ]) {
        if (elMap.has(name) && inputSourcePose) {
          const pose = frame.getPose(inputSourcePose, referenceSpace);
          if (pose) {
            for (const el of elMap.get(name)) {
              el.object3D.position.copy(pose.transform.position);
              el.object3D.quaternion.copy(pose.transform.orientation);
              const elShouldBeVisible = (el.getDOMAttribute('visible') !== false)
              el.object3D.visible = elShouldBeVisible;
              if (el.dataset.noMagnet === undefined) toMagnet.push(el.object3D);
            }
          }
        }
      }

      // If we should draw gamepads then do, but don't draw gamepad and hand if btoh present
      if (
        (this.data.renderGamepad === "any" || this.data.renderGamepad === inputSource.handedness) &&
        inputSource.gamepad && !inputSource.hand
      ) {
        const controllerModel = this.getControllerModel(inputSource);
        if (controllerModel) {
          if (inputSource.gripSpace) {
            const pose = frame.getPose(inputSource.gripSpace, referenceSpace);
            if (pose) {
              controllerModel.position.copy(pose.transform.position);
              controllerModel.quaternion.copy(pose.transform.orientation);
              toMagnet.push(controllerModel);
            }
          }

          // if it has a gamepad fire events for gamepad changes
          const old = prevGamePads.get(inputSource);
          const data = {
            buttons: inputSource.gamepad.buttons.map(b => b.value),
            axes: inputSource.gamepad.axes.slice(0)
          };
          if (old) {
            const eventDetails = {handedness: inputSource.handedness, inputSource, data, frame}
            data.buttons.forEach((value,i)=>{
              if (value !== old.buttons[i]) {
                let name = controllerModel.gamepadMappings?.buttons[i] || `button${i}`;
                if (value === 1) {
                  this.emitGamepad(allEls, `${name}down`, Object.assign({value}, eventDetails));
                } else {
                  this.emitGamepad(allEls, `${name}up`, Object.assign({value}, eventDetails));
                }
              }
            });
            const axesMapping = controllerModel.gamepadMappings?.axes;
            if (axesMapping && axesMapping.length) {
              // There are some named axis so try to combine them together
              changedAxes.clear();
              const details =  {};
              axesMapping.forEach(({name}, i)=>{
                if (name) {
                  const value = data.axes[i];
                  if (value !== old.axes[i]) {
                    changedAxes.add(name);
                  }
                }
              });
              if (changedAxes.size) {
                axesMapping.forEach(({name, type}, i)=>{
                  if (name && changedAxes.has(name)) {
                    const value = data.axes[i];
                    details[name] =  details[name] || {};
                    details[name][type.slice(0,1)] = value;
                  }
                });
                for (const [name, detail] of Object.entries(details)) {
                  this.emitGamepad(allEls, `${name}moved`, Object.assign(detail, eventDetails));
                }
              }
            } else {
              data.axes.forEach((value,i)=>{
                let name = controllerModel.gamepadMappings?.axes[i] || `axes${i}`;
                if (value !== old.axes[i]) {
                  this.emitGamepad(allEls, `${name}moved`, Object.assign({value}, eventDetails));
                }
              });
            }
          }
          prevGamePads.set(inputSource, data);
        }
      }
      
      if (magnetEl) {
        this.el.object3D.getWorldQuaternion(tempQuaternion_C).invert();
        magnetEl.object3D.getWorldPosition(tempVector3_A);
        for (const el of this.getMagnetTargets(magnetEl)) {
          let magnetRange,fadeEnd,angleRange,angleEnd;
          const magnetRangeData = el.dataset.magnetRange;
          if (magnetRangeData) {
            if (el.object3D.userData.magnetRangeData) {
              [magnetRange,fadeEnd,angleRange,angleEnd] = el.object3D.userData.magnetRangeData;
            } else {
              // Cache it
              el.object3D.userData.magnetRangeData = magnetRangeData.split(',').map(n => Number(n));
              [magnetRange,fadeEnd,angleRange,angleEnd] = el.object3D.userData.magnetRangeData;
            }
          }
          magnetRange = magnetRange || 0.2;
          fadeEnd = fadeEnd === undefined ? 0.1 : fadeEnd;
          angleRange = angleRange || 120;
          angleEnd = angleEnd === undefined ? 80 : angleEnd;
          const d =  el.object3D.getWorldPosition(tempVector3_B).sub(tempVector3_A).length();
          if (d < magnetRange) {
            const Θ = (180/Math.PI) * el.object3D.getWorldQuaternion(tempQuaternion_A).premultiply(tempQuaternion_C).angleTo(magnetEl.object3D.quaternion);
            if (Θ < angleRange) {
              magnetTarget = el;
              fadeT = invlerp(magnetRange,fadeEnd,d) * invlerp(angleRange,angleEnd,Θ);
              break;
            }
          }
        }

        if (fadeT > 0.2 && magnetTarget && magnetTarget.id) {
          magnetEl.dataset.magnetTarget = magnetTarget.id;
        } else {
          delete magnetEl.dataset.magnetTarget;
        }
      }
      
      if (magnetTarget) {

        this.el.object3D.worldToLocal(magnetTarget.object3D.getWorldPosition(tempVector3_A));
        tempVector3_B.copy(magnetEl.object3D.position);
        tempVector3_A.lerp(tempVector3_B, 1-fadeT).sub(tempVector3_B);
        
        // tempQuaternion_A is populated already when calculating if it's a close enough angle
        // magnetTarget.object3D.getWorldQuaternion(tempQuaternion_A);
        // tempQuaternion_A.premultiply(tempQuaternion_C);
        tempQuaternion_B.copy(magnetEl.object3D.quaternion);
        tempQuaternion_A.slerp(tempQuaternion_B, 1-fadeT).multiply(tempQuaternion_B.invert());
        
        // Move elements to match the bones but skil elements which are marked data-no-magnet
        for (const object3D of toMagnet) {
          object3D.position.sub(tempVector3_B);
          object3D.position.applyQuaternion(tempQuaternion_A);
          object3D.position.add(tempVector3_B);
          object3D.applyQuaternion(tempQuaternion_A);
          object3D.position.add(tempVector3_A);
        }
      }
      for (const bone of bones) {
        bone.applyMatrix4(this.el.object3D.matrixWorld);
        bone.updateMatrixWorld();
      }
    }

    // perform hand pose detection
    if (toUpdate.length && this.handyWorkUpdate) {
      this.handyWorkUpdate(
        toUpdate,
        referenceSpace,
        frame,
        function ({
          distances, handedness
        }) {
          self.emitHandpose(distances[0][0], handedness, {
            pose: distances[0][0],
            poses: distances,
            handedness,
            frame
          });
        }
      );
    }
  },
  emitGamepad (els, name, details) {
    details.event = name;
    for (const el of els) {
      el.emit(name, details, false);
      el.emit('gamepad', details, false);
    }
  },
  emitHandpose(name, handedness, details) {
    const oldPoseName = this[handedness + '_currentPose'];
    if (name === oldPoseName) return;
    const els = this.elArrays[handedness];
    
    clearTimeout(this[handedness + '_vshortTimeout']);
    clearTimeout(this[handedness + '_shortTimeout']);
    clearTimeout(this[handedness + '_longTimeout']);

    // This just fires cancel if it's no longer at the top but maybe be smarter?
    if (oldPoseName) {
      const oldPoseDetails = Object.assign({}, details);
      oldPoseDetails.pose = oldPoseName;
      for (const el of els) {
        el.emit('pose_cancel_' + oldPoseName, oldPoseDetails, false);
        el.emit('pose_end', oldPoseDetails, false);
      }
    }
    
    this[handedness + '_currentPose'] = name;

    this[handedness + '_vshortTimeout'] = setTimeout(() => {
      for (const el of els) {
        el.emit('pose_' + name, details, false);
        el.emit('pose', details, false);
      }
    }, this.data.fuseVShort);
    
    this[handedness + '_shortTimeout'] = setTimeout(() => {
      for (const el of els) el.emit('pose_' + name + '_fuseShort', details, false);
    }, this.data.fuseShort);
    
    this[handedness + '_longTimeout'] = setTimeout(() => { 
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
      this.el.removeObject3D("hand-mesh-right");
    }
    if (this.el.getObject3D('controller-model-0')) this.el.removeObject3D('controller-model-0');
    if (this.el.getObject3D('controller-model-1')) this.el.removeObject3D('controller-model-1');
  },
});
