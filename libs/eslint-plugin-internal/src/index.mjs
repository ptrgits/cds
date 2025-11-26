import exampleScreenDefaultRule from './example-screen-default/index.mjs';
import exampleSingleChildRule from './example-single-child/index.mjs';
import safelySpreadPropsRule from './safely-spread-props/index.mjs';
import importAutofixRule from './import-autofix.mjs';

const plugin = {
  name: '@coinbase/eslint-plugin-internal',
  rules: {
    'import-autofix': importAutofixRule,
    'safely-spread-props': safelySpreadPropsRule,
    'example-screen-default': exampleScreenDefaultRule,
    'example-single-child': exampleSingleChildRule,
  },
  configs: {},
};

Object.assign(plugin.configs, {
  importRules: {
    plugins: {
      internal: plugin,
    },
    rules: {
      'internal/import-autofix': 'error',
    },
  },
  typedRules: {
    plugins: {
      internal: plugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 'internal/safely-spread-props': ['error', { maxInvalidPropsInMessage: 5 }],
    },
  },
  mobileStoryRules: {
    plugins: {
      internal: plugin,
    },
    rules: {
      'internal/example-screen-default': 'warn',
      'internal/example-single-child': 'warn',
    },
  },
});

export default plugin;
