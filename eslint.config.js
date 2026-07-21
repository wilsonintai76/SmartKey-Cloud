import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import * as firebaseRulesParser from '@firebase/eslint-plugin-security-rules/parser';

export default [
  {
    ignores: ['dist/**/*']
  },
  {
    files: ['*.rules'],
    plugins: {
      '@firebase/security-rules': firebaseRulesPlugin,
    },
    languageOptions: {
      parser: firebaseRulesParser,
    },
    rules: {
      ...firebaseRulesPlugin.configs['flat/recommended'].rules,
    },
  },
];
