import replace from '@rollup/plugin-replace';
import pkg from "./package.json";
import resolve from "@rollup/plugin-node-resolve";

export default {
	input: "src/handy-controls.js",
	output: {
		format: "iife",
		sourcemap: true,
		file: 'build/handy-controls.js',
	},
	plugins: [
		resolve(),
		replace({
			preventAssignment: true,
			'__version__': function () {
				return JSON.stringify(pkg.version)
			}
		})
	]
};
