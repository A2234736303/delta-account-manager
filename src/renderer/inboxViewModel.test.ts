import { describe, expect, it } from "vitest";
import { buildInboxGroups, thresholdLabel } from "./inboxViewModel";
import type { Account, Reminder } from "../shared/types";

const account: Account = {
  qqNumber: "10001",
  summary: "一段很长很长的首页简述，也应该只作为摘要显示",
  qqPassword: "",
  securityPhone: "",
  wechatId: "",
  realName: "",
  coinAmountWan: 0,
  staminaLevel: 0,
  loadLevel: 0,
  armor6Count: 0,
  helmet6Count: 0,
  awAmmoCount: 0,
  skin: "",
  note: "需要优先处理",
  status: "待出租",
  statusStartedAt: "2026-06-14T00:00:00.000Z",
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z"
};

describe("buildInboxGroups", () => {
  it("uses current account data instead of stale reminder summary", () => {
    const reminders: Reminder[] = [
      {
        id: 1,
        accountQqNumber: "10001",
        accountSummary: "旧首页简述",
        status: "待出租",
        threshold: "2d",
        triggeredAt: "2026-06-16T00:00:00.000Z",
        readAt: null,
        handledAt: null
      }
    ];

    expect(buildInboxGroups([account], reminders, "2026-06-16T03:00:00.000Z")).toEqual([
      {
        status: "待出租",
        items: [
          expect.objectContaining({
            title: "QQ 10001",
            summary: account.summary,
            ruleLabel: "第 2 天提醒已到达",
            durationLabel: "已持续 2天 3小时 0分钟",
            notePreview: "需要优先处理"
          })
        ]
      }
    ]);
  });

  it("keeps deleted account reminders actionable", () => {
    const reminders: Reminder[] = [
      {
        id: 2,
        accountQqNumber: "20002",
        accountSummary: "已删除账号",
        status: "冷号中",
        threshold: "3d12h",
        triggeredAt: "2026-06-16T00:00:00.000Z",
        readAt: null,
        handledAt: null
      }
    ];

    expect(buildInboxGroups([], reminders, "2026-06-16T03:00:00.000Z")[0].items[0]).toMatchObject({
      title: "QQ 20002",
      summary: "账号已删除",
      ruleLabel: "第 3 天 12 小时提醒已到达",
      durationLabel: "账号已删除"
    });
  });
});

describe("thresholdLabel", () => {
  it("formats day and day-hour thresholds as reminder rules", () => {
    expect(thresholdLabel("7d")).toBe("第 7 天");
    expect(thresholdLabel("3d12h")).toBe("第 3 天 12 小时");
  });
});
