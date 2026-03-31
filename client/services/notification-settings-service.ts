import { supabase } from "@/lib/supabase";

type NotificationSettingsRpcRowT = {
  pushNotificationsEnabled?: boolean | null;
  dailyReminderEnabled?: boolean | null;
  weeklyReportEnabled?: boolean | null;
  monthlyReminderEnabled?: boolean | null;
  trialEndingPushEnabled?: boolean | null;
  timezone?: string | null;
  reminderTime?: string | null;
  weeklyReportDay?: number | null;
  monthlyReminderDay?: number | null;
};

type RegisteredPushTokenRpcRowT = {
  id?: string | null;
  provider?: string | null;
  platform?: string | null;
  isActive?: boolean | null;
  lastSeenAt?: string | null;
};

export type NotificationSettingsT = {
  pushNotificationsEnabled: boolean;
  dailyReminderEnabled: boolean;
  weeklyReportEnabled: boolean;
  monthlyReminderEnabled: boolean;
  trialEndingPushEnabled: boolean;
  timezone: string | null;
  reminderTime: string | null;
  weeklyReportDay: number | null;
  monthlyReminderDay: number | null;
};

export type RegisterPushTokenInputT = {
  provider: string;
  token: string;
  platform: "ios" | "android";
  deviceId?: string | null;
  appBuild?: string | null;
};

export type RegisteredPushTokenT = {
  id: string;
  provider: string;
  platform: string;
  isActive: boolean;
  lastSeenAt: string | null;
};

const getRpcObject = <T extends object>(data: unknown, rpcName: string): T => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Unexpected ${rpcName} response`);
  }

  return data as T;
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const mapNotificationSettings = (
  row: NotificationSettingsRpcRowT,
): NotificationSettingsT => ({
  pushNotificationsEnabled: Boolean(row.pushNotificationsEnabled),
  dailyReminderEnabled: Boolean(row.dailyReminderEnabled),
  weeklyReportEnabled: Boolean(row.weeklyReportEnabled),
  monthlyReminderEnabled: Boolean(row.monthlyReminderEnabled),
  trialEndingPushEnabled: Boolean(row.trialEndingPushEnabled),
  timezone: typeof row.timezone === "string" ? row.timezone : null,
  reminderTime: typeof row.reminderTime === "string" ? row.reminderTime : null,
  weeklyReportDay: toNullableNumber(row.weeklyReportDay),
  monthlyReminderDay: toNullableNumber(row.monthlyReminderDay),
});

const mapRegisteredPushToken = (
  row: RegisteredPushTokenRpcRowT,
): RegisteredPushTokenT => {
  if (typeof row.id !== "string" || !row.id) {
    throw new Error("Unexpected register_my_push_token response");
  }

  return {
    id: row.id,
    provider: typeof row.provider === "string" ? row.provider : "",
    platform: typeof row.platform === "string" ? row.platform : "",
    isActive: Boolean(row.isActive),
    lastSeenAt: typeof row.lastSeenAt === "string" ? row.lastSeenAt : null,
  };
};

export const fetchMyNotificationSettings =
  async (): Promise<NotificationSettingsT> => {
    const { data, error } = await supabase.rpc("get_my_notification_settings");

    if (error) {
      throw error;
    }

    return mapNotificationSettings(
      getRpcObject<NotificationSettingsRpcRowT>(
        data,
        "get_my_notification_settings",
      ),
    );
  };

export const updateMyNotificationSettings = async (
  settings: NotificationSettingsT,
): Promise<NotificationSettingsT> => {
  const { data, error } = await supabase.rpc(
    "update_my_notification_settings",
    {
      input_push_notifications_enabled: settings.pushNotificationsEnabled,
      input_daily_reminder_enabled: settings.dailyReminderEnabled,
      input_weekly_report_enabled: settings.weeklyReportEnabled,
      input_monthly_reminder_enabled: settings.monthlyReminderEnabled,
      input_trial_ending_push_enabled: settings.trialEndingPushEnabled,
      input_timezone: settings.timezone,
      input_reminder_time: settings.reminderTime,
      input_weekly_report_day: settings.weeklyReportDay,
      input_monthly_reminder_day: settings.monthlyReminderDay,
    },
  );

  if (error) {
    throw error;
  }

  return mapNotificationSettings(
    getRpcObject<NotificationSettingsRpcRowT>(
      data,
      "update_my_notification_settings",
    ),
  );
};

export const registerMyPushToken = async (
  input: RegisterPushTokenInputT,
): Promise<RegisteredPushTokenT> => {
  const { data, error } = await supabase.rpc("register_my_push_token", {
    input_provider: input.provider,
    input_token: input.token,
    input_platform: input.platform,
    input_device_id: input.deviceId ?? null,
    input_app_build: input.appBuild ?? null,
  });

  if (error) {
    throw error;
  }

  return mapRegisteredPushToken(
    getRpcObject<RegisteredPushTokenRpcRowT>(data, "register_my_push_token"),
  );
};

export const deactivateMyPushToken = async (token: string): Promise<void> => {
  const { error } = await supabase.rpc("deactivate_my_push_token", {
    input_token: token,
  });

  if (error) {
    throw error;
  }
};
