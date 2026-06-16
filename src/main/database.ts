import Database from "better-sqlite3";
import type { Account, AccountInput, AccountStatus, NewReminder, Reminder } from "../shared/types";

export class AccountDatabase {
  private readonly db: Database.Database;

  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.migrate();
  }

  close(): void {
    this.db.close();
  }

  listAccounts(): Account[] {
    return this.db.prepare("select * from accounts").all().map((row) => rowToAccount(row as DbRow));
  }

  upsertAccount(input: AccountInput): Account {
    const now = new Date().toISOString();
    const existing = this.getAccount(input.qqNumber);
    const statusStartedAt =
      existing && existing.status === input.status ? existing.statusStartedAt : input.statusStartedAt ?? now;

    this.db
      .prepare(
        `insert into accounts (
          qq_number, summary, qq_password, security_phone, wechat_id, real_name,
          coin_amount_wan, stamina_level, load_level, armor_6_count, helmet_6_count,
          aw_ammo_count, skin, note, status, status_started_at, created_at, updated_at
        ) values (
          @qqNumber, @summary, @qqPassword, @securityPhone, @wechatId, @realName,
          @coinAmountWan, @staminaLevel, @loadLevel, @armor6Count, @helmet6Count,
          @awAmmoCount, @skin, @note, @status, @statusStartedAt, @createdAt, @updatedAt
        )
        on conflict(qq_number) do update set
          summary = excluded.summary,
          qq_password = excluded.qq_password,
          security_phone = excluded.security_phone,
          wechat_id = excluded.wechat_id,
          real_name = excluded.real_name,
          coin_amount_wan = excluded.coin_amount_wan,
          stamina_level = excluded.stamina_level,
          load_level = excluded.load_level,
          armor_6_count = excluded.armor_6_count,
          helmet_6_count = excluded.helmet_6_count,
          aw_ammo_count = excluded.aw_ammo_count,
          skin = excluded.skin,
          note = excluded.note,
          status = excluded.status,
          status_started_at = excluded.status_started_at,
          updated_at = excluded.updated_at`
      )
      .run({ ...input, statusStartedAt, createdAt: existing?.createdAt ?? now, updatedAt: now });

    return this.getAccount(input.qqNumber)!;
  }

  updateStatus(qqNumber: string, status: AccountStatus): Account {
    const now = new Date().toISOString();
    this.db
      .prepare("update accounts set status = ?, status_started_at = ?, updated_at = ? where qq_number = ?")
      .run(status, now, now, qqNumber);
    return this.getAccount(qqNumber)!;
  }

  updateNote(qqNumber: string, note: string): Account {
    const now = new Date().toISOString();
    this.db.prepare("update accounts set note = ?, updated_at = ? where qq_number = ?").run(note, now, qqNumber);
    return this.getAccount(qqNumber)!;
  }

  deleteAccount(qqNumber: string): void {
    this.db.prepare("delete from accounts where qq_number = ?").run(qqNumber);
  }

  listReminders(): Reminder[] {
    return this.db
      .prepare(
        `select reminders.*, accounts.summary as account_summary
         from reminders
         left join accounts on accounts.qq_number = reminders.account_qq_number
         order by reminders.triggered_at desc`
      )
      .all()
      .map((row) => rowToReminder(row as DbRow));
  }

  insertReminders(reminders: NewReminder[]): Reminder[] {
    const statement = this.db.prepare(
      `insert or ignore into reminders (
        account_qq_number, status, threshold, triggered_at, read_at, handled_at
      ) values (@accountQqNumber, @status, @threshold, @triggeredAt, null, null)`
    );
    const insertMany = this.db.transaction((items: NewReminder[]) => {
      for (const item of items) {
        statement.run(item);
      }
    });
    insertMany(reminders);
    return this.listReminders();
  }

  markReminderHandled(id: number): Reminder[] {
    const now = new Date().toISOString();
    this.db.prepare("update reminders set handled_at = ?, read_at = coalesce(read_at, ?) where id = ?").run(now, now, id);
    return this.listReminders();
  }

  private getAccount(qqNumber: string): Account | undefined {
    const row = this.db.prepare("select * from accounts where qq_number = ?").get(qqNumber);
    return row ? rowToAccount(row as DbRow) : undefined;
  }

  private migrate(): void {
    this.db.exec(`
      create table if not exists accounts (
        qq_number text primary key,
        summary text not null,
        qq_password text not null default '',
        security_phone text not null default '',
        wechat_id text not null default '',
        real_name text not null default '',
        coin_amount_wan real not null default 0,
        stamina_level integer not null default 0,
        load_level integer not null default 0,
        armor_6_count integer not null default 0,
        helmet_6_count integer not null default 0,
        aw_ammo_count integer not null default 0,
        skin text not null default '',
        note text not null default '',
        status text not null,
        status_started_at text not null,
        created_at text not null,
        updated_at text not null
      );

      create table if not exists reminders (
        id integer primary key autoincrement,
        account_qq_number text not null,
        status text not null,
        threshold text not null,
        triggered_at text not null,
        read_at text,
        handled_at text,
        unique(account_qq_number, status, threshold),
        foreign key(account_qq_number) references accounts(qq_number) on delete cascade
      );
    `);
  }
}

type DbRow = Record<string, unknown>;

function rowToAccount(row: DbRow): Account {
  return {
    qqNumber: String(row.qq_number),
    summary: String(row.summary),
    qqPassword: String(row.qq_password),
    securityPhone: String(row.security_phone),
    wechatId: String(row.wechat_id),
    realName: String(row.real_name),
    coinAmountWan: Number(row.coin_amount_wan),
    staminaLevel: Number(row.stamina_level),
    loadLevel: Number(row.load_level),
    armor6Count: Number(row.armor_6_count),
    helmet6Count: Number(row.helmet_6_count),
    awAmmoCount: Number(row.aw_ammo_count),
    skin: String(row.skin),
    note: String(row.note),
    status: row.status as AccountStatus,
    statusStartedAt: String(row.status_started_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function rowToReminder(row: DbRow): Reminder {
  return {
    id: Number(row.id),
    accountQqNumber: String(row.account_qq_number),
    accountSummary: String(row.account_summary ?? ""),
    status: row.status as AccountStatus,
    threshold: String(row.threshold),
    triggeredAt: String(row.triggered_at),
    readAt: row.read_at ? String(row.read_at) : null,
    handledAt: row.handled_at ? String(row.handled_at) : null
  };
}
