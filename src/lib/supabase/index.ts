export { createBrowserClient, createBrowserClient as createClient } from "./client";
export { createServerClient } from "./server";
// ⚠️ createAdminClient is intentionally NOT re-exported here.
// Import it directly from "@/lib/supabase/admin" in server-only code.
