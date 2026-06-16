import type { Account, AccountInput, AccountStatus, Reminder } from "../shared/types";
import { createLocalFallbackApi } from "./localFallback";

export type DeltaApi = {
  listAccounts: () => Promise<Account[]>;
  saveAccount: (input: AccountInput) => Promise<Account>;
  deleteAccount: (qqNumber: string) => Promise<Account[]>;
  updateStatus: (qqNumber: string, status: AccountStatus) => Promise<Account>;
  updateNote: (qqNumber: string, note: string) => Promise<Account>;
  listReminders: () => Promise<Reminder[]>;
  scanReminders: () => Promise<Reminder[]>;
  handleReminder: (id: number) => Promise<Reminder[]>;
};

declare global {
  interface Window {
    deltaApi?: DeltaApi;
  }
}

export const api: DeltaApi = window.deltaApi ?? createLocalFallbackApi(window.localStorage);
