import resolve from "@rollup/plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import analyze from 'rollup-plugin-analyzer';
import alias from '@rollup/plugin-alias';

export default {
	input: "src/garden.js",
	preserveEntrySignatures: 'false',
	output: {
		dir: "build/",
		format: "esm",
		sourcemap: true,
		manualChunks: {
			// 'three': ['three'],
			'three': ['three/src/Three.js'],
		},
		chunkFileNames: '[name].js'
	},
	plugins: [
		alias({
			entries: [
				{ find: /^three$/, replacement: 'three/src/Three.js' },
			]
		}),
		resolve(),
		commonjs({
			include: ["node_modules/**"],
		}),
		terser(),
		analyze()
	],
	external: [
		"https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.js",
	],
};