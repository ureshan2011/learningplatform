/**
 * Puts pdf.js's worker where the browser can fetch it.
 *
 * The in-app document reader (`components/content/DocumentViewer.tsx`) runs
 * pdf.js in a worker, and pdf.js needs a URL for it. Letting the bundler
 * resolve that URL from inside `node_modules` works in some setups and fails
 * silently in others — the reader then renders nothing and says only "could
 * not open document". Copying the file into `public/` is boring and always
 * works, whichever bundler is in front of it.
 *
 * Runs as `prebuild`, so `npm run build` picks it up with no extra step and
 * App Hosting needs no configuration. The copy is gitignored: it is a build
 * artifact of a pinned dependency, not source.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

// Resolved through the package rather than by path, so a pdfjs-dist upgrade
// that moves the file fails loudly here instead of at runtime in a student's
// browser.
const entry = require.resolve("pdfjs-dist/package.json");
const source = join(dirname(entry), "build", "pdf.worker.min.mjs");
const destination = join(process.cwd(), "public", "pdf.worker.min.mjs");

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);

console.log(`[pdf] worker copied to public/${destination.split("/").pop()}`);
