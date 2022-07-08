import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';
import fs from 'fs';
import * as core from '@contentlayer/core';
import { errorToString } from '@contentlayer/utils';
import { E, pipe, S, T } from '@contentlayer/utils/effect';

const virtualModuleId = 'virtual:contentlayer/generated';
const resolvedVirtualModuleId = '\0' + virtualModuleId;
let contentlayerInitialized = false;

const runMain = core.runMain({
  tracingServiceName: 'vite-contentlayer',
  verbose: process.env.CL_DEBUG !== undefined,
});

const runContentlayerDev = async ({ configPath }) => {
  if (contentlayerInitialized) return;
  contentlayerInitialized = true;

  await pipe(
    core.getConfigWatch({ configPath }),
    S.tapSkipFirstRight(() =>
      T.log(
        `Contentlayer config change detected. Updating type definitions and data...`
      )
    ),
    S.tapRight(config =>
      config.source.options.disableImportAliasWarning
        ? T.unit
        : T.fork(core.validateTsconfig)
    ),
    S.chainSwitchMapEitherRight(config =>
      core.generateDotpkgStream({ config, verbose: false, isDev: true })
    ),
    S.tap(E.fold(error => T.log(errorToString(error)), core.logGenerateInfo)),
    S.runDrain,
    runMain
  );
};

// TODO: actual build step

const plugin = {
  name: 'vite:contentlayer',
  async buildStart() {
    runContentlayerDev({
      configPath: path.resolve('.', 'contentlayer.config.ts'),
    });
  },
  async resolveId(id, importer) {
    if (id === virtualModuleId) {
      return resolvedVirtualModuleId;
    } else if (importer === resolvedVirtualModuleId) {
      return path.resolve('.', '.contentlayer', 'generated', id);
    }
  },
  async load(id) {
    if (id === resolvedVirtualModuleId) {
      return fs.readFileSync(
        path.resolve('.', '.contentlayer', 'generated', 'index.mjs'),
        'utf-8'
      );
    }
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), plugin],
});
