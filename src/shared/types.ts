export const STATUSES = ["代练中", "跑刀中", "待出租", "出租中", "冷号中"] as const;

export type AccountStatus = (typeof STATUSES)[number];

export type Account = {
  qqNumber: string;
  summary: string;
  qqPassword: string;
  securityPhone: string;
  wechatId: string;
  realName: string;
  coinAmountWan: number;
  staminaLevel: number;
  loadLevel: number;
  armor6Count: number;
  helmet6Count: number;
  awAmmoCount: number;
  skin: string;
  note: string;
  status: AccountStatus;
  statusStartedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AccountInput = Omit<Account, "createdAt" | "updatedAt" | "statusStartedAt"> & {
  statusStartedAt?: string;
};

export type Reminder = {
  id: number;
  accountQqNumber: string;
  accountSummary: string;
  status: AccountStatus;
  threshold: string;
  triggeredAt: string;
  readAt: string | null;
  handledAt: string | null;
};

export type NewReminder = Omit<Reminder, "id" | "readAt" | "handledAt">;

export type DurationParts = {
  days: number;
  hours: number;
  minutes: number;
};
