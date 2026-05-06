import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../lib/supabase/types";
import { requireEnv } from "./env";

export function createAdminClient() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
