import replace from '@rollup/plugin-replace';
import { execSync } from 'child_process';
import { terser } from "rollup-plugin-terser";
import path from 'path';

const rollupPath = path.resolve('./node_modules/.bin/rollup');
const handPoseEsmBuildPath = path.resolve('./build/esm/handpose.js');
const handposeWorkerCompileCmd = `${rollupPath} -f esm -p "rollup-plugin-terser" ${handPoseEsmBuildPath}`;
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
