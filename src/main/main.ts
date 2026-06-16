import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { AccountDatabase } from "./database";
import { generateDueReminders, sortAccounts } from "../shared/domain";
import type { AccountInput, AccountStatus } from "../shared/types";

let mainWindow: BrowserWindow | null = null;
let database: AccountDatabase;

const isDev = process.env.VITE_DEV_SERVER_URL || !app.isPackaged;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: "三角洲账号管理系统",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    await mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

function scanAndPersistReminders(): void {
  const accounts = database.listAccounts();
  const reminders = database.listReminders();
  const due = generateDueReminders(accounts, reminders);
  if (due.length > 0) {
    database.insertReminders(due);
  }
}

function registerIpc(): void {
  ipcMain.handle("accounts:list", () => sortAccounts(database.listAccounts()));
  ipcMain.handle("accounts:save", (_event, input: AccountInput) => {
    const account = database.upsertAccount(input);
    scanAndPersistReminders();
    return account;
  });
  ipcMain.handle("accounts:delete", (_event, qqNumber: string) => {
    database.deleteAccount(qqNumber);
    return sortAccounts(database.listAccounts());
  });
  ipcMain.handle("accounts:updateStatus", (_event, qqNumber: string, status: AccountStatus) => {
    const account = database.updateStatus(qqNumber, status);
    scanAndPersistReminders();
    return account;
  });
  ipcMain.handle("accounts:updateNote", (_event, qqNumber: string, note: string) => database.updateNote(qqNumber, note));
  ipcMain.handle("reminders:list", () => database.listReminders());
  ipcMain.handle("reminders:scan", () => {
    scanAndPersistReminders();
    return database.listReminders();
  });
  ipcMain.handle("reminders:handle", (_event, id: number) => database.markReminderHandled(id));
}

app.whenReady().then(async () => {
  const dbPath = path.join(app.getPath("userData"), "delta-accounts.sqlite");
  database = new AccountDatabase(dbPath);
  registerIpc();
  scanAndPersistReminders();
  setInterval(scanAndPersistReminders, 60 * 1000);
  await createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  database?.close();
});
