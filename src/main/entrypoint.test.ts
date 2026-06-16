import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Electron entrypoint", () => {
  it("points package main at the compiled main process file", () => {
    const projectRoot = path.resolve(__dirname, "../..");
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")) as {
      main: string;
    };

    expect(packageJson.main).toBe("dist/main/main/main.js");
  });
});
