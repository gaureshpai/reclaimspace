import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

describe("npm executable export", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
  const executable = path.join(process.cwd(), packageJson.bin.reclaimspace);

  it("exports the minified executable and includes it in the npm package", () => {
    expect(packageJson.bin.reclaimspace).toBe("dist/reclaimspace.min.js");
    expect(packageJson.files).toContain("dist/");
    expect(fs.existsSync(executable)).toBe(true);
    expect(fs.readFileSync(executable, "utf8")).toMatch(/^#!\/usr\/bin\/env node\n/);
  });

  it("runs the minified executable with the same CLI contract", () => {
    const result = spawnSync(process.execPath, [executable, "--version"], {
      encoding: "utf8",
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(packageJson.version);
  });
});
