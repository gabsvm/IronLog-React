// Minimal flat-config focused on accessibility (Phase 5.b of the revamp).
// Other lint concerns (TS correctness, React hooks) are handled by `npx tsc` and
// runtime behaviour; we use eslint here only to catch a11y regressions early.
//
// Usage: `npx eslint "{components,views,App.tsx}/**/*.{ts,tsx}"`
// Or wire `npm run lint` if you want it in CI.

import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
    {
        files: ['**/*.{ts,tsx}'],
        ignores: ['node_modules/**', 'dist/**', 'android/**', 'public/**', 'scripts/**'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
            globals: { ...globals.browser, ...globals.node },
        },
        plugins: {
            'jsx-a11y': jsxA11y,
            'react-hooks': reactHooks,
        },
        rules: {
            // ── React hooks (needed for the inline disable comments to resolve) ─
            'react-hooks/exhaustive-deps': 'warn',
            'react-hooks/rules-of-hooks': 'error',

            // ── A11y warnings (don't fail build, just nudge) ────────────────
            // Promote to "error" later once existing offenders are fixed.
            'jsx-a11y/alt-text': 'warn',
            'jsx-a11y/anchor-has-content': 'warn',
            'jsx-a11y/aria-props': 'error',
            'jsx-a11y/aria-proptypes': 'error',
            'jsx-a11y/aria-role': 'error',
            'jsx-a11y/aria-unsupported-elements': 'error',
            'jsx-a11y/click-events-have-key-events': 'off', // too noisy on touch-first UI
            'jsx-a11y/heading-has-content': 'warn',
            'jsx-a11y/iframe-has-title': 'warn',
            'jsx-a11y/img-redundant-alt': 'warn',
            'jsx-a11y/label-has-associated-control': 'off', // too noisy on bespoke form patterns
            'jsx-a11y/no-autofocus': 'off',                  // we use autofocus intentionally in modals
            'jsx-a11y/no-distracting-elements': 'error',
            'jsx-a11y/no-noninteractive-element-interactions': 'off',
            'jsx-a11y/no-redundant-roles': 'warn',
            'jsx-a11y/no-static-element-interactions': 'off', // ditto
            'jsx-a11y/role-has-required-aria-props': 'error',
            'jsx-a11y/role-supports-aria-props': 'warn',
            'jsx-a11y/scope': 'error',
            'jsx-a11y/tabindex-no-positive': 'warn',
        },
    },
];
