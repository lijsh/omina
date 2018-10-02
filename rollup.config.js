import buble from 'rollup-plugin-buble';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json'));

const input = 'src/index.js'
const plugins = [
  resolve(),
  commonjs(),
  buble()
]

const commonConf = {
  input,
  plugins,
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'es' }
  ]
}

const buildConf = {
  input,
  plugins: plugins.concat(uglify()),
  output: [
    { file: 'dist/wxa.min.js', format: 'cjs' },
  ]
}

export default [
  commonConf,
  buildConf
];
