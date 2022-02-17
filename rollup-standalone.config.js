import replace from '@rollup/plugin-replace';
import { execSync } from 'child_process';
import { terser } from "rollup-plugin-terser";

const handposeWorkerCompileCmd = `./node_modules/.bin/rollup -f esm -p "rollup-plugin-terser" ./build/esm/handpose.js`;
const handposeSrc = '`\n' + execSync(handposeWorkerCompileCmd) + '`';

export default {
	input: "build/esm/handy-work.js",
	output: {
		format: "esm",
		sourcemap: true,
		file: 'build/esm/handy-work.standalone.js',
	},
	plugins: [
		replace({
			preventAssignment: false,
			'var comlinkHandPose': function () {
				return `const comlinkHandPose =  wrap(new Worker( URL.createObjectURL( new Blob( [ ${ handposeSrc } ] )) )); //`;
			}
		}),
		terser()
	]
};
