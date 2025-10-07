import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'uniaccess.js',
  output: {
    file: 'uniaccess.bundle.js',
    format: 'iife',
    name: 'UniAccess',
    sourcemap: true
  },
  plugins: [nodeResolve()],
};
