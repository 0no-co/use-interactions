import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';
import * as core from '@contentlayer/core';
import { errorToString } from '@contentlayer/utils';
import { E, pipe, S, T, OT } from '@contentlayer/utils/effect';

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

export const runContentlayerBuild = async ({ configPath }) => {
  if (contentlayerInitialized) return;
  contentlayerInitialized = true;

  await pipe(
    core.getConfig({ configPath }),
    T.chain(config => core.generateDotpkg({ config, verbose: false })),
    T.tap(core.logGenerateInfo),
    OT.withSpan('vite-contentlayer:runContentlayerBuild'),
    runMain
  );
};

let shouldBuild;

const plugin = ({ configPath }) => {
  return {
    name: 'vite:contentlayer',
    configResolved(config) {
      console.log('resolving config');
      shouldBuild = config.command === 'build' || config.isProduction;
    },
    async buildStart() {
      console.log('starting build', shouldBuild);
      if (shouldBuild) {
        await runContentlayerBuild({
          configPath,
        });
      } else {
        runContentlayerDev({
          configPath,
        });
      }
    },
    async resolveId(id, importer) {
      if (id === virtualModuleId) {
        return path.resolve('.', '.contentlayer', 'generated', 'index.mjs');
      } else if (importer === resolvedVirtualModuleId) {
        return path.resolve('.', '.contentlayer', 'generated', id);
      }
    },
  };
};

export default defineConfig({
  // @ts-ignore
  ssr: {
    noExternal: /./,
  },
  plugins: [
    preact(),
    plugin({ configPath: path.resolve('.', 'contentlayer.config.ts') }),
  ],
});
