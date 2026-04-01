import { supabase } from "@/lib/supabase";

type AccessStateRpcRowT = {
  has_access: boolean | null;
  access_key: string | null;
  source_type: string | null;
  active_until: string | null;
  paywall_required: boolean | null;
  trial_ends_at: string | null;
  paywall_visible_from: string | null;
  paywall_visible: boolean | null;
  days_until_expiry: number | null;
  had_workshop_access: boolean | null;
};

type EnsureDefaultAppTrialRpcRowT = {
  status: string | null;
  access_key: string | null;
  starts_at: string | null;
  ends_at: string | null;
  paywall_visible_from: string | null;
  message: string | null;
};

export type AccessStateT = {
  hasAccess: boolean;
  accessKey: string | null;
  sourceType: string | null;
  activeUntil: string | null;
  paywallRequired: boolean;
  trialEndsAt: string | null;
  paywallVisibleFrom: string | null;
  paywallVisible: boolean;
  daysUntilExpiry: number | null;
  hadWorkshopAccess: boolean;
};

export type EnsureDefaultAppTrialResultT = {
  status:
    | "created"
    | "already_granted"
    | "access_exists"
    | "missing_config"
    | "unauthenticated"
    | "error";
  accessKey: string | null;
  startsAt: string | null;
  endsAt: string | null;
  paywallVisibleFrom: string | null;
  message: string | null;
};

type AccessStateListenerT = () => void;

const accessStateListeners = new Set<AccessStateListenerT>();

const DEFAULT_ACCESS_STATE: AccessStateT = {
  hasAccess: false,
  accessKey: null,
  sourceType: null,
  activeUntil: null,
  paywallRequired: false,
  trialEndsAt: null,
  paywallVisibleFrom: null,
  paywallVisible: false,
  daysUntilExpiry: null,
  hadWorkshopAccess: false,
};

const ensureUserRow = async (userId: string): Promise<void> => {
  void userId;

  const { error } = await supabase.rpc("ensure_my_user_row");

  if (error) {
    throw error;
  }
};

const normalizeAccessState = (
  row: AccessStateRpcRowT | null | undefined,
): AccessStateT => ({
  hasAccess: row?.has_access ?? false,
  accessKey: row?.access_key ?? null,
  sourceType: row?.source_type ?? null,
  activeUntil: row?.active_until ?? null,
  paywallRequired: row?.paywall_required ?? false,
  trialEndsAt: row?.trial_ends_at ?? null,
  paywallVisibleFrom: row?.paywall_visible_from ?? null,
  paywallVisible: row?.paywall_visible ?? false,
  daysUntilExpiry:
    typeof row?.days_until_expiry === "number" ? row.days_until_expiry : null,
  hadWorkshopAccess: row?.had_workshop_access ?? false,
});

const normalizeDefaultAppTrialResult = (
  row: EnsureDefaultAppTrialRpcRowT | null | undefined,
): EnsureDefaultAppTrialResultT => {
  const status = row?.status ?? "error";

  return {
    status:
      status === "created" ||
      status === "already_granted" ||
      status === "access_exists" ||
      status === "missing_config" ||
      status === "unauthenticated"
        ? status
        : "error",
    accessKey: row?.access_key ?? null,
    startsAt: row?.starts_at ?? null,
    endsAt: row?.ends_at ?? null,
    paywallVisibleFrom: row?.paywall_visible_from ?? null,
    message: row?.message ?? null,
  };
};

export const subscribeToAccessStateChanges = (
  listener: AccessStateListenerT,
): (() => void) => {
  accessStateListeners.add(listener);

  return () => {
    accessStateListeners.delete(listener);
  };
};

export const notifyAccessStateChanged = (): void => {
  accessStateListeners.forEach((listener) => {
    listener();
  });
};

export const getDefaultAccessState = (): AccessStateT => DEFAULT_ACCESS_STATE;

export const ensureDefaultAppTrial =
  async (): Promise<EnsureDefaultAppTrialResultT | null> => {
    const { data, error } = await supabase.rpc("ensure_default_app_trial");

    if (error) {
      if (error.message.toLowerCase().includes("does not exist")) {
        return null;
      }

      throw error;
    }

    const row = Array.isArray(data)
      ? ((data[0] ?? null) as EnsureDefaultAppTrialRpcRowT | null)
      : (data as EnsureDefaultAppTrialRpcRowT | null);

    return normalizeDefaultAppTrialResult(row);
  };

export const getMyAccessState = async (): Promise<AccessStateT | null> => {
  const { data, error } = await supabase.rpc("get_my_access_state");

  if (error) {
    if (error.message.toLowerCase().includes("does not exist")) {
      return null;
    }

    throw error;
  }

  const row = Array.isArray(data)
    ? ((data[0] ?? null) as AccessStateRpcRowT | null)
    : (data as AccessStateRpcRowT | null);

  if (!row) {
    return null;
  }

  return normalizeAccessState(row);
};

export const initializeAccessStateForUser = async (
  userId: string,
): Promise<AccessStateT> => {
  await ensureUserRow(userId);
  await ensureDefaultAppTrial();

  const accessState = await getMyAccessState();

  return accessState ?? DEFAULT_ACCESS_STATE;
};
