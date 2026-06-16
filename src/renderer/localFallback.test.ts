import { describe, expect, it } from "vitest";
import { createLocalFallbackApi } from "./localFallback";
import type { AccountInput } from "../shared/types";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  readonly length = 0;

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("local fallback api", () => {
  it("persists saved accounts across api instances", async () => {
    const storage = new MemoryStorage();
    const input: AccountInput = {
      qqNumber: "20001",
      summary: "2000 500w 3甲2头 浏览器 aw80 皮肤",
      qqPassword: "secret",
      securityPhone: "13900000000",
      wechatId: "wx-browser",
      realName: "浏览器",
      coinAmountWan: 500,
      staminaLevel: 6,
      loadLevel: 5,
      armor6Count: 3,
      helmet6Count: 2,
      awAmmoCount: 80,
      skin: "皮肤",
      note: "刷新后保留",
      status: "待出租"
    };

    await createLocalFallbackApi(storage).saveAccount(input);
    const reopened = createLocalFallbackApi(storage);

    expect(await reopened.listAccounts()).toMatchObject([
      {
        qqNumber: "20001",
        summary: input.summary,
        note: "刷新后保留"
      }
    ]);
  });
});
