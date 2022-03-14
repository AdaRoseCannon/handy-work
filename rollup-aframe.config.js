import replace from '@rollup/plugin-replace';
import pkg from "./package.json";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import strip from '@rollup/plugin-strip';

export default [

	{
		input: "src/handy-controls.js",
		output: {
			format: "iife",
			sourcemap: true,
			file: 'build/handy-controls.js',
		},
		plugins: [
			strip({labels: ['documentation']}),
			resolve(),
			replace({
				preventAssignment: true,
				'__version__': function () {
					return JSON.stringify(pkg.version)
				}
			})
		]
	},
	{
		input: "src/handy-controls.js",
		output: {
			format: "iife",
			sourcemap: true,
			file: 'build/handy-controls.min.js',
		},
		plugins: [
			strip({labels: ['documentation']}),
			resolve(),
			replace({
				preventAssignment: true,
				'__version__': function () {
					return JSON.stringify(pkg.version)
				}
			}),
			terser()
		]
	},
	{	
		input: "src/magnet-helpers.js",
		output: {
			format: "iife",
			sourcemap: true,
			file: 'build/magnet-helpers.js',
		}
	},
	{	
		input: "src/magnet-helpers.js",
		output: {
			format: "iife",
			sourcemap: true,
			file: 'build/magnet-helpers.min.js',
		},
		plugins: [
			strip({labels: ['documentation']}),
			terser()
		]
	},
];
