module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:sonarjs/recommended',
    'plugin:jsdoc/recommended'
  ],
  plugins: ['sonarjs', 'jsdoc'],
  rules: {
    'sonarjs/cognitive-complexity': ['error', 10],
    'no-unused-vars': ['warn'],
    'jsdoc/require-jsdoc': [
      'error',
      {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: true,
          FunctionExpression: true
        }
      }
    ],
    'jsdoc/require-param': 'error',
    'jsdoc/require-returns': 'error'
  }
};
