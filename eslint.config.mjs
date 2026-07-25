import eslint from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ahmodusPlugin = {
  rules: {
    'import-groups': {
      meta: {
        docs: {
          description:
            'Require external imports before internal imports, separated by a blank line.',
        },
        fixable: 'whitespace',
        messages: {
          externalFirst: 'External imports must appear before internal imports.',
          missingBlankLine:
            'Add one blank line between external and internal imports.',
        },
        schema: [],
        type: 'layout',
      },
      create(context) {
        const sourceCode = context.sourceCode;
        let lastExternalImport;
        let seenInternalImport = false;

        const isInternalImport = (moduleName) =>
          moduleName.startsWith('.') ||
          moduleName.startsWith('/') ||
          moduleName.startsWith('@/') ||
          moduleName.startsWith('src/');

        return {
          ImportDeclaration(node) {
            const moduleName = node.source.value;

            if (typeof moduleName !== 'string') {
              return;
            }

            if (!isInternalImport(moduleName)) {
              if (seenInternalImport) {
                context.report({
                  messageId: 'externalFirst',
                  node,
                });
              }

              lastExternalImport = node;
              return;
            }

            if (!seenInternalImport && lastExternalImport) {
              const textBetweenImports = sourceCode.text.slice(
                lastExternalImport.range[1],
                node.range[0],
              );

              if (!/\r?\n\s*\r?\n/u.test(textBetweenImports)) {
                context.report({
                  fix(fixer) {
                    return fixer.insertTextBefore(node, '\n');
                  },
                  messageId: 'missingBlankLine',
                  node,
                });
              }
            }

            seenInternalImport = true;
          },
        };
      },
    },
  },
};

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['scripts/*.ts', '*.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  prettierRecommended,
  {
    plugins: {
      ahmodus: ahmodusPlugin,
    },
    rules: {
      'ahmodus/import-groups': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
    },
  },
);
