import { generateDueReminders, sortAccounts } from "../shared/domain";
import type { Account, AccountInput, AccountStatus, Reminder } from "../shared/types";
import type { DeltaApi } from "./api";

const STORAGE_KEY = "delta-account-manager:fallback-state";

type FallbackState = {
  accounts: Account[];
  reminders: Reminder[];
  nextReminderId: number;
};

const initialState: FallbackState = {
  accounts: [],
  reminders: [],
  nextReminderId: 1
};

export function createLocalFallbackApi(storage: Storage): DeltaApi {
  function readState(): FallbackState {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...initialState, accounts: [], reminders: [] };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<FallbackState>;
      return {
        accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
        reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
        nextReminderId: Number.isInteger(parsed.nextReminderId) ? Number(parsed.nextReminderId) : 1
      };
    } catch {
      return { ...initialState, accounts: [], reminders: [] };
    }
  }

  function writeState(state: FallbackState): void {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function scan(state: FallbackState): FallbackState {
    const due = generateDueReminders(state.accounts, state.reminders);
    if (due.length === 0) {
      return state;
    }

    const reminders = [...state.reminders];
    let nextReminderId = state.nextReminderId;
    for (const reminder of due) {
      reminders.push({ ...reminder, id: nextReminderId++, readAt: null, handledAt: null });
    }

    return { ...state, reminders, nextReminderId };
  }

  return {
    async listAccounts() {
      return sortAccounts(readState().accounts);
    },
    async saveAccount(input: AccountInput) {
      const state = readState();
      const now = new Date().toISOString();
      const existingIndex = state.accounts.findIndex((account) => account.qqNumber === input.qqNumber);
      const existing = existingIndex >= 0 ? state.accounts[existingIndex] : null;
      const account: Account = {
        ...input,
        statusStartedAt:
          existing && existing.status === input.status ? existing.statusStartedAt : input.statusStartedAt ?? now,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      const accounts = [...state.accounts];
      if (existingIndex >= 0) {
        accounts[existingIndex] = account;
      } else {
        accounts.push(account);
      }
      writeState(scan({ ...state, accounts }));
      return account;
    },
    async deleteAccount(qqNumber: string) {
      const state = readState();
      const nextState = {
        ...state,
        accounts: state.accounts.filter((account) => account.qqNumber !== qqNumber),
        reminders: state.reminders.filter((reminder) => reminder.accountQqNumber !== qqNumber)
      };
      writeState(nextState);
      return sortAccounts(nextState.accounts);
    },
    async updateStatus(qqNumber: string, status: AccountStatus) {
      const state = readState();
      const now = new Date().toISOString();
      const accounts = state.accounts.map((account) =>
        account.qqNumber === qqNumber ? { ...account, status, statusStartedAt: now, updatedAt: now } : account
      );
      const updated = accounts.find((account) => account.qqNumber === qqNumber);
      if (!updated) {
        throw new Error("Account not found");
      }
      writeState(scan({ ...state, accounts }));
      return updated;
    },
    async updateNote(qqNumber: string, note: string) {
      const state = readState();
      const now = new Date().toISOString();
      const accounts = state.accounts.map((account) =>
        account.qqNumber === qqNumber ? { ...account, note, updatedAt: now } : account
      );
      const updated = accounts.find((account) => account.qqNumber === qqNumber);
      if (!updated) {
        throw new Error("Account not found");
      }
      writeState({ ...state, accounts });
      return updated;
    },
    async listReminders() {
      return readState().reminders;
    },
    async scanReminders() {
      const state = scan(readState());
      writeState(state);
      return state.reminders;
    },
    async handleReminder(id: number) {
      const state = readState();
      const now = new Date().toISOString();
      const reminders = state.reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, readAt: reminder.readAt ?? now, handledAt: now } : reminder
      );
      writeState({ ...state, reminders });
      return reminders;
    }
  };
}
