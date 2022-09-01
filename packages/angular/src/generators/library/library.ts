import {
  addDependenciesToPackageJson,
  formatFiles,
  installPackagesTask,
  moveFilesToNewDirectory,
  removeDependenciesFromPackageJson,
  Tree,
} from '@nrwl/devkit';
import { wrapAngularDevkitSchematic } from '@nrwl/devkit/ngcli-adapter';
import { jestProjectGenerator } from '@nrwl/jest';
import { Linter } from '@nrwl/linter';
import { convertToNxProjectGenerator } from '@nrwl/workspace/generators';
import init from '../../generators/init/init';
import { E2eTestRunner } from '../../utils/test-runners';
import { ngPackagrVersion } from '../../utils/versions';
import addLintingGenerator from '../add-linting/add-linting';
import karmaProjectGenerator from '../karma-project/karma-project';
import setupTailwindGenerator from '../setup-tailwind/setup-tailwind';
import { addBuildableLibrariesPostCssDependencies } from '../utils/dependencies';
import { addModule } from './lib/add-module';
import {
  enableStrictTypeChecking,
  setLibraryStrictDefault,
} from './lib/enable-strict-type-checking';
import { normalizeOptions } from './lib/normalize-options';
import { NormalizedSchema } from './lib/normalized-schema';
import { updateLibPackageNpmScope } from './lib/update-lib-package-npm-scope';
import { updateProject } from './lib/update-project';
import { updateTsConfig } from './lib/update-tsconfig';
import { addStandaloneComponent } from './lib/add-standalone-component';
import { Schema } from './schema';

export async function libraryGenerator(tree: Tree, schema: Partial<Schema>) {
  // Do some validation checks
  if (!schema.routing && schema.lazy) {
    throw new Error(`To use "--lazy" option, "--routing" must also be set.`);
  }

  if (schema.publishable === true && !schema.importPath) {
    throw new Error(
      `For publishable libs you have to provide a proper "--importPath" which needs to be a valid npm package name (e.g. my-awesome-lib or @myorg/my-lib)`
    );
  }

  if (schema.addTailwind && !schema.buildable && !schema.publishable) {
    throw new Error(
      `To use "--addTailwind" option, you have to set either "--buildable" or "--publishable".`
    );
  }

  const options = normalizeOptions(tree, schema);

  await init(tree, {
    ...options,
    skipFormat: true,
    e2eTestRunner: E2eTestRunner.None,
  });

  const runAngularLibrarySchematic = wrapAngularDevkitSchematic(
    '@schematics/angular',
    'library'
  );
  await runAngularLibrarySchematic(tree, {
    name: options.name,
    prefix: options.prefix,
    entryFile: 'index',
    skipPackageJson:
      options.skipPackageJson || !(options.publishable || options.buildable),
    skipTsConfig: true,
  });

  if (options.ngCliSchematicLibRoot !== options.projectRoot) {
    moveFilesToNewDirectory(
      tree,
      options.ngCliSchematicLibRoot,
      options.projectRoot
    );
  }
  await updateProject(tree, options);
  updateTsConfig(tree, options);
  await addUnitTestRunner(tree, options);
  updateNpmScopeIfBuildableOrPublishable(tree, options);

  if (!options.standalone) {
    addModule(tree, options);
  } else {
    await addStandaloneComponent(tree, options);
  }

  setStrictMode(tree, options);
  await addLinting(tree, options);

  if (options.addTailwind) {
    await setupTailwindGenerator(tree, {
      project: options.name,
      skipFormat: true,
    });
  }

  if (options.buildable || options.publishable) {
    removeDependenciesFromPackageJson(tree, [], ['ng-packagr']);
    addDependenciesToPackageJson(
      tree,
      {},
      {
        'ng-packagr': ngPackagrVersion,
      }
    );
    addBuildableLibrariesPostCssDependencies(tree);
  }

  if (options.standaloneConfig) {
    await convertToNxProjectGenerator(tree, {
      project: options.name,
      all: false,
      skipFormat: true,
    });
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return () => {
    installPackagesTask(tree);
  };
}

async function addUnitTestRunner(host: Tree, options: NormalizedSchema) {
  if (options.unitTestRunner === 'jest') {
    await jestProjectGenerator(host, {
      project: options.name,
      setupFile: 'angular',
      supportTsx: false,
      skipSerializers: false,
      skipFormat: true,
    });
  } else if (options.unitTestRunner === 'karma') {
    await karmaProjectGenerator(host, {
      project: options.name,
      skipFormat: true,
    });
  }
}

function updateNpmScopeIfBuildableOrPublishable(
  host: Tree,
  options: NormalizedSchema
) {
  if (options.buildable || options.publishable) {
    updateLibPackageNpmScope(host, options);
  }
}

function setStrictMode(host: Tree, options: NormalizedSchema) {
  if (options.strict) {
    enableStrictTypeChecking(host, options);
  } else {
    setLibraryStrictDefault(host, options.strict);
  }
}

async function addLinting(host: Tree, options: NormalizedSchema) {
  if (options.linter === Linter.None) {
    return;
  }
  await addLintingGenerator(host, {
    projectName: options.name,
    projectRoot: options.projectRoot,
    prefix: options.prefix,
    unitTestRunner: options.unitTestRunner,
    setParserOptionsProject: options.setParserOptionsProject,
    skipFormat: true,
  });
}

export default libraryGenerator;
