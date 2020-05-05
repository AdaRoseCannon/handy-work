import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    input: 'src/main.js',
    output: {
        file: 'build/garden.js',
        format: 'esm'
    },
    plugins: [ resolve(), commonjs({
        include: ['node_modules/**']
    }) ],
    external: ['https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.js']
};