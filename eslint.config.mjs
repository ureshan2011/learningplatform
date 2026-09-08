// eslint-config-next 16 ships native flat configs, so no FlatCompat shim.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    // scripts/ is plain Node with no TS project attached.
    //
    // docs/design-system/ is the supplied design-system brief — illustrative
    // JSX from an external document, not code this project compiles, imports
    // or maintains. Linting it fails the build on someone else's snippet
    // (Button.jsx references an `Arrow` it re-exports but never imports) and
    // otherwise only produces advice about a reference file nobody ships.
    ignores: [".next/**", "node_modules/**", "out/**", "scripts/**", "docs/**"],
  },
];

export default config;
