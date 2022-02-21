import replace from '@rollup/plugin-replace';
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

export default {
	input: "src/handy-controls.js",
	output: {
		format: "iife",
		sourcemap: true,
		file: 'build/handy-controls.min.js',
	},
	plugins: [
		replace({
			preventAssignment: true,
			'__version__': function () {
				return JSON.stringify(pkg.version)
			}
		}),
		terser()
	]
};
