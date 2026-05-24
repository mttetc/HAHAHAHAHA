import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Each feature is intentionally scoped to one page for now — the project is small
    // and these slices represent real user interactions worth keeping isolated.
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
]);
