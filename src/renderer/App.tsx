import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  Check,
  Clock3,
  Edit3,
  List,
  Plus,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";
import { api } from "./api";
import { buildInboxGroups } from "./inboxViewModel";
import { getReminderNavigationTarget } from "./reminderNavigation";
import { filterAccounts, formatDuration, getStatusDuration, sortAccounts } from "../shared/domain";
import { STATUSES, type Account, type AccountInput, type AccountStatus, type Reminder } from "../shared/types";
import "./styles.css";

const emptyForm: AccountInput = {
  qqNumber: "",
  summary: "",
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
  note: "",
  status: "代练中"
};

function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeView, setActiveView] = useState<"accounts" | "inbox">("accounts");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "全部">("全部");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editingAccount, setEditingAccount] = useState<AccountInput | null>(null);
  const [highlightedAccountQq, setHighlightedAccountQq] = useState<string | null>(null);
  const [now, setNow] = useState(new Date().toISOString());

  useEffect(() => {
    void refresh();
    const clock = window.setInterval(() => setNow(new Date().toISOString()), 30 * 1000);
    const scanner = window.setInterval(() => void scanReminders(), 60 * 1000);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(scanner);
    };
  }, []);

  const visibleAccounts = useMemo(() => {
    const searched = filterAccounts(sortAccounts(accounts), query);
    return statusFilter === "全部" ? searched : searched.filter((account) => account.status === statusFilter);
  }, [accounts, query, statusFilter]);

  const openReminders = reminders.filter((reminder) => !reminder.handledAt);
  const inboxGroups = useMemo(() => buildInboxGroups(accounts, reminders, now), [accounts, reminders, now]);

  async function refresh() {
    const [accountItems, reminderItems] = await Promise.all([api.listAccounts(), api.scanReminders()]);
    setAccounts(sortAccounts(accountItems));
    setReminders(reminderItems);
  }

  async function scanReminders() {
    setReminders(await api.scanReminders());
  }

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    if (!editingAccount) {
      return;
    }
    await api.saveAccount(normalizeForm(editingAccount));
    setEditingAccount(null);
    setSelectedAccount(null);
    await refresh();
  }

  async function updateStatus(account: Account, status: AccountStatus) {
    const updated = await api.updateStatus(account.qqNumber, status);
    setAccounts((items) => sortAccounts(items.map((item) => (item.qqNumber === updated.qqNumber ? updated : item))));
    if (selectedAccount?.qqNumber === updated.qqNumber) {
      setSelectedAccount(updated);
    }
    await scanReminders();
  }

  async function updateNote(account: Account, note: string) {
    const updated = await api.updateNote(account.qqNumber, note);
    setAccounts((items) => items.map((item) => (item.qqNumber === updated.qqNumber ? updated : item)));
  }

  async function deleteAccount(account: Account) {
    await api.deleteAccount(account.qqNumber);
    setSelectedAccount(null);
    await refresh();
  }

  function navigateToReminderAccount(reminder: Reminder) {
    const target = getReminderNavigationTarget(reminder);
    setActiveView("accounts");
    setStatusFilter(target.statusFilter);
    setQuery("");
    setHighlightedAccountQq(target.accountQqNumber);

    window.setTimeout(() => {
      document.getElementById(accountRowId(target.accountQqNumber))?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 80);

    window.setTimeout(() => {
      setHighlightedAccountQq((current) => (current === target.accountQqNumber ? null : current));
    }, 2600);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">D</span>
          <div>
            <h1>三角洲账号管理</h1>
            <p>本地个人工作台</p>
          </div>
        </div>

        <button className="primary-action" onClick={() => setEditingAccount(emptyForm)}>
          <Plus size={18} />
          新增账号
        </button>

        <div className="view-nav" aria-label="功能视图">
          <button className={activeView === "accounts" ? "active" : ""} onClick={() => setActiveView("accounts")}>
            <List size={16} />
            账号列表
          </button>
          <button className={activeView === "inbox" ? "active" : ""} onClick={() => setActiveView("inbox")}>
            <Bell size={16} />
            提醒收件箱
            <strong>{openReminders.length}</strong>
          </button>
        </div>

        <nav className="status-nav" aria-label="状态筛选">
          {(["全部", ...STATUSES] as const).map((status) => (
            <button
              key={status}
              className={statusFilter === status ? "active" : ""}
              onClick={() => setStatusFilter(status)}
            >
              <span>{status}</span>
              <strong>
                {status === "全部" ? accounts.length : accounts.filter((account) => account.status === status).length}
              </strong>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        {activeView === "accounts" ? (
          <>
            <header className="toolbar">
              <div className="search-box">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="按首页简述模糊搜索"
                />
              </div>
              <button className="inbox-shortcut" onClick={() => setActiveView("inbox")}>
                <Bell size={18} />
                {openReminders.length} 条未处理提醒
              </button>
            </header>

            <section className="account-panel">
              <div className="panel-heading">
                <h2>账号列表</h2>
                <span>{visibleAccounts.length} 个账号</span>
              </div>

              <div className="account-list">
                {visibleAccounts.length === 0 ? (
                  <div className="empty-state">暂无账号。点击左侧“新增账号”开始录入。</div>
                ) : (
                  visibleAccounts.map((account) => (
                    <article
                      id={accountRowId(account.qqNumber)}
                      className={`account-row${highlightedAccountQq === account.qqNumber ? " account-row-highlight" : ""}`}
                      key={account.qqNumber}
                    >
                      <button className="summary-button" onClick={() => setSelectedAccount(account)}>
                        <strong>{account.summary}</strong>
                        <span>QQ {account.qqNumber}</span>
                      </button>

                      <select
                        className={`status-select status-${STATUSES.indexOf(account.status)}`}
                        value={account.status}
                        onChange={(event) => updateStatus(account, event.target.value as AccountStatus)}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <div className="duration">
                        <Clock3 size={16} />
                        {formatDuration(getStatusDuration(account, now))}
                      </div>

                      {account.status === "待出租" && <strong className="coin">{account.coinAmountWan}万纯币</strong>}

                      <input
                        className="note-input"
                        value={account.note}
                        onChange={(event) => updateNote(account, event.target.value)}
                        placeholder="备注"
                      />
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        ) : (
          <ReminderInboxPage
            groups={inboxGroups}
            openCount={openReminders.length}
            onBack={() => setActiveView("accounts")}
            onNavigate={navigateToReminderAccount}
            onHandled={async (id) => setReminders(await api.handleReminder(id))}
          />
        )}
      </section>

      {selectedAccount && (
        <AccountDetailsModal
          account={selectedAccount}
          now={now}
          onClose={() => setSelectedAccount(null)}
          onEdit={() => setEditingAccount(accountToInput(selectedAccount))}
          onDelete={() => deleteAccount(selectedAccount)}
        />
      )}

      {editingAccount && (
        <AccountEditor
          value={editingAccount}
          onChange={setEditingAccount}
          onCancel={() => setEditingAccount(null)}
          onSubmit={saveAccount}
        />
      )}
    </main>
  );
}

function ReminderInboxPage({
  groups,
  openCount,
  onBack,
  onNavigate,
  onHandled
}: {
  groups: ReturnType<typeof buildInboxGroups>;
  openCount: number;
  onBack: () => void;
  onNavigate: (reminder: Reminder) => void;
  onHandled: (id: number) => Promise<void>;
}) {
  return (
    <section className="inbox-page">
      <header className="inbox-page-header">
        <div>
          <h2>提醒收件箱</h2>
          <p>{openCount} 条未处理提醒，按状态分类</p>
        </div>
        <button onClick={onBack}>返回账号列表</button>
      </header>

      {groups.length === 0 ? (
        <div className="empty-state inbox-empty">当前没有待处理提醒。</div>
      ) : (
        <div className="inbox-board">
          {groups.map((group) => (
            <section className="inbox-section" key={group.status}>
              <div className="inbox-section-heading">
                <h3>{group.status}</h3>
                <span>{group.items.length} 条</span>
              </div>

              <div className="inbox-card-list">
                {group.items.map((item) => (
                  <article className="inbox-card" key={item.reminder.id}>
                    <button className="inbox-card-main" onClick={() => onNavigate(item.reminder)}>
                      <div className="inbox-card-title-row">
                        <strong>{item.title}</strong>
                        <span>{item.status}</span>
                      </div>
                      <p className="inbox-card-summary">{item.summary}</p>
                      <div className="inbox-card-meta">
                        <span>{item.ruleLabel}</span>
                        <span>{item.durationLabel}</span>
                      </div>
                      {item.notePreview && <p className="inbox-card-note">{item.notePreview}</p>}
                    </button>

                    <button className="inbox-card-done" onClick={() => onHandled(item.reminder.id)}>
                      <Check size={16} />
                      完成
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function AccountDetailsModal({
  account,
  now,
  onClose,
  onEdit,
  onDelete
}: {
  account: Account;
  now: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="modal-backdrop details-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="account-details-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="details-header">
          <div>
            <h2 id="account-details-title">{account.summary}</h2>
            <p>
              {account.status} · {formatDuration(getStatusDuration(account, now))}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} title="关闭">
            <X size={18} />
          </button>
        </div>

        <dl className="detail-grid">
          <Detail label="QQ号" value={account.qqNumber} />
          <Detail label="QQ密码" value={account.qqPassword} />
          <Detail label="密保手机" value={account.securityPhone} />
          <Detail label="绑定微信" value={account.wechatId} />
          <Detail label="实名人" value={account.realName} />
          <Detail label="纯币数" value={`${account.coinAmountWan} 万`} />
          <Detail label="体力等级" value={account.staminaLevel} />
          <Detail label="负重等级" value={account.loadLevel} />
          <Detail label="六甲数量" value={account.armor6Count} />
          <Detail label="六头数量" value={account.helmet6Count} />
          <Detail label="AW子弹" value={account.awAmmoCount} />
          <Detail label="皮肤" value={account.skin} />
          <Detail label="备注" value={account.note || "无"} wide />
        </dl>

        <div className="details-actions">
          <button onClick={onEdit}>
            <Edit3 size={16} />
            编辑
          </button>
          <button className="danger" onClick={onDelete}>
            <Trash2 size={16} />
            删除
          </button>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "wide" : ""}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function AccountEditor({
  value,
  onChange,
  onCancel,
  onSubmit
}: {
  value: AccountInput;
  onChange: (value: AccountInput) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  function setField<K extends keyof AccountInput>(key: K, fieldValue: AccountInput[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <div className="modal-backdrop">
      <form className="editor" onSubmit={onSubmit}>
        <div className="editor-header">
          <h2>{value.qqNumber ? "编辑账号" : "新增账号"}</h2>
          <button type="button" className="icon-button" onClick={onCancel} title="取消">
            <X size={18} />
          </button>
        </div>

        <div className="form-grid">
          <Field label="QQ号" required value={value.qqNumber} onChange={(text) => setField("qqNumber", text)} />
          <Field
            label="首页简述"
            required
            value={value.summary}
            placeholder="例如：1234 300w 2甲1头 张三 aw50 皮肤"
            onChange={(text) => setField("summary", text)}
          />
          <Field label="QQ密码" value={value.qqPassword} onChange={(text) => setField("qqPassword", text)} />
          <Field label="密保手机" value={value.securityPhone} onChange={(text) => setField("securityPhone", text)} />
          <Field label="绑定微信" value={value.wechatId} onChange={(text) => setField("wechatId", text)} />
          <Field label="实名人" value={value.realName} onChange={(text) => setField("realName", text)} />
          <NumberField label="纯币数(万)" value={value.coinAmountWan} onChange={(num) => setField("coinAmountWan", num)} />
          <NumberField label="体力等级" value={value.staminaLevel} onChange={(num) => setField("staminaLevel", num)} />
          <NumberField label="负重等级" value={value.loadLevel} onChange={(num) => setField("loadLevel", num)} />
          <NumberField label="六甲数量" value={value.armor6Count} onChange={(num) => setField("armor6Count", num)} />
          <NumberField label="六头数量" value={value.helmet6Count} onChange={(num) => setField("helmet6Count", num)} />
          <NumberField label="AW子弹数量" value={value.awAmmoCount} onChange={(num) => setField("awAmmoCount", num)} />
          <Field label="皮肤" value={value.skin} onChange={(text) => setField("skin", text)} />
          <label>
            状态
            <select value={value.status} onChange={(event) => setField("status", event.target.value as AccountStatus)}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            备注
            <textarea value={value.note} onChange={(event) => setField("note", event.target.value)} />
          </label>
        </div>

        <div className="editor-actions">
          <button type="button" onClick={onCancel}>
            取消
          </button>
          <button className="primary-action compact" type="submit">
            <Save size={16} />
            保存
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  placeholder = ""
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label>
      {label}
      <input required={required} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function accountToInput(account: Account): AccountInput {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...input } = account;
  return input;
}

function normalizeForm(input: AccountInput): AccountInput {
  return {
    ...input,
    qqNumber: input.qqNumber.trim(),
    summary: input.summary.trim()
  };
}

function thresholdLabel(threshold: string): string {
  return threshold.replace("d", "天").replace("h", "小时");
}

function accountRowId(qqNumber: string): string {
  return `account-row-${qqNumber}`;
}

createRoot(document.getElementById("root")!).render(<App />);
