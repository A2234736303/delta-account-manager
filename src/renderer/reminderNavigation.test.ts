import { describe, expect, it } from "vitest";
import { getReminderNavigationTarget } from "./reminderNavigation";
import type { Reminder } from "../shared/types";

describe("getReminderNavigationTarget", () => {
  it("uses the reminder account and status as the list navigation target", () => {
    const reminder: Reminder = {
      id: 1,
      accountQqNumber: "123456",
      accountSummary: "提醒账号",
      status: "待出租",
      threshold: "2d",
      triggeredAt: "2026-06-16T00:00:00.000Z",
      readAt: null,
      handledAt: null
    };

    expect(getReminderNavigationTarget(reminder)).toEqual({
      accountQqNumber: "123456",
      statusFilter: "待出租"
    });
  });
});
