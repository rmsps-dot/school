import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Enterprise Production Health & Latency Probe
 * Used by uptime monitors, Kubernetes/Vercel probes, and enterprise status pages.
 */
export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      const dbStart = Date.now();
      const { error } = await supabase
        .from("settings")
        .select("id", { count: "exact", head: true })
        .limit(1);

      dbLatencyMs = Date.now() - dbStart;

      if (error) {
        dbStatus = "degraded";
        dbError = error.message;
      }
    } catch (err) {
      dbStatus = "unreachable";
      dbError = err instanceof Error ? err.message : "Unknown database error";
    }
  } else {
    dbStatus = "unconfigured";
  }

  const isHealthy = dbStatus === "connected" || dbStatus === "degraded";
  const totalLatencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "production",
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          ...(dbError ? { error: dbError } : {}),
        },
        api: {
          status: "healthy",
          latencyMs: totalLatencyMs,
        },
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
