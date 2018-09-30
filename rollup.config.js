import buble from 'rollup-plugin-buble';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json'));

export default {
  input: 'src/index.js',
  plugins: [
    resolve(),
    commonjs(),
    buble()
  ],
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'es' },
  ]
};
