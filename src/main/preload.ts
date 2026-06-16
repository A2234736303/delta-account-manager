import { contextBridge, ipcRenderer } from "electron";
import type { AccountInput, AccountStatus } from "../shared/types";

contextBridge.exposeInMainWorld("deltaApi", {
  listAccounts: () => ipcRenderer.invoke("accounts:list"),
  saveAccount: (input: AccountInput) => ipcRenderer.invoke("accounts:save", input),
  deleteAccount: (qqNumber: string) => ipcRenderer.invoke("accounts:delete", qqNumber),
  updateStatus: (qqNumber: string, status: AccountStatus) =>
    ipcRenderer.invoke("accounts:updateStatus", qqNumber, status),
  updateNote: (qqNumber: string, note: string) => ipcRenderer.invoke("accounts:updateNote", qqNumber, note),
  listReminders: () => ipcRenderer.invoke("reminders:list"),
  scanReminders: () => ipcRenderer.invoke("reminders:scan"),
  handleReminder: (id: number) => ipcRenderer.invoke("reminders:handle", id)
});
