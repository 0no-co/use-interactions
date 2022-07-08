import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';
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

const plugin = {
  name: 'vite:contentlayer',
  async resolveId(id) {
    if (id === virtualModuleId) {
      await runContentlayerDev({
        configPath: path.resolve('.', 'contentlayer.config.ts'),
      });
      return resolvedVirtualModuleId;
    }
  },
  async load(id) {
    try {
      console.log(id === resolvedVirtualModuleId);
      if (id === resolvedVirtualModuleId) {
        console.log('running');
        console.log(
          path.resolve('.', '.contentlayer', 'generated', 'index.mjs')
        );
        const result = fs.readFileSync(
          path.resolve('.', '.contentlayer', 'generated', 'index.mjs'),
          'utf-8'
        );
        console.log(result);
        return 'export const allPosts = []';
      }
    } catch (e) {
      console.error(e);
    }
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), plugin],
});
