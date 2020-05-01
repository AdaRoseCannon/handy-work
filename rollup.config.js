import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'src/main.js',
    output: {
        file: 'build/garden.js',
        format: 'esm'
    },
    plugins: [ resolve() ],
    external: ['https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.js']
};