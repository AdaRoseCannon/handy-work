# handy Work

Framework agnostic Hand Tracking

## Instructions

```javascript
import {
  update as handyWorkUpdate,
  loadPose
} from "../build/handy-work.js";

loadPose('relax', '../poses/relax.handpose');
loadPose('fist', '../poses/fist.handpose');
loadPose('flat', '../poses/flat.handpose');
loadPose('point', '../poses/point.handpose');

// In RAF
handyWorkUpdate([controller1, controller2], referenceSpace, frame, callback);
```
