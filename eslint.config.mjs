// eslint-config-next 16 ships native flat configs, so no FlatCompat shim.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    // scripts/ is plain Node with no TS project attached.
    ignores: [".next/**", "node_modules/**", "out/**", "scripts/**"],
  },
];

export default config;
