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

  it("keeps Windows packaging pointed at the leaf icon", () => {
    const projectRoot = path.resolve(__dirname, "../..");
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")) as {
      build: {
        extraResources: Array<{
          from: string;
          to: string;
        }>;
        win: {
          icon: string;
        };
        portable: {
          artifactName: string;
        };
      };
    };

    expect(packageJson.build.win.icon).toBe("build/assets/app-icon.ico");
    expect(packageJson.build.extraResources).toContainEqual({
      from: "build/assets",
      to: "build/assets"
    });
    expect(packageJson.build.portable.artifactName).toBe("${productName}-${version}-portable.${ext}");
    expect(fs.existsSync(path.join(projectRoot, packageJson.build.win.icon))).toBe(true);
  });
});
