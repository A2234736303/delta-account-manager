import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AccountDatabase } from "./database";
import type { AccountInput } from "../shared/types";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("AccountDatabase persistence", () => {
  it("keeps saved accounts after reopening the sqlite file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "delta-account-db-"));
    tempDirs.push(dir);
    const dbPath = path.join(dir, "accounts.sqlite");
    const input: AccountInput = {
      qqNumber: "10001",
      summary: "1000 300w 2甲1头 测试 aw50 皮肤",
      qqPassword: "secret",
      securityPhone: "13800000000",
      wechatId: "wx-test",
      realName: "测试",
      coinAmountWan: 300,
      staminaLevel: 5,
      loadLevel: 4,
      armor6Count: 2,
      helmet6Count: 1,
      awAmmoCount: 50,
      skin: "皮肤",
      note: "持久化测试",
      status: "待出租"
    };

    const first = new AccountDatabase(dbPath);
    first.upsertAccount(input);
    first.close();

    const second = new AccountDatabase(dbPath);
    const accounts = second.listAccounts();
    second.close();

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({
      qqNumber: "10001",
      summary: input.summary,
      note: "持久化测试",
      status: "待出租"
    });
  });
});
