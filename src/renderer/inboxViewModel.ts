import { formatDuration, getStatusDuration } from "../shared/domain";
import { STATUSES, type Account, type AccountStatus, type Reminder } from "../shared/types";

export type InboxReminderItem = {
  reminder: Reminder;
  account: Account | null;
  title: string;
  summary: string;
  status: AccountStatus;
  ruleLabel: string;
  durationLabel: string;
  notePreview: string;
};

export type InboxReminderGroup = {
  status: AccountStatus;
  items: InboxReminderItem[];
};

export function buildInboxGroups(
  accounts: Account[],
  reminders: Reminder[],
  nowIso: string
): InboxReminderGroup[] {
  const accountByQq = new Map(accounts.map((account) => [account.qqNumber, account]));
  const openItems = reminders
    .filter((reminder) => !reminder.handledAt)
    .map((reminder) => {
      const account = accountByQq.get(reminder.accountQqNumber) ?? null;
      return {
        reminder,
        account,
        title: account ? `QQ ${account.qqNumber}` : `QQ ${reminder.accountQqNumber}`,
        summary: account?.summary ?? "账号已删除",
        status: reminder.status,
        ruleLabel: `${thresholdLabel(reminder.threshold)}提醒已到达`,
        durationLabel: account ? `已持续 ${formatDuration(getStatusDuration(account, nowIso))}` : "账号已删除",
        notePreview: account?.note?.trim() ?? ""
      };
    });

  return STATUSES.map((status) => ({
    status,
    items: openItems.filter((item) => item.status === status)
  })).filter((group) => group.items.length > 0);
}

export function thresholdLabel(threshold: string): string {
  const dayMatch = threshold.match(/^(\d+)d$/);
  if (dayMatch) {
    return `第 ${dayMatch[1]} 天`;
  }

  const dayHourMatch = threshold.match(/^(\d+)d(\d+)h$/);
  if (dayHourMatch) {
    return `第 ${dayHourMatch[1]} 天 ${dayHourMatch[2]} 小时`;
  }

  return threshold.replace("d", "天").replace("h", "小时");
}
