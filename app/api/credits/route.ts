import { NextRequest, NextResponse } from "next/server";
import { resolveRequestAuth } from "@/lib/api-auth";
import { getUserCredits } from "@/lib/credits";
import { CREDIT_COST_BY_DURATION } from "@/lib/generation-cost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = await resolveRequestAuth(request);
  if (!authResult.userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { credits, isPro } = await getUserCredits(authResult.userId);
    return NextResponse.json({
      ok: true,
      credits,
      isPro,
      creditCostByDuration: CREDIT_COST_BY_DURATION,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load credits";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
