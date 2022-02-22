const t=Symbol("Comlink.proxy"),s=Symbol("Comlink.endpoint"),e=Symbol("Comlink.releaseProxy"),i=Symbol("Comlink.thrown"),r=t=>"object"==typeof t&&null!==t||"function"==typeof t,h=new Map([["proxy",{canHandle:s=>r(s)&&s[t],serialize(t){const{port1:s,port2:e}=new MessageChannel;return n(t,s),[e,[e]]},deserialize:t=>(t.start(),o(t))}],["throw",{canHandle:t=>r(t)&&i in t,serialize({value:t}){let s;return s=t instanceof Error?{isError:!0,value:{message:t.message,name:t.name,stack:t.stack}}:{isError:!1,value:t},[s,[]]},deserialize(t){if(t.isError)throw Object.assign(new Error(t.value.message),t.value);throw t.value}}]]);function n(s,e=self){e.addEventListener("message",(function r(h){if(!h||!h.data)return;const{id:o,type:l,path:c}=Object.assign({path:[]},h.data),u=(h.data.argumentList||[]).map(_);let y;try{const e=c.slice(0,-1).reduce(((t,s)=>t[s]),s),i=c.reduce(((t,s)=>t[s]),s);switch(l){case"GET":y=i;break;case"SET":e[c.slice(-1)[0]]=_(h.data.value),y=!0;break;case"APPLY":y=i.apply(e,u);break;case"CONSTRUCT":y=function(s){return Object.assign(s,{[t]:!0})}(new i(...u));break;case"ENDPOINT":{const{port1:t,port2:e}=new MessageChannel;n(s,e),y=m(t,[t])}break;case"RELEASE":y=void 0;break;default:return}}catch(t){y={value:t,[i]:0}}Promise.resolve(y).catch((t=>({value:t,[i]:0}))).then((t=>{const[s,i]=x(t);e.postMessage(Object.assign(Object.assign({},s),{id:o}),i),"RELEASE"===l&&(e.removeEventListener("message",r),a(e))}))})),e.start&&e.start()}function a(t){(function(t){return"MessagePort"===t.constructor.name})(t)&&t.close()}function o(t,s){return c(t,[],s)}function l(t){if(t)throw new Error("Proxy has been released and is not useable")}function c(t,i=[],r=function(){}){let h=!1;const n=new Proxy(r,{get(s,r){if(l(h),r===e)return()=>z(t,{type:"RELEASE",path:i.map((t=>t.toString()))}).then((()=>{a(t),h=!0}));if("then"===r){if(0===i.length)return{then:()=>n};const s=z(t,{type:"GET",path:i.map((t=>t.toString()))}).then(_);return s.then.bind(s)}return c(t,[...i,r])},set(s,e,r){l(h);const[n,a]=x(r);return z(t,{type:"SET",path:[...i,e].map((t=>t.toString())),value:n},a).then(_)},apply(e,r,n){l(h);const a=i[i.length-1];if(a===s)return z(t,{type:"ENDPOINT"}).then(_);if("bind"===a)return c(t,i.slice(0,-1));const[o,y]=u(n);return z(t,{type:"APPLY",path:i.map((t=>t.toString())),argumentList:o},y).then(_)},construct(s,e){l(h);const[r,n]=u(e);return z(t,{type:"CONSTRUCT",path:i.map((t=>t.toString())),argumentList:r},n).then(_)}});return n}function u(t){const s=t.map(x);return[s.map((t=>t[0])),(e=s.map((t=>t[1])),Array.prototype.concat.apply([],e))];var e}const y=new WeakMap;function m(t,s){return y.set(t,s),t}function x(t){for(const[s,e]of h)if(e.canHandle(t)){const[i,r]=e.serialize(t);return[{type:"HANDLER",name:s,value:i},r]}return[{type:"RAW",value:t},y.get(t)||[]]}function _(t){switch(t.type){case"HANDLER":return h.get(t.name).deserialize(t.value);case"RAW":return t.value}}function z(t,s,e){return new Promise((i=>{const r=new Array(4).fill(0).map((()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16))).join("-");t.addEventListener("message",(function s(e){e.data&&e.data.id&&e.data.id===r&&(t.removeEventListener("message",s),i(e.data))})),t.start&&t.start(),t.postMessage(Object.assign({id:r},s),e)}))}const p=[];for(let t=0;t<256;t++)p[t]=(t<16?"0":"")+t.toString(16);function M(t,s,e){return Math.max(s,Math.min(e,t))}class d{constructor(t=0,s=0,e=0,i=1){this._x=t,this._y=s,this._z=e,this._w=i}static slerp(t,s,e,i){return console.warn("THREE.Quaternion: Static .slerp() has been deprecated. Use qm.slerpQuaternions( qa, qb, t ) instead."),e.slerpQuaternions(t,s,i)}static slerpFlat(t,s,e,i,r,h,n){let a=e[i+0],o=e[i+1],l=e[i+2],c=e[i+3];const u=r[h+0],y=r[h+1],m=r[h+2],x=r[h+3];if(0===n)return t[s+0]=a,t[s+1]=o,t[s+2]=l,void(t[s+3]=c);if(1===n)return t[s+0]=u,t[s+1]=y,t[s+2]=m,void(t[s+3]=x);if(c!==x||a!==u||o!==y||l!==m){let t=1-n;const s=a*u+o*y+l*m+c*x,e=s>=0?1:-1,i=1-s*s;if(i>Number.EPSILON){const r=Math.sqrt(i),h=Math.atan2(r,s*e);t=Math.sin(t*h)/r,n=Math.sin(n*h)/r}const r=n*e;if(a=a*t+u*r,o=o*t+y*r,l=l*t+m*r,c=c*t+x*r,t===1-n){const t=1/Math.sqrt(a*a+o*o+l*l+c*c);a*=t,o*=t,l*=t,c*=t}}t[s]=a,t[s+1]=o,t[s+2]=l,t[s+3]=c}static multiplyQuaternionsFlat(t,s,e,i,r,h){const n=e[i],a=e[i+1],o=e[i+2],l=e[i+3],c=r[h],u=r[h+1],y=r[h+2],m=r[h+3];return t[s]=n*m+l*c+a*y-o*u,t[s+1]=a*m+l*u+o*c-n*y,t[s+2]=o*m+l*y+n*u-a*c,t[s+3]=l*m-n*c-a*u-o*y,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,s,e,i){return this._x=t,this._y=s,this._z=e,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,s){if(!t||!t.isEuler)throw new Error("THREE.Quaternion: .setFromEuler() now expects an Euler rotation rather than a Vector3 and order.");const e=t._x,i=t._y,r=t._z,h=t._order,n=Math.cos,a=Math.sin,o=n(e/2),l=n(i/2),c=n(r/2),u=a(e/2),y=a(i/2),m=a(r/2);switch(h){case"XYZ":this._x=u*l*c+o*y*m,this._y=o*y*c-u*l*m,this._z=o*l*m+u*y*c,this._w=o*l*c-u*y*m;break;case"YXZ":this._x=u*l*c+o*y*m,this._y=o*y*c-u*l*m,this._z=o*l*m-u*y*c,this._w=o*l*c+u*y*m;break;case"ZXY":this._x=u*l*c-o*y*m,this._y=o*y*c+u*l*m,this._z=o*l*m+u*y*c,this._w=o*l*c-u*y*m;break;case"ZYX":this._x=u*l*c-o*y*m,this._y=o*y*c+u*l*m,this._z=o*l*m-u*y*c,this._w=o*l*c+u*y*m;break;case"YZX":this._x=u*l*c+o*y*m,this._y=o*y*c+u*l*m,this._z=o*l*m-u*y*c,this._w=o*l*c-u*y*m;break;case"XZY":this._x=u*l*c-o*y*m,this._y=o*y*c-u*l*m,this._z=o*l*m+u*y*c,this._w=o*l*c+u*y*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+h)}return!1!==s&&this._onChangeCallback(),this}setFromAxisAngle(t,s){const e=s/2,i=Math.sin(e);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(e),this._onChangeCallback(),this}setFromRotationMatrix(t){const s=t.elements,e=s[0],i=s[4],r=s[8],h=s[1],n=s[5],a=s[9],o=s[2],l=s[6],c=s[10],u=e+n+c;if(u>0){const t=.5/Math.sqrt(u+1);this._w=.25/t,this._x=(l-a)*t,this._y=(r-o)*t,this._z=(h-i)*t}else if(e>n&&e>c){const t=2*Math.sqrt(1+e-n-c);this._w=(l-a)/t,this._x=.25*t,this._y=(i+h)/t,this._z=(r+o)/t}else if(n>c){const t=2*Math.sqrt(1+n-e-c);this._w=(r-o)/t,this._x=(i+h)/t,this._y=.25*t,this._z=(a+l)/t}else{const t=2*Math.sqrt(1+c-e-n);this._w=(h-i)/t,this._x=(r+o)/t,this._y=(a+l)/t,this._z=.25*t}return this._onChangeCallback(),this}setFromUnitVectors(t,s){let e=t.dot(s)+1;return e<Number.EPSILON?(e=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=e):(this._x=0,this._y=-t.z,this._z=t.y,this._w=e)):(this._x=t.y*s.z-t.z*s.y,this._y=t.z*s.x-t.x*s.z,this._z=t.x*s.y-t.y*s.x,this._w=e),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(M(this.dot(t),-1,1)))}rotateTowards(t,s){const e=this.angleTo(t);if(0===e)return this;const i=Math.min(1,s/e);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return 0===t?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t,s){return void 0!==s?(console.warn("THREE.Quaternion: .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead."),this.multiplyQuaternions(t,s)):this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,s){const e=t._x,i=t._y,r=t._z,h=t._w,n=s._x,a=s._y,o=s._z,l=s._w;return this._x=e*l+h*n+i*o-r*a,this._y=i*l+h*a+r*n-e*o,this._z=r*l+h*o+e*a-i*n,this._w=h*l-e*n-i*a-r*o,this._onChangeCallback(),this}slerp(t,s){if(0===s)return this;if(1===s)return this.copy(t);const e=this._x,i=this._y,r=this._z,h=this._w;let n=h*t._w+e*t._x+i*t._y+r*t._z;if(n<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,n=-n):this.copy(t),n>=1)return this._w=h,this._x=e,this._y=i,this._z=r,this;const a=1-n*n;if(a<=Number.EPSILON){const t=1-s;return this._w=t*h+s*this._w,this._x=t*e+s*this._x,this._y=t*i+s*this._y,this._z=t*r+s*this._z,this.normalize(),this._onChangeCallback(),this}const o=Math.sqrt(a),l=Math.atan2(o,n),c=Math.sin((1-s)*l)/o,u=Math.sin(s*l)/o;return this._w=h*c+this._w*u,this._x=e*c+this._x*u,this._y=i*c+this._y*u,this._z=r*c+this._z*u,this._onChangeCallback(),this}slerpQuaternions(t,s,e){return this.copy(t).slerp(s,e)}random(){const t=Math.random(),s=Math.sqrt(1-t),e=Math.sqrt(t),i=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(s*Math.cos(i),e*Math.sin(r),e*Math.cos(r),s*Math.sin(i))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,s=0){return this._x=t[s],this._y=t[s+1],this._z=t[s+2],this._w=t[s+3],this._onChangeCallback(),this}toArray(t=[],s=0){return t[s]=this._x,t[s+1]=this._y,t[s+2]=this._z,t[s+3]=this._w,t}fromBufferAttribute(t,s){return this._x=t.getX(s),this._y=t.getY(s),this._z=t.getZ(s),this._w=t.getW(s),this}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}}d.prototype.isQuaternion=!0;class w{constructor(t=0,s=0,e=0){this.x=t,this.y=s,this.z=e}set(t,s,e){return void 0===e&&(e=this.z),this.x=t,this.y=s,this.z=e,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,s){switch(t){case 0:this.x=s;break;case 1:this.y=s;break;case 2:this.z=s;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t,s){return void 0!==s?(console.warn("THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead."),this.addVectors(t,s)):(this.x+=t.x,this.y+=t.y,this.z+=t.z,this)}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,s){return this.x=t.x+s.x,this.y=t.y+s.y,this.z=t.z+s.z,this}addScaledVector(t,s){return this.x+=t.x*s,this.y+=t.y*s,this.z+=t.z*s,this}sub(t,s){return void 0!==s?(console.warn("THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead."),this.subVectors(t,s)):(this.x-=t.x,this.y-=t.y,this.z-=t.z,this)}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,s){return this.x=t.x-s.x,this.y=t.y-s.y,this.z=t.z-s.z,this}multiply(t,s){return void 0!==s?(console.warn("THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead."),this.multiplyVectors(t,s)):(this.x*=t.x,this.y*=t.y,this.z*=t.z,this)}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,s){return this.x=t.x*s.x,this.y=t.y*s.y,this.z=t.z*s.z,this}applyEuler(t){return t&&t.isEuler||console.error("THREE.Vector3: .applyEuler() now expects an Euler rotation rather than a Vector3 and order."),this.applyQuaternion(f.setFromEuler(t))}applyAxisAngle(t,s){return this.applyQuaternion(f.setFromAxisAngle(t,s))}applyMatrix3(t){const s=this.x,e=this.y,i=this.z,r=t.elements;return this.x=r[0]*s+r[3]*e+r[6]*i,this.y=r[1]*s+r[4]*e+r[7]*i,this.z=r[2]*s+r[5]*e+r[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const s=this.x,e=this.y,i=this.z,r=t.elements,h=1/(r[3]*s+r[7]*e+r[11]*i+r[15]);return this.x=(r[0]*s+r[4]*e+r[8]*i+r[12])*h,this.y=(r[1]*s+r[5]*e+r[9]*i+r[13])*h,this.z=(r[2]*s+r[6]*e+r[10]*i+r[14])*h,this}applyQuaternion(t){const s=this.x,e=this.y,i=this.z,r=t.x,h=t.y,n=t.z,a=t.w,o=a*s+h*i-n*e,l=a*e+n*s-r*i,c=a*i+r*e-h*s,u=-r*s-h*e-n*i;return this.x=o*a+u*-r+l*-n-c*-h,this.y=l*a+u*-h+c*-r-o*-n,this.z=c*a+u*-n+o*-h-l*-r,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const s=this.x,e=this.y,i=this.z,r=t.elements;return this.x=r[0]*s+r[4]*e+r[8]*i,this.y=r[1]*s+r[5]*e+r[9]*i,this.z=r[2]*s+r[6]*e+r[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,s){return this.x=Math.max(t.x,Math.min(s.x,this.x)),this.y=Math.max(t.y,Math.min(s.y,this.y)),this.z=Math.max(t.z,Math.min(s.z,this.z)),this}clampScalar(t,s){return this.x=Math.max(t,Math.min(s,this.x)),this.y=Math.max(t,Math.min(s,this.y)),this.z=Math.max(t,Math.min(s,this.z)),this}clampLength(t,s){const e=this.length();return this.divideScalar(e||1).multiplyScalar(Math.max(t,Math.min(s,e)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,s){return this.x+=(t.x-this.x)*s,this.y+=(t.y-this.y)*s,this.z+=(t.z-this.z)*s,this}lerpVectors(t,s,e){return this.x=t.x+(s.x-t.x)*e,this.y=t.y+(s.y-t.y)*e,this.z=t.z+(s.z-t.z)*e,this}cross(t,s){return void 0!==s?(console.warn("THREE.Vector3: .cross() now only accepts one argument. Use .crossVectors( a, b ) instead."),this.crossVectors(t,s)):this.crossVectors(this,t)}crossVectors(t,s){const e=t.x,i=t.y,r=t.z,h=s.x,n=s.y,a=s.z;return this.x=i*a-r*n,this.y=r*h-e*a,this.z=e*n-i*h,this}projectOnVector(t){const s=t.lengthSq();if(0===s)return this.set(0,0,0);const e=t.dot(this)/s;return this.copy(t).multiplyScalar(e)}projectOnPlane(t){return g.copy(this).projectOnVector(t),this.sub(g)}reflect(t){return this.sub(g.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const s=Math.sqrt(this.lengthSq()*t.lengthSq());if(0===s)return Math.PI/2;const e=this.dot(t)/s;return Math.acos(M(e,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const s=this.x-t.x,e=this.y-t.y,i=this.z-t.z;return s*s+e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,s,e){const i=Math.sin(s)*t;return this.x=i*Math.sin(e),this.y=Math.cos(s)*t,this.z=i*Math.cos(e),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,s,e){return this.x=t*Math.sin(s),this.y=e,this.z=t*Math.cos(s),this}setFromMatrixPosition(t){const s=t.elements;return this.x=s[12],this.y=s[13],this.z=s[14],this}setFromMatrixScale(t){const s=this.setFromMatrixColumn(t,0).length(),e=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=s,this.y=e,this.z=i,this}setFromMatrixColumn(t,s){return this.fromArray(t.elements,4*s)}setFromMatrix3Column(t,s){return this.fromArray(t.elements,3*s)}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,s=0){return this.x=t[s],this.y=t[s+1],this.z=t[s+2],this}toArray(t=[],s=0){return t[s]=this.x,t[s+1]=this.y,t[s+2]=this.z,t}fromBufferAttribute(t,s,e){return void 0!==e&&console.warn("THREE.Vector3: offset has been removed from .fromBufferAttribute()."),this.x=t.getX(s),this.y=t.getY(s),this.z=t.getZ(s),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=2*(Math.random()-.5),s=Math.random()*Math.PI*2,e=Math.sqrt(1-t**2);return this.x=e*Math.cos(s),this.y=e*Math.sin(s),this.z=t,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}w.prototype.isVector3=!0;const g=new w,f=new d;class b{constructor(){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],arguments.length>0&&console.error("THREE.Matrix4: the constructor no longer reads arguments. use .set() instead.")}set(t,s,e,i,r,h,n,a,o,l,c,u,y,m,x,_){const z=this.elements;return z[0]=t,z[4]=s,z[8]=e,z[12]=i,z[1]=r,z[5]=h,z[9]=n,z[13]=a,z[2]=o,z[6]=l,z[10]=c,z[14]=u,z[3]=y,z[7]=m,z[11]=x,z[15]=_,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return(new b).fromArray(this.elements)}copy(t){const s=this.elements,e=t.elements;return s[0]=e[0],s[1]=e[1],s[2]=e[2],s[3]=e[3],s[4]=e[4],s[5]=e[5],s[6]=e[6],s[7]=e[7],s[8]=e[8],s[9]=e[9],s[10]=e[10],s[11]=e[11],s[12]=e[12],s[13]=e[13],s[14]=e[14],s[15]=e[15],this}copyPosition(t){const s=this.elements,e=t.elements;return s[12]=e[12],s[13]=e[13],s[14]=e[14],this}setFromMatrix3(t){const s=t.elements;return this.set(s[0],s[3],s[6],0,s[1],s[4],s[7],0,s[2],s[5],s[8],0,0,0,0,1),this}extractBasis(t,s,e){return t.setFromMatrixColumn(this,0),s.setFromMatrixColumn(this,1),e.setFromMatrixColumn(this,2),this}makeBasis(t,s,e){return this.set(t.x,s.x,e.x,0,t.y,s.y,e.y,0,t.z,s.z,e.z,0,0,0,0,1),this}extractRotation(t){const s=this.elements,e=t.elements,i=1/E.setFromMatrixColumn(t,0).length(),r=1/E.setFromMatrixColumn(t,1).length(),h=1/E.setFromMatrixColumn(t,2).length();return s[0]=e[0]*i,s[1]=e[1]*i,s[2]=e[2]*i,s[3]=0,s[4]=e[4]*r,s[5]=e[5]*r,s[6]=e[6]*r,s[7]=0,s[8]=e[8]*h,s[9]=e[9]*h,s[10]=e[10]*h,s[11]=0,s[12]=0,s[13]=0,s[14]=0,s[15]=1,this}makeRotationFromEuler(t){t&&t.isEuler||console.error("THREE.Matrix4: .makeRotationFromEuler() now expects a Euler rotation rather than a Vector3 and order.");const s=this.elements,e=t.x,i=t.y,r=t.z,h=Math.cos(e),n=Math.sin(e),a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r);if("XYZ"===t.order){const t=h*l,e=h*c,i=n*l,r=n*c;s[0]=a*l,s[4]=-a*c,s[8]=o,s[1]=e+i*o,s[5]=t-r*o,s[9]=-n*a,s[2]=r-t*o,s[6]=i+e*o,s[10]=h*a}else if("YXZ"===t.order){const t=a*l,e=a*c,i=o*l,r=o*c;s[0]=t+r*n,s[4]=i*n-e,s[8]=h*o,s[1]=h*c,s[5]=h*l,s[9]=-n,s[2]=e*n-i,s[6]=r+t*n,s[10]=h*a}else if("ZXY"===t.order){const t=a*l,e=a*c,i=o*l,r=o*c;s[0]=t-r*n,s[4]=-h*c,s[8]=i+e*n,s[1]=e+i*n,s[5]=h*l,s[9]=r-t*n,s[2]=-h*o,s[6]=n,s[10]=h*a}else if("ZYX"===t.order){const t=h*l,e=h*c,i=n*l,r=n*c;s[0]=a*l,s[4]=i*o-e,s[8]=t*o+r,s[1]=a*c,s[5]=r*o+t,s[9]=e*o-i,s[2]=-o,s[6]=n*a,s[10]=h*a}else if("YZX"===t.order){const t=h*a,e=h*o,i=n*a,r=n*o;s[0]=a*l,s[4]=r-t*c,s[8]=i*c+e,s[1]=c,s[5]=h*l,s[9]=-n*l,s[2]=-o*l,s[6]=e*c+i,s[10]=t-r*c}else if("XZY"===t.order){const t=h*a,e=h*o,i=n*a,r=n*o;s[0]=a*l,s[4]=-c,s[8]=o*l,s[1]=t*c+r,s[5]=h*l,s[9]=e*c-i,s[2]=i*c-e,s[6]=n*l,s[10]=r*c+t}return s[3]=0,s[7]=0,s[11]=0,s[12]=0,s[13]=0,s[14]=0,s[15]=1,this}makeRotationFromQuaternion(t){return this.compose(k,t,S)}lookAt(t,s,e){const i=this.elements;return F.subVectors(t,s),0===F.lengthSq()&&(F.z=1),F.normalize(),v.crossVectors(e,F),0===v.lengthSq()&&(1===Math.abs(e.z)?F.x+=1e-4:F.z+=1e-4,F.normalize(),v.crossVectors(e,F)),v.normalize(),A.crossVectors(F,v),i[0]=v.x,i[4]=A.x,i[8]=F.x,i[1]=v.y,i[5]=A.y,i[9]=F.y,i[2]=v.z,i[6]=A.z,i[10]=F.z,this}multiply(t,s){return void 0!==s?(console.warn("THREE.Matrix4: .multiply() now only accepts one argument. Use .multiplyMatrices( a, b ) instead."),this.multiplyMatrices(t,s)):this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,s){const e=t.elements,i=s.elements,r=this.elements,h=e[0],n=e[4],a=e[8],o=e[12],l=e[1],c=e[5],u=e[9],y=e[13],m=e[2],x=e[6],_=e[10],z=e[14],p=e[3],M=e[7],d=e[11],w=e[15],g=i[0],f=i[4],b=i[8],E=i[12],C=i[1],k=i[5],S=i[9],v=i[13],A=i[2],F=i[6],T=i[10],R=i[14],V=i[3],q=i[7],P=i[11],L=i[15];return r[0]=h*g+n*C+a*A+o*V,r[4]=h*f+n*k+a*F+o*q,r[8]=h*b+n*S+a*T+o*P,r[12]=h*E+n*v+a*R+o*L,r[1]=l*g+c*C+u*A+y*V,r[5]=l*f+c*k+u*F+y*q,r[9]=l*b+c*S+u*T+y*P,r[13]=l*E+c*v+u*R+y*L,r[2]=m*g+x*C+_*A+z*V,r[6]=m*f+x*k+_*F+z*q,r[10]=m*b+x*S+_*T+z*P,r[14]=m*E+x*v+_*R+z*L,r[3]=p*g+M*C+d*A+w*V,r[7]=p*f+M*k+d*F+w*q,r[11]=p*b+M*S+d*T+w*P,r[15]=p*E+M*v+d*R+w*L,this}multiplyScalar(t){const s=this.elements;return s[0]*=t,s[4]*=t,s[8]*=t,s[12]*=t,s[1]*=t,s[5]*=t,s[9]*=t,s[13]*=t,s[2]*=t,s[6]*=t,s[10]*=t,s[14]*=t,s[3]*=t,s[7]*=t,s[11]*=t,s[15]*=t,this}determinant(){const t=this.elements,s=t[0],e=t[4],i=t[8],r=t[12],h=t[1],n=t[5],a=t[9],o=t[13],l=t[2],c=t[6],u=t[10],y=t[14];return t[3]*(+r*a*c-i*o*c-r*n*u+e*o*u+i*n*y-e*a*y)+t[7]*(+s*a*y-s*o*u+r*h*u-i*h*y+i*o*l-r*a*l)+t[11]*(+s*o*c-s*n*y-r*h*c+e*h*y+r*n*l-e*o*l)+t[15]*(-i*n*l-s*a*c+s*n*u+i*h*c-e*h*u+e*a*l)}transpose(){const t=this.elements;let s;return s=t[1],t[1]=t[4],t[4]=s,s=t[2],t[2]=t[8],t[8]=s,s=t[6],t[6]=t[9],t[9]=s,s=t[3],t[3]=t[12],t[12]=s,s=t[7],t[7]=t[13],t[13]=s,s=t[11],t[11]=t[14],t[14]=s,this}setPosition(t,s,e){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=s,i[14]=e),this}invert(){const t=this.elements,s=t[0],e=t[1],i=t[2],r=t[3],h=t[4],n=t[5],a=t[6],o=t[7],l=t[8],c=t[9],u=t[10],y=t[11],m=t[12],x=t[13],_=t[14],z=t[15],p=c*_*o-x*u*o+x*a*y-n*_*y-c*a*z+n*u*z,M=m*u*o-l*_*o-m*a*y+h*_*y+l*a*z-h*u*z,d=l*x*o-m*c*o+m*n*y-h*x*y-l*n*z+h*c*z,w=m*c*a-l*x*a-m*n*u+h*x*u+l*n*_-h*c*_,g=s*p+e*M+i*d+r*w;if(0===g)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const f=1/g;return t[0]=p*f,t[1]=(x*u*r-c*_*r-x*i*y+e*_*y+c*i*z-e*u*z)*f,t[2]=(n*_*r-x*a*r+x*i*o-e*_*o-n*i*z+e*a*z)*f,t[3]=(c*a*r-n*u*r-c*i*o+e*u*o+n*i*y-e*a*y)*f,t[4]=M*f,t[5]=(l*_*r-m*u*r+m*i*y-s*_*y-l*i*z+s*u*z)*f,t[6]=(m*a*r-h*_*r-m*i*o+s*_*o+h*i*z-s*a*z)*f,t[7]=(h*u*r-l*a*r+l*i*o-s*u*o-h*i*y+s*a*y)*f,t[8]=d*f,t[9]=(m*c*r-l*x*r-m*e*y+s*x*y+l*e*z-s*c*z)*f,t[10]=(h*x*r-m*n*r+m*e*o-s*x*o-h*e*z+s*n*z)*f,t[11]=(l*n*r-h*c*r-l*e*o+s*c*o+h*e*y-s*n*y)*f,t[12]=w*f,t[13]=(l*x*i-m*c*i+m*e*u-s*x*u-l*e*_+s*c*_)*f,t[14]=(m*n*i-h*x*i-m*e*a+s*x*a+h*e*_-s*n*_)*f,t[15]=(h*c*i-l*n*i+l*e*a-s*c*a-h*e*u+s*n*u)*f,this}scale(t){const s=this.elements,e=t.x,i=t.y,r=t.z;return s[0]*=e,s[4]*=i,s[8]*=r,s[1]*=e,s[5]*=i,s[9]*=r,s[2]*=e,s[6]*=i,s[10]*=r,s[3]*=e,s[7]*=i,s[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,s=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],e=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(s,e,i))}makeTranslation(t,s,e){return this.set(1,0,0,t,0,1,0,s,0,0,1,e,0,0,0,1),this}makeRotationX(t){const s=Math.cos(t),e=Math.sin(t);return this.set(1,0,0,0,0,s,-e,0,0,e,s,0,0,0,0,1),this}makeRotationY(t){const s=Math.cos(t),e=Math.sin(t);return this.set(s,0,e,0,0,1,0,0,-e,0,s,0,0,0,0,1),this}makeRotationZ(t){const s=Math.cos(t),e=Math.sin(t);return this.set(s,-e,0,0,e,s,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,s){const e=Math.cos(s),i=Math.sin(s),r=1-e,h=t.x,n=t.y,a=t.z,o=r*h,l=r*n;return this.set(o*h+e,o*n-i*a,o*a+i*n,0,o*n+i*a,l*n+e,l*a-i*h,0,o*a-i*n,l*a+i*h,r*a*a+e,0,0,0,0,1),this}makeScale(t,s,e){return this.set(t,0,0,0,0,s,0,0,0,0,e,0,0,0,0,1),this}makeShear(t,s,e,i,r,h){return this.set(1,e,r,0,t,1,h,0,s,i,1,0,0,0,0,1),this}compose(t,s,e){const i=this.elements,r=s._x,h=s._y,n=s._z,a=s._w,o=r+r,l=h+h,c=n+n,u=r*o,y=r*l,m=r*c,x=h*l,_=h*c,z=n*c,p=a*o,M=a*l,d=a*c,w=e.x,g=e.y,f=e.z;return i[0]=(1-(x+z))*w,i[1]=(y+d)*w,i[2]=(m-M)*w,i[3]=0,i[4]=(y-d)*g,i[5]=(1-(u+z))*g,i[6]=(_+p)*g,i[7]=0,i[8]=(m+M)*f,i[9]=(_-p)*f,i[10]=(1-(u+x))*f,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,s,e){const i=this.elements;let r=E.set(i[0],i[1],i[2]).length();const h=E.set(i[4],i[5],i[6]).length(),n=E.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),t.x=i[12],t.y=i[13],t.z=i[14],C.copy(this);const a=1/r,o=1/h,l=1/n;return C.elements[0]*=a,C.elements[1]*=a,C.elements[2]*=a,C.elements[4]*=o,C.elements[5]*=o,C.elements[6]*=o,C.elements[8]*=l,C.elements[9]*=l,C.elements[10]*=l,s.setFromRotationMatrix(C),e.x=r,e.y=h,e.z=n,this}makePerspective(t,s,e,i,r,h){void 0===h&&console.warn("THREE.Matrix4: .makePerspective() has been redefined and has a new signature. Please check the docs.");const n=this.elements,a=2*r/(s-t),o=2*r/(e-i),l=(s+t)/(s-t),c=(e+i)/(e-i),u=-(h+r)/(h-r),y=-2*h*r/(h-r);return n[0]=a,n[4]=0,n[8]=l,n[12]=0,n[1]=0,n[5]=o,n[9]=c,n[13]=0,n[2]=0,n[6]=0,n[10]=u,n[14]=y,n[3]=0,n[7]=0,n[11]=-1,n[15]=0,this}makeOrthographic(t,s,e,i,r,h){const n=this.elements,a=1/(s-t),o=1/(e-i),l=1/(h-r),c=(s+t)*a,u=(e+i)*o,y=(h+r)*l;return n[0]=2*a,n[4]=0,n[8]=0,n[12]=-c,n[1]=0,n[5]=2*o,n[9]=0,n[13]=-u,n[2]=0,n[6]=0,n[10]=-2*l,n[14]=-y,n[3]=0,n[7]=0,n[11]=0,n[15]=1,this}equals(t){const s=this.elements,e=t.elements;for(let t=0;t<16;t++)if(s[t]!==e[t])return!1;return!0}fromArray(t,s=0){for(let e=0;e<16;e++)this.elements[e]=t[e+s];return this}toArray(t=[],s=0){const e=this.elements;return t[s]=e[0],t[s+1]=e[1],t[s+2]=e[2],t[s+3]=e[3],t[s+4]=e[4],t[s+5]=e[5],t[s+6]=e[6],t[s+7]=e[7],t[s+8]=e[8],t[s+9]=e[9],t[s+10]=e[10],t[s+11]=e[11],t[s+12]=e[12],t[s+13]=e[13],t[s+14]=e[14],t[s+15]=e[15],t}}b.prototype.isMatrix4=!0;const E=new w,C=new b,k=new w(0,0,0),S=new w(1,1,1),v=new w,A=new w,F=new w;function T(t){const s=t.length/16,e=new b;e.fromArray(t,0),e.invert();const i=new b;for(let r=0;r<s;r++){const s=16*r;i.fromArray(t,s),i.premultiply(e),i.toArray(t,s)}}export{b as M,d as Q,n as e,T as n,m as t,o as w};
//# sourceMappingURL=shared.js.map
