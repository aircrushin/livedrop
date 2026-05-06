import { getOptionalEnv } from "../core/env";
import { checkR2Bucket } from "../core/r2";
import { createAdminClient } from "../core/supabase-admin";

interface CheckResult {
  name: string;
  ok: boolean;
  message?: string;
}

async function runCheck(name: string, check: () => Promise<void> | void): Promise<CheckResult> {
  try {
    await check();
    return { name, ok: true };
  } catch (error) {
    return {
      name,
      ok: false,
      message: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function handleDoctorCommand() {
  const checks = await Promise.all([
    runCheck("NEXT_PUBLIC_SUPABASE_URL", () => {
      if (!getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL")) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
      }
    }),
    runCheck("SUPABASE_SERVICE_ROLE_KEY", () => {
      if (!getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY")) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
      }
    }),
    runCheck("database", async () => {
      const supabase = createAdminClient();
      const { error } = await supabase.from("events").select("id", { count: "exact", head: true });

      if (error) {
        throw new Error(error.message);
      }
    }),
    runCheck("r2", async () => {
      await checkR2Bucket();
    }),
  ]);

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}
