import type { Account, AccountStatus, DurationParts, NewReminder, Reminder } from "./types";

export const STATUS_ORDER: AccountStatus[] = ["代练中", "跑刀中", "待出租", "出租中", "冷号中"];

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

type ReminderRule = {
  threshold: string;
  milliseconds: number;
};

export const REMINDER_RULES: Partial<Record<AccountStatus, ReminderRule[]>> = {
  跑刀中: [
    { threshold: "5d", milliseconds: 5 * MS_PER_DAY },
    { threshold: "7d", milliseconds: 7 * MS_PER_DAY }
  ],
  出租中: [
    { threshold: "3d", milliseconds: 3 * MS_PER_DAY },
    { threshold: "5d", milliseconds: 5 * MS_PER_DAY },
    { threshold: "7d", milliseconds: 7 * MS_PER_DAY }
  ],
  待出租: [{ threshold: "2d", milliseconds: 2 * MS_PER_DAY }],
  冷号中: [{ threshold: "3d12h", milliseconds: 3 * MS_PER_DAY + 12 * MS_PER_HOUR }]
};

export function getStatusDuration(account: Account, nowIso = new Date().toISOString()): DurationParts {
  const elapsed = Math.max(0, new Date(nowIso).getTime() - new Date(account.statusStartedAt).getTime());
  const days = Math.floor(elapsed / MS_PER_DAY);
  const hours = Math.floor((elapsed % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((elapsed % MS_PER_HOUR) / MS_PER_MINUTE);
  return { days, hours, minutes };
}

export function formatDuration(duration: DurationParts): string {
  return `${duration.days}天 ${duration.hours}小时 ${duration.minutes}分钟`;
}

export function filterAccounts(accounts: Account[], query: string): Account[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return accounts;
  }
  return accounts.filter((account) => account.summary.toLowerCase().includes(normalized));
}

export function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((left, right) => {
    const statusDiff = STATUS_ORDER.indexOf(left.status) - STATUS_ORDER.indexOf(right.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return left.summary.localeCompare(right.summary, "zh-CN");
  });
}

export function generateDueReminders(
  accounts: Account[],
  existingReminders: Reminder[],
  nowIso = new Date().toISOString()
): NewReminder[] {
  const now = new Date(nowIso).getTime();
  const existingKeys = new Set(
    existingReminders.map((reminder) =>
      reminderKey(reminder.accountQqNumber, reminder.status, reminder.threshold)
    )
  );

  return accounts.flatMap((account) => {
    const rules = REMINDER_RULES[account.status] ?? [];
    const elapsed = now - new Date(account.statusStartedAt).getTime();

    return rules
      .filter((rule) => elapsed >= rule.milliseconds)
      .filter((rule) => !existingKeys.has(reminderKey(account.qqNumber, account.status, rule.threshold)))
      .map((rule) => ({
        accountQqNumber: account.qqNumber,
        accountSummary: account.summary,
        status: account.status,
        threshold: rule.threshold,
        triggeredAt: nowIso
      }));
  });
}

function reminderKey(accountQqNumber: string, status: AccountStatus, threshold: string): string {
  return `${accountQqNumber}:${status}:${threshold}`;
}
