import { readFileSync } from 'fs';
import * as path from 'path';

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import cjsCheck from 'rollup-plugin-cjs-check';
import dts from 'rollup-plugin-dts';

const cwd = process.cwd();
const pkg = JSON.parse(readFileSync(path.resolve(cwd, './package.json'), 'utf-8'));

export const externalModules = ['dns', 'fs', 'path', 'url'];
if (pkg.peerDependencies)
  externalModules.push(...Object.keys(pkg.peerDependencies));
if (pkg.dependencies) externalModules.push(...Object.keys(pkg.dependencies));

const externalPredicate = new RegExp(`^(${externalModules.join('|')})($|/)`);

const terserPretty = terser({
  warnings: true,
  ecma: 2015,
  keep_fnames: true,
  ie8: false,
  compress: {
    pure_getters: true,
    toplevel: true,
    booleans_as_integers: false,
    keep_fnames: true,
    keep_fargs: true,
    if_return: false,
    ie8: false,
    sequences: false,
    loops: false,
    conditionals: false,
    join_vars: false
  },
  mangle: {
    module: true,
    keep_fnames: true,
  },
  output: {
    comments: false,
    beautify: true,
    braces: true,
    indent_level: 2
  }
});

const terserMinified = terser({
  warnings: true,
  ecma: 2015,
  ie8: false,
  toplevel: true,
  compress: {
    keep_infinity: true,
    pure_getters: true,
    passes: 10
  },
  mangle: {
    module: true,
  },
  output: {
    comments: false
  }
});

const commonPlugins = [
  resolve({
    extensions: ['.mjs', '.js', '.ts'],
    mainFields: ['module', 'jsnext', 'main'],
    preferBuiltins: false,
    browser: true,
  }),

  commonjs({
    ignoreGlobal: true,
    include: /\/node_modules\//,
    extensions: ['.mjs', '.js', '.ts'],
  }),
];

const output = ({ format, isProduction }) => {
  if (typeof isProduction !== 'boolean')
    throw new Error('Invalid option `isProduction` at output({ ... })');
  if (format !== 'cjs' && format !== 'esm')
    throw new Error('Invalid option `format` at output({ ... })');

  let extension = format === 'esm'
    ? '.es.js'
    : '.js';
  if (isProduction) {
    extension = '.min' + extension;
  }

  return {
    entryFileNames: `[name]${extension}`,
    dir: './dist',
    exports: 'named',
    sourcemap: true,
    sourcemapExcludeSources: false,
    hoistTransitiveImports: false,
    indent: false,
    freeze: false,
    strict: false,
    format,
    plugins: [
      cjsCheck({ extension }),
      isProduction ? terserMinified : terserPretty,
    ],
    // NOTE: All below settings are important for cjs-module-lexer to detect the export
    // When this changes (and terser mangles the output) this will interfere with Node.js ESM intercompatibility
    esModule: format !== 'esm',
    externalLiveBindings: format !== 'esm',
    generatedCode: {
      preset: 'es5',
      reservedNamesAsProps: false,
      objectShorthand: false,
      constBindings: false,
    },
  };
};

const commonConfig = {
  input: {
    'use-interactions': './src/index.ts',
  },
  external(id) {
    return externalPredicate.test(id);
  },
  onwarn() {},
  treeshake: {
    unknownGlobalSideEffects: false,
    tryCatchDeoptimization: false,
    moduleSideEffects: false,
  },
};

export default [
  {
    ...commonConfig,
    plugins: [
      ...commonPlugins,
      babel({
        babelrc: false,
        babelHelpers: 'bundled',
        extensions: ['js', 'jsx', 'ts', 'tsx'],
        exclude: 'node_modules/**',
        presets: [],
        plugins: [
          '@babel/plugin-transform-typescript',
          '@babel/plugin-transform-block-scoping',
        ],
      }),
    ],
    output: [
      output({ format: 'cjs', isProduction: false }),
      output({ format: 'esm', isProduction: false }),
      output({ format: 'cjs', isProduction: true }),
      output({ format: 'esm', isProduction: true }),
    ],
  },
  {
    ...commonConfig,
    input: {
      'use-interactions': './src/index.ts',
    },
    plugins: [
      ...commonPlugins,
      dts({
        compilerOptions: {
          preserveSymlinks: false,
        },
      }),
    ],
    output: {
      minifyInternalExports: false,
      entryFileNames: '[name].d.ts',
      dir: './dist',
    },
  },
];
