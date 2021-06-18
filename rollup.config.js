import resolve from "@rollup/plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import analyze from 'rollup-plugin-analyzer';
import alias from '@rollup/plugin-alias';
import del from 'rollup-plugin-delete'
import comlink from "@surma/rollup-plugin-comlink";
import omt from "@surma/rollup-plugin-off-main-thread";

export default {
	input: "src/index.js",
	preserveEntrySignatures: 'false',
	output: {
		dir: "build/",
		format: "esm",
		sourcemap: true,
		manualChunks: {
			// 'three': ['three'],
			'three': ['three/src/Three.js'],
			'garden': ['./src/garden.js'],
			'shared': ['comlink', './src/lib/controllers/hand-poses/normalize.js'],
			// 'comlink': ['comlink'],
			// 'three-stdlib': ['three-stdlib'],
			// 'tween': ['@tweenjs/tween.js'],
		},
		chunkFileNames: '[name]-[hash].js'
	},
	plugins: [
		del({
			targets: 'build/*'
		}),
		alias({
			entries: [
				{ find: /^three$/, replacement: 'three/src/Three.js' }
			]
		}),
		comlink({
			useModuleWorker: true
		}), omt(),
		resolve(),
		commonjs({
			include: ["node_modules/**"],
		}),
		// terser(),
		analyze(),
	],
	external: [
		"https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.js",
	],
};