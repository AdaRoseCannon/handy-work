# Handy Work

A module for doing efficient real-time pose detection from WebXR Hand Tracking using Web Workers to ensure it doesn't interfere with the main thread

The pose tracking module is Framework Agnostic, it doesn't rely on any particular library it should work just as well with THREE as BabylonJS or Play Canvas. 

Poses can be found in the `/poses/` folder and additional poses are welcome 

There is also an AFrame module which handles pose tracking and displaying hand models.

## Module Usage Example

```javascript
import {
  update as handyWorkUpdate,
  loadPose
} from "../build/esm/handy-work.js";

loadPose('relax', '../poses/relax.handpose');
loadPose('fist', '../poses/fist.handpose');
loadPose('flat', '../poses/flat.handpose');
loadPose('point', '../poses/point.handpose');

// In RAF
handyWorkUpdate([controller1, controller2], referenceSpace, frame, callback);
```
## Using via a CDN

If you use it via a CDN because it uses a Worker you need to use the 
standalone version which has the Worker encoded as a string.

```javascript
import('https://cdn.jsdelivr.net/npm/handy-work@1.4.0/build/esm/handy-work.standalone.js')
.then(function ({
  update,
  loadPose,
  dumpHands
}) {
  const handyWorkUpdate = update;
  const dumpHands = dumpHands;
  const loadPose = loadPose;

  loadPose('relax', POSE_FOLDER + 'relax.handpose');
  loadPose('fist', POSE_FOLDER + 'fist.handpose');
  loadPose('flat', POSE_FOLDER + 'flat.handpose');
  loadPose('point', POSE_FOLDER + 'point.handpose');
  loadPose('horns', POSE_FOLDER + 'horns.handpose');
  loadPose('shaka', POSE_FOLDER + 'shaka.handpose');
  loadPose('vulcan', POSE_FOLDER + 'vulcan.handpose');
}.bind(this));
```

## AFrame

The controls provide the ability to render hands and attach objects to individual joints.

It also fires events for when poses have been held for certain lengths of time.

The following are exposed on the component itself so you can hook into the library

* handyWorkUpdate
* dumpHands
* loadPose
* setPose 
* getPose 

Use the following properties to customise the component

<!--SCHEMA-->
| Property         | Description                                                                | Type   | Default                                                                                            |
| :--------------- | :------------------------------------------------------------------------- | :----- | :------------------------------------------------------------------------------------------------- |
| left             | URL for left controller                                                    | model  | https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/left.glb  |
| right            | URL for right controller                                                   | model  | https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/right.glb |
| materialOverride | Which hand to use the `material` component for One of both,left,right,none | string | both                                                                                               |
| fuseVShort       | Time for a pose to trigger a pose event (ms)                               | number | 48                                                                                                 |
| fuseShort        | Time for a pose to trigger a pose_fuseShort event (ms)                     | number | 480                                                                                                |
| fuseLong         | Time for a pose to trigger a pose_fuseLong event (ms)                      | number | 1440                                                                                               |

<!--SCHEMA_END-->

Child entities with the `data-left` or `data-right` properties have their position and 
rotation set to match the bones they are set to where the bone can be one of:

* grip (not a bone, where someone would hold an object)
* ray (not a bone, the target ray space from WebXR)
* wrist
* thumb-metacarpal
* thumb-phalanx-proximal
* thumb-phalanx-distal
* thumb-tip
* index-finger-metacarpal
* index-finger-phalanx-proximal
* index-finger-phalanx-intermediate
* index-finger-phalanx-distal
* index-finger-tip
* middle-finger-metacarpal
* middle-finger-phalanx-proximal
* middle-finger-phalanx-intermediate
* middle-finger-phalanx-distal
* middle-finger-tip
* ring-finger-metacarpal
* ring-finger-phalanx-proximal
* ring-finger-phalanx-intermediate
* ring-finger-phalanx-distal
* ring-finger-tip
* pinky-finger-metacarpal
* pinky-finger-phalanx-proximal
* pinky-finger-phalanx-intermediate
* pinky-finger-phalanx-distal
* pinky-finger-tip

Example use case:

```html
<!-- After the AFrame script -->
<script src="https://cdn.jsdelivr.net/npm/handy-work@1.4.0/build/handy-controls.min.js"></script>

<!-- In your camera rig -->
<a-entity handy-controls="right:#right-gltf;materialOverride:right;" material="color:gold;metalness:1;roughness:0;">
  <a-gltf-model src="#watch-gltf" data-left="wrist" position="-1000 0 0">
    <a-sphere radius="0.02" position="0 0.02 0" sphere-collider="radius:0.02;objects:[data-right$=-tip];" exit-on="hitend" visible="false"></a-sphere>
    <a-entity position="0 0 -0.22" class="pose-label" text="value: Hello World; align: center;"></a-entity>
  </a-gltf-model>
  <a-entity data-right="wrist">
    <a-entity position="0 0 -0.22" class="pose-label" text="value: Hello World; align: center;"></a-entity>
  </a-entity>
  <a-entity data-left="ring-finger-phalanx-proximal">
    <a-torus position="0 0 -0.03" radius="0.008" radius-tubular="0.001" scale="1 1 1.5" material="color:gold;metalness:1;roughness:0;"></a-torus>
  </a-entity>
  
  <a-entity data-right="index-finger-tip" mixin="blink" blink-controls="rotateOnTeleport:false;startEvents:pose_point_fuseShort;endEvents:pose_point_fuseLong;"></a-entity>
  <a-entity data-left="index-finger-tip"  mixin="blink" blink-controls="rotateOnTeleport:false;startEvents:pose_point_fuseShort;endEvents:pose_point_fuseLong;"></a-entity>

  <a-entity data-right="grip">
    <a-gltf-model src="#sword-gltf" scale="0.6,0.6,1"></a-gltf-model>
  </a-entity>
  
  <!-- Invisible objects at the tips of each finger for physics or intersections -->
  <a-sphere data-right="index-finger-tip" radius="0.01" visible="false"></a-sphere>
  <a-sphere data-right="middle-finger-tip" radius="0.01" visible="false"></a-sphere>
  <a-sphere data-right="ring-finger-tip" radius="0.01" visible="false"></a-sphere>
  <a-sphere data-right="pinky-finger-tip" radius="0.01" visible="false"></a-sphere>
  <a-sphere data-right="thumb-tip" radius="0.01" visible="false"></a-sphere>
  <a-sphere data-left="index-finger-tip" radius="0.01" visible="false"></a-sphere>
  <a-sphere data-left="middle-finger-tip" radius="0.01" visible="false"></a-sphere>
  <a-sphere data-left="ring-finger-tip" radius="0.01" visible="false"></a-sphere>
  <a-sphere data-left="pinky-finger-tip" radius="0.01" visible="false"></a-sphere>
  <a-sphere data-left="thumb-tip" radius="0.01" visible="false"></a-sphere>
</a-entity>
```

<!--DOCS-->
<a name="module_handy-work"></a>

## handy-work
Documentation for using build/esm/handy-work.js or build/esm/handy-work.standalone.js


* [handy-work](#module_handy-work)
    * [.loadPose(name, url)](#module_handy-work.loadPose) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.getPose(name)](#module_handy-work.getPose) ⇒ <code>Promise.&lt;Float32Array&gt;</code>
    * [.setPose(name, pose)](#module_handy-work.setPose) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.resetHands()](#module_handy-work.resetHands)
    * [.dumpHands()](#module_handy-work.dumpHands)
    * [.generatePose(inputSources, referenceSpace, frame)](#module_handy-work.generatePose) ⇒ <code>void</code> \| <code>Float32Array</code>
    * [.update(inputSources, referenceSpace, frame, callback)](#module_handy-work.update)

<a name="module_handy-work.loadPose"></a>

### handy-work.loadPose(name, url) ⇒ <code>Promise.&lt;void&gt;</code>
Loads a pose from the Web the recommended way of using this API

**Kind**: static method of [<code>handy-work</code>](#module_handy-work)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves once it has been completed  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the pose |
| url | <code>string</code> | URL of the pose to download and add to the registry |

<a name="module_handy-work.getPose"></a>

### handy-work.getPose(name) ⇒ <code>Promise.&lt;Float32Array&gt;</code>
Get a pose from the registry

**Kind**: static method of [<code>handy-work</code>](#module_handy-work)  
**Returns**: <code>Promise.&lt;Float32Array&gt;</code> - A copy of the pose from the registry in the worker  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | of the pose to fetch |

<a name="module_handy-work.setPose"></a>

### handy-work.setPose(name, pose) ⇒ <code>Promise.&lt;void&gt;</code>
Get a pose from the registry

**Kind**: static method of [<code>handy-work</code>](#module_handy-work)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves once the pose has been uploaded to the worker  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | of the pose to set |
| pose | <code>Float32Array</code> | Array buffer with the information about the current pose |

<a name="module_handy-work.resetHands"></a>

### handy-work.resetHands()
Reset the current tracking performed automatically when the device returns from sleep

**Kind**: static method of [<code>handy-work</code>](#module_handy-work)  
<a name="module_handy-work.dumpHands"></a>

### handy-work.dumpHands()
On the next frame save the current hand pose to a file

**Kind**: static method of [<code>handy-work</code>](#module_handy-work)  
<a name="module_handy-work.generatePose"></a>

### handy-work.generatePose(inputSources, referenceSpace, frame) ⇒ <code>void</code> \| <code>Float32Array</code>
Get a pose from the current hand position

**Kind**: static method of [<code>handy-work</code>](#module_handy-work)  
**Returns**: <code>void</code> \| <code>Float32Array</code> - The generated pose buffer for the pose.  

| Param | Type | Description |
| --- | --- | --- |
| inputSources | <code>XRInputSource</code> | Array of inputs you want to generate inputs for, requires a left AND right hand |
| referenceSpace | <code>XRReferenceSpace</code> | Current reference space |
| frame | <code>XRFrame</code> | Current active frame |

<a name="module_handy-work.update"></a>

### handy-work.update(inputSources, referenceSpace, frame, callback)
**Kind**: static method of [<code>handy-work</code>](#module_handy-work)  

| Param | Type | Description |
| --- | --- | --- |
| inputSources | <code>Array.&lt;XRInputSource&gt;</code> | The inputs you want to do pose tracking for |
| referenceSpace | <code>XRReferenceSpace</code> | The reference space for your scene |
| frame | <code>XRFrame</code> | The current active frame |
| callback | <code>function</code> | This gets called with an Array of Arrays with the poses and their distances |

<!--DOCS_END-->
