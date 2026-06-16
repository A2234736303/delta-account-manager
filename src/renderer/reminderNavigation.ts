import type { AccountStatus, Reminder } from "../shared/types";

export type ReminderNavigationTarget = {
  accountQqNumber: string;
  statusFilter: AccountStatus;
};

export function getReminderNavigationTarget(reminder: Reminder): ReminderNavigationTarget {
  return {
    accountQqNumber: reminder.accountQqNumber,
    statusFilter: reminder.status
  };
}
