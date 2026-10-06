import tseslint from "typescript-eslint";
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "test-results/**",
      "tests/.generated/**",
    ],
  },
  ...tseslint.configs.recommended,
);
