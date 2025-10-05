const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          "paths": [
            {
              "name": "react-native",
              "importNames": ["Image"],
              "message": "Use ui/SafeImage instead of direct Image import to prevent empty URI warnings"
            }
          ]
        }
      ]
    }
  }
]);
