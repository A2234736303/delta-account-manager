import { describe, expect, it } from "vitest";
import {
  filterAccounts,
  formatDuration,
  generateDueReminders,
  getStatusDuration,
  sortAccounts
} from "./domain";
import type { Account, Reminder } from "./types";

const baseAccount: Account = {
  qqNumber: "123456789",
  summary: "1234 300w 2甲1头 张三 aw50 皮肤",
  qqPassword: "pass",
  securityPhone: "13800000000",
  wechatId: "wx-test",
  realName: "张三",
  coinAmountWan: 300,
  staminaLevel: 5,
  loadLevel: 4,
  armor6Count: 2,
  helmet6Count: 1,
  awAmmoCount: 50,
  skin: "皮肤",
  note: "备注",
  status: "跑刀中",
  statusStartedAt: "2026-06-01T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z"
};

describe("domain rules", () => {
  it("generates due reminders once per account, status, and threshold", () => {
    const now = "2026-06-08T00:00:00.000Z";
    const existing: Reminder[] = [
      {
        id: 1,
        accountQqNumber: "123456789",
        accountSummary: baseAccount.summary,
        status: "跑刀中",
        threshold: "5d",
        triggeredAt: "2026-06-06T00:00:00.000Z",
        readAt: null,
        handledAt: null
      }
    ];

    const reminders = generateDueReminders([baseAccount], existing, now);

    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({
      accountQqNumber: "123456789",
      status: "跑刀中",
      threshold: "7d"
    });
  });

  it("does not create reminders for status without configured thresholds", () => {
    const account = { ...baseAccount, status: "代练中" as const };

    expect(generateDueReminders([account], [], "2026-06-12T00:00:00.000Z")).toEqual([]);
  });

  it("filters accounts by summary only", () => {
    const accounts = [
      baseAccount,
      { ...baseAccount, qqNumber: "987", summary: "9876 待出租 李四", realName: "李四" }
    ];

    expect(filterAccounts(accounts, "待出租").map((account) => account.qqNumber)).toEqual(["987"]);
    expect(filterAccounts(accounts, "张三")).toEqual([baseAccount]);
    expect(filterAccounts(accounts, "李四").map((account) => account.qqNumber)).toEqual(["987"]);
  });

  it("sorts accounts by configured status order and then summary", () => {
    const accounts: Account[] = [
      { ...baseAccount, qqNumber: "3", summary: "c", status: "冷号中" },
      { ...baseAccount, qqNumber: "2", summary: "b", status: "代练中" },
      { ...baseAccount, qqNumber: "1", summary: "a", status: "跑刀中" }
    ];

    expect(sortAccounts(accounts).map((account) => account.qqNumber)).toEqual(["2", "1", "3"]);
  });

  it("formats live status duration from the last status switch time", () => {
    expect(getStatusDuration(baseAccount, "2026-06-02T02:30:00.000Z")).toEqual({
      days: 1,
      hours: 2,
      minutes: 30
    });
    expect(formatDuration({ days: 1, hours: 2, minutes: 30 })).toBe("1天 2小时 30分钟");
  });
});
