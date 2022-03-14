# Handy Work

A module for doing efficient real-time pose detection from WebXR Hand Tracking using Web Workers to ensure it doesn't interfere with the main thread

The pose tracking module is Framework Agnostic, it doesn't rely on any particular library it should work just as well with THREE as BabylonJS or Play Canvas. 

Poses can be found in the `/poses/` folder and additional poses are welcome 

There is also an [AFrame module](./README-AFRAME.md) which handles pose tracking and displaying hand models.

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
