# Handy Work

A module for doing efficient real-time pose detection from WebXR Hand Tracking using Web Workers to ensure it doesn't interfere with the main thread

The pose tracking module is Framework Agnostic, it doesn't rely on any particular library it should work just as well with THREE as BabylonJS or Play Canvas. 

Poses can be found in the `/poses/` folder and additional poses are welcome 

There is also an AFrame module which handles pose tracking and displaying hand models.

## Hand Pose Module Usage Example

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
Vector3
Vector3
Quaternion
Quaternion
Quaternion
| Property         | One of                    | Default                                                                                        | Description                                                                                                                                                                                                              | Type   |
| :--------------- | :------------------------ | :--------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| renderGamepad    | any,left,right,none,never | any                                                                                            | Whether to render a gamepad model when it's not doing hand tracking, right, none and left are the names of controller handedness, any is all of them, and never is to not draw gamepads One of any,left,right,none,never | string |
| left             |                           | https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets/dist/profiles/generic-hand/left.glb  | URL for left controller                                                                                                                                                                                                  | model  |
| right            |                           | https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets/dist/profiles/generic-hand/right.glb | URL for right controller                                                                                                                                                                                                 | model  |
| materialOverride | both,left,right,neither   | both                                                                                           | Which hand to use the `material` component for One of both,left,right,neither                                                                                                                                            | string |
| fuseVShort       |                           | 48                                                                                             | Time for a pose to trigger a pose event (ms)                                                                                                                                                                             | number |
| fuseShort        |                           | 480                                                                                            | Time for a pose to trigger a pose_fuseShort event (ms)                                                                                                                                                                   | number |
| fuseLong         |                           | 1440                                                                                           | Time for a pose to trigger a pose_fuseLong event (ms)                                                                                                                                                                    | number |

<!--SCHEMA_END-->

Child entities with the `data-left`, `data-right` or `data-none` properties have their position and 
rotation set to match the tracked points from the WebXR API:

`data-left` and `data-right` are used for tracked hands or controllers where the hardware has controllers
which are explicity handed. i.e. Oculus Quest. Some hardware has a single ambiguously handed controller
this will be exposed as `data-none` because it has no handedness.  Screen based transient inputs will also
be exposed under `data-none`.

* grip (where someone would hold an object)
* ray (the target ray space from WebXR)
* screen-0 (1st transient input)
* screen-1 (2nd transient input)
* screen-2 (3rd transient input)
* screen-n ({n+1}th transient input)

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

### Events

The component and each child emit events when they happen these events are

#### Standard WebXR API Events

* "select"
* "selectstart"
* "selectend"
* "squeeze"
* "squeezeend"
* "squeezestart"

#### Poses

* pose_[name]
* pose_[name]_fuseShort
* pose_[name]_fuseLong

Where name is one of the poses in `/poses`

You can see what the currently detected pose is by listening for `"pose"` events and inspecting `"event.detail.pose"`

#### Gamepad Events

These are very hardware dependent. If it is able to get access to the input profile data from the WebXR
input profiles repo then this will fire off events as named in that. Such as thumbstickmoved or a-buttondown x-buttonup. 

Otherwise it will just fire events like button0down button0up or axes0moved

To find out what a particular piece of hardware is using listen for `"gamepad"` events and inspect the `event.detail.event`.

### Magnetic Actions

Add data-magnet set to a query selector for magnetic elements so that when the joint approaches
that element the whole hand will get pulled towards it.

Only set 1 `data-magnet` per hand. You can configure the magnetic elements by setting their data-magnet range e.g. `data-magnet-range="0.2,0.1"`. Where the first number is where the magnetism starts and the second the range at which the hand is totally moved to the destination location. In that example, which is the default it will start approaching from 0.2m and if the hand is within 0.1m it will be placed on the `#sword` handle.

For physics systems it probably won't work well when you use magnet elements you probably want to use the real joint location, do declare an additional that a joint should ignore magnet effects add `data-no-magnet` to it.

The object currently attracting the controller will have it's ID noted on the `data-magnet` element as a `data-magnet-target` which you can read in JavaScript through the object's dataset.

The magnet finding function always picks the first element it detects in it's range. Not the closest element. You can
sort the order magnets are tested by setting the `data-magnet-priority` property on elements. The default value is `1` if you want it to be low priority set `data-magnet-priority="0"` or lower like `"-1"` fractions are fine too. If you want it to be higher priority set it to a higher number such as `data-magnet-priority="10"`. 

```html
<!-- inside the handy-controls -->
<a-entity data-right="grip" data-magnet="#sword"></a-entity>
<a-entity data-left="grip" data-magnet="#sword"></a-entity>

<!-- Elsewhere in the scene -->
<a-gltf-model id="sword" src="#sword-gltf" data-magnet-range="0.2,0.1"></a-gltf-model>
```

### Example use case:

```html
<!-- After the AFrame script -->
<script src="https://cdn.jsdelivr.net/npm/handy-work/build/handy-controls.min.js"></script>

<!-- In your camera rig -->
<a-entity handy-controls="right:#right-gltf;materialOverride:right;" material="color:gold;metalness:1;roughness:0;">

  <!-- Screen space inputs like mobile AR -->
  <a-torus radius="0.008" radius-tubular="0.001" material="shader:flat;color:blue" data-none="screen-0"></a-torus>
  <a-torus radius="0.008" radius-tubular="0.001" material="shader:flat;color:green" data-none="screen-1"></a-torus>
  <a-torus radius="0.008" radius-tubular="0.001" material="shader:flat;color:red" data-none="screen-2"></a-torus>
  
  <!-- Objects attached to tracked hand joints -->
  <a-gltf-model src="#watch-gltf" data-left="wrist" position="-1000 0 0">
    <a-sphere radius="0.02" position="0 0.02 0" sphere-collider="radius:0.02;objects:[data-right$=-tip];" exit-on="hitend" visible="false"></a-sphere>
  </a-gltf-model>
  <a-entity data-left="ring-finger-phalanx-proximal">
    <a-torus position="0 0 -0.03" radius="0.008" radius-tubular="0.001" scale="1 1 1.5" material="color:gold;metalness:1;roughness:0;"></a-torus>
  </a-entity>
  
  <a-entity data-right="index-finger-tip" mixin="blink" blink-controls="rotateOnTeleport:false;startEvents:pose_point_fuseShort;endEvents:pose_point_fuseLong;"></a-entity>
  <a-entity data-left="index-finger-tip"  mixin="blink" blink-controls="rotateOnTeleport:false;startEvents:pose_point_fuseShort;endEvents:pose_point_fuseLong;"></a-entity>
  
  <!-- Ray and Grip are Available on Hands or Tracked Inputs -->
  <a-entity data-right="ray" mixin="blink" blink-controls>
    <a-entity position="0 0 -0.22" class="pose-label" text="value: Hello World; align: center;"></a-entity>
  </a-entity>
  <a-entity data-left="ray" mixin="blink" blink-controls>
    <a-entity position="0 0 -0.22" class="pose-label" text="value: Hello World; align: center;"></a-entity>
  </a-entity>

  <!-- These act like anchors pulling both hands and controllers towards grabable objects, moving the whole hand and the attached elements-->
  <a-entity id="right-magnet" data-right="grip" data-magnet=".magnet-right:not([data-no-magnet]),.magnet:not([data-no-magnet])" grab-magnet-target="startEvents:squeezestart,pose_fist;stopEvents:pose_flat_fuseShort,squeezeend;"></a-entity>
  <a-entity id="left-magnet" data-left="grip"  data-magnet=".magnet-left:not([data-no-magnet]),.magnet:not([data-no-magnet])"  grab-magnet-target="startEvents:squeezestart,pose_fist;stopEvents:pose_flat_fuseShort,squeezeend;"></a-entity>

  <!-- Markers to let us know the real location of the hands -->
  <a-sphere id="right-no-magnet" data-right="grip" data-no-magnet radius="0.01" color="red"></a-sphere>
  <a-sphere id="left-no-magnet" data-left="grip" data-no-magnet radius="0.01" color="red"></a-sphere>
  
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
