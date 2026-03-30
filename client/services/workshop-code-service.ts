import { supabase } from "@/lib/supabase";
import {
  clearPendingWorkshopCode,
  loadPendingWorkshopCode,
  savePendingWorkshopCode,
  type PendingWorkshopCodeT,
} from "@/services/local-storage";

export type SignupMethodT = "email" | "google" | "apple" | "unknown";

type WorkshopCodeRpcRowT = {
  status: string | null;
  access_key: string | null;
  trial_days: number | null;
  starts_at: string | null;
  ends_at: string | null;
  message: string | null;
};

type WorkshopCodeValidationRpcRowT = {
  status: string | null;
  access_key: string | null;
  trial_days: number | null;
  message: string | null;
};

export type WorkshopCodeRedemptionResultT = {
  status:
    | "redeemed"
    | "already_redeemed"
    | "invalid"
    | "expired"
    | "inactive"
    | "limit_reached"
    | "unauthenticated"
    | "unavailable"
    | "error";
  accessKey: string | null;
  trialDays: number | null;
  startsAt: string | null;
  endsAt: string | null;
  message: string | null;
};

export type WorkshopCodeValidationResultT = {
  status:
    | "valid"
    | "invalid"
    | "expired"
    | "inactive"
    | "limit_reached"
    | "unavailable"
    | "error";
  accessKey: string | null;
  trialDays: number | null;
  message: string | null;
};

type AccessStateRpcRowT = {
  has_access: boolean | null;
  access_key: string | null;
  source_type: string | null;
  active_until: string | null;
  paywall_required: boolean | null;
};

export type AccessStateT = {
  hasAccess: boolean;
  accessKey: string | null;
  sourceType: string | null;
  activeUntil: string | null;
  paywallRequired: boolean;
};

const TERMINAL_REDEMPTION_STATUSES = new Set<
  WorkshopCodeRedemptionResultT["status"]
>([
  "redeemed",
  "already_redeemed",
  "invalid",
  "expired",
  "inactive",
  "limit_reached",
]);

const normalizeResult = (
  row: WorkshopCodeRpcRowT | null | undefined,
): WorkshopCodeRedemptionResultT => {
  const normalizedStatus = row?.status ?? "error";

  return {
    status:
      normalizedStatus === "redeemed" ||
      normalizedStatus === "already_redeemed" ||
      normalizedStatus === "invalid" ||
      normalizedStatus === "expired" ||
      normalizedStatus === "inactive" ||
      normalizedStatus === "limit_reached" ||
      normalizedStatus === "unauthenticated"
        ? normalizedStatus
        : "error",
    accessKey: row?.access_key ?? null,
    trialDays: row?.trial_days ?? null,
    startsAt: row?.starts_at ?? null,
    endsAt: row?.ends_at ?? null,
    message: row?.message ?? null,
  };
};

export const normalizeWorkshopCode = (value: string): string =>
  value.trim().toUpperCase();

export const rememberPendingWorkshopCode = async (
  code: string,
  signupMethod?: SignupMethodT,
): Promise<void> => {
  const normalizedCode = normalizeWorkshopCode(code);

  if (!normalizedCode) {
    await clearPendingWorkshopCode();
    return;
  }

  const payload: PendingWorkshopCodeT = {
    code: normalizedCode,
    ...(signupMethod ? { signupMethod } : {}),
  };

  await savePendingWorkshopCode(payload);
};

export const redeemWorkshopCode = async (
  code: string,
  signupMethod: SignupMethodT = "unknown",
): Promise<WorkshopCodeRedemptionResultT> => {
  const normalizedCode = normalizeWorkshopCode(code);

  if (!normalizedCode) {
    return {
      status: "invalid",
      accessKey: null,
      trialDays: null,
      startsAt: null,
      endsAt: null,
      message: "Workshop code is missing.",
    };
  }

  const { data, error } = await supabase.rpc("redeem_workshop_code", {
    input_code: normalizedCode,
    input_signup_method: signupMethod,
  });

  if (error) {
    if (error.message.toLowerCase().includes("does not exist")) {
      return {
        status: "unavailable",
        accessKey: null,
        trialDays: null,
        startsAt: null,
        endsAt: null,
        message: error.message,
      };
    }

    return {
      status: "error",
      accessKey: null,
      trialDays: null,
      startsAt: null,
      endsAt: null,
      message: error.message,
    };
  }

  const row = Array.isArray(data)
    ? ((data[0] ?? null) as WorkshopCodeRpcRowT | null)
    : (data as WorkshopCodeRpcRowT | null);

  return normalizeResult(row);
};

export const validateWorkshopCode = async (
  code: string,
): Promise<WorkshopCodeValidationResultT> => {
  const normalizedCode = normalizeWorkshopCode(code);

  if (!normalizedCode) {
    return {
      status: "invalid",
      accessKey: null,
      trialDays: null,
      message: "Bitte gib einen Workshop-Code ein.",
    };
  }

  const { data, error } = await supabase.rpc("validate_workshop_code", {
    input_code: normalizedCode,
  });

  if (error) {
    if (error.message.toLowerCase().includes("does not exist")) {
      return {
        status: "unavailable",
        accessKey: null,
        trialDays: null,
        message: "Die Code-Prüfung ist derzeit nicht verfügbar.",
      };
    }

    return {
      status: "error",
      accessKey: null,
      trialDays: null,
      message: "Der Workshop-Code konnte nicht geprüft werden.",
    };
  }

  const row = Array.isArray(data)
    ? ((data[0] ?? null) as WorkshopCodeValidationRpcRowT | null)
    : (data as WorkshopCodeValidationRpcRowT | null);

  if (!row) {
    return {
      status: "error",
      accessKey: null,
      trialDays: null,
      message: "Der Workshop-Code konnte nicht geprüft werden.",
    };
  }

  const normalizedStatus = row.status ?? "error";

  return {
    status:
      normalizedStatus === "valid" ||
      normalizedStatus === "invalid" ||
      normalizedStatus === "expired" ||
      normalizedStatus === "inactive" ||
      normalizedStatus === "limit_reached"
        ? normalizedStatus
        : "error",
    accessKey: row.access_key ?? null,
    trialDays: row.trial_days ?? null,
    message:
      normalizedStatus === "valid"
        ? row.trial_days
          ? `${row.trial_days} Tage Testzugang verfügbar.`
          : "Workshop-Code ist verfügbar."
        : normalizedStatus === "invalid"
          ? "Dieser Workshop-Code ist ungültig."
          : normalizedStatus === "expired"
            ? "Dieser Workshop-Code ist abgelaufen."
            : normalizedStatus === "inactive"
              ? "Dieser Workshop-Code ist derzeit nicht aktiv."
              : normalizedStatus === "limit_reached"
                ? "Dieser Workshop-Code ist nicht mehr verfügbar."
                : "Der Workshop-Code konnte nicht geprüft werden.",
  };
};

export const processPendingWorkshopCode =
  async (): Promise<WorkshopCodeRedemptionResultT | null> => {
    const pendingWorkshopCode = await loadPendingWorkshopCode();

    if (!pendingWorkshopCode?.code) {
      return null;
    }

    const result = await redeemWorkshopCode(
      pendingWorkshopCode.code,
      pendingWorkshopCode.signupMethod ?? "unknown",
    );

    if (TERMINAL_REDEMPTION_STATUSES.has(result.status)) {
      await clearPendingWorkshopCode();
    }

    return result;
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

  return {
    hasAccess: row.has_access ?? false,
    accessKey: row.access_key ?? null,
    sourceType: row.source_type ?? null,
    activeUntil: row.active_until ?? null,
    paywallRequired: row.paywall_required ?? true,
  };
};
