import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const styles = readFileSync(resolve(__dirname, "styles.css"), "utf8");

describe("renderer style system", () => {
  it("defines the restrained workbench semantic tokens", () => {
    [
      "--surface-2",
      "--border-strong",
      "--hover",
      "--selected",
      "--warning",
      "--success",
      "--info"
    ].forEach((token) => {
      expect(styles).toContain(token);
    });
  });

  it("assigns a distinct visual treatment to every account status", () => {
    for (let index = 0; index < 5; index += 1) {
      expect(styles).toMatch(new RegExp(`\\.status-${index}\\s*\\{[^}]+background:[^}]+color:`, "s"));
    }
  });
});
