/**
 * Rewrites a generated .docx so `[Content_Types].xml` is the first entry and
 * there are no directory entries.
 *
 * The OPC spec requires the content-types part to come first in the archive.
 * Word tolerates the docx-js output as it comes; LibreOffice refuses to open it
 * outright ("source file could not be loaded"), and so do several Android
 * document viewers — which is most of this pack's audience. Cheaper to repack
 * than to find out from a student whose phone will not open the template.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function repack(path) {
  const dir = mkdtempSync(join(tmpdir(), "docx-repack-"));
  try {
    execFileSync("unzip", ["-q", path, "-d", dir]);
    // `-X` drops extra file attributes; the content types part is added first
    // and then everything else, with -D suppressing directory entries.
    execFileSync("zip", ["-q", "-X", "-D", "../out.zip", "[Content_Types].xml"], { cwd: dir });
    execFileSync("zip", ["-q", "-X", "-D", "-r", "../out.zip", "."], { cwd: dir });
    writeFileSync(path, readFileSync(join(dir, "..", "out.zip")));
    rmSync(join(dir, "..", "out.zip"), { force: true });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
