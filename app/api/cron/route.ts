import { NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron";
import { runDailyDigest } from "@/lib/digest";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") === "1";

  try {
    const result = await runDailyDigest({ dryRun });

    return NextResponse.json({
      ok: true,
      dryRun,
      sentEmailId: result.sentEmailId,
      sourceCounts: result.sourceCounts,
      digest: result.digest
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      {
        status: 500
      }
    );
  }
}
