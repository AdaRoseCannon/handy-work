import resolve from "@rollup/plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
// import { terser } from "rollup-plugin-terser";
import analyze from 'rollup-plugin-analyzer';
import alias from '@rollup/plugin-alias';
// import del from 'rollup-plugin-delete'
// import serve from 'rollup-plugin-serve';
import comlink from "@surma/rollup-plugin-comlink";
import OMT from "@surma/rollup-plugin-off-main-thread";

export default {
	input: "src/handy-work.js",
	preserveEntrySignatures: 'false',
	output: {
		dir: "build/esm/",
		format: "esm",
		sourcemap: true,
		manualChunks: {
			'shared': ['three/src/Three.js', 'comlink', './src/normalize.js']
		},
		chunkFileNames: '[name].js'
	},
	plugins: [
		alias({
			entries: [
				{ find: /^three$/, replacement: 'three/src/Three.js' }
			]
		}),
		comlink({
			useModuleWorker: true
		}),
		OMT({}),
		resolve(),
		commonjs({
			include: ["node_modules/**"],
		}),
		// terser(),
		analyze(),
		// serve({
		// 	open: true,
		// 	host: 'localhost',
		// 	port: 9001,
		// 	mimeTypes: {
		// 		'application/javascript': ['js_commonjs-proxy']
		// 	}
		// })
	]
};
