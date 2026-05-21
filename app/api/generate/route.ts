import { NextRequest, NextResponse } from "next/server";
import { resolveRequestAuth } from "@/lib/api-auth";
import type { DramaStyleId } from "@/lib/constants";
import { DRAMA_STYLES } from "@/lib/constants";
import {
  deductUserCredits,
  getUserCredits,
  InsufficientCreditsError,
} from "@/lib/credits";
import { VIDEO_GENERATION_CREDIT_COST } from "@/lib/generation-cost";
import { getKlingCredentials } from "@/lib/kling-client";
import {
  generateDramaVideo,
  type ReferenceImageInput,
} from "@/lib/video-generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Hobby: max 300s. If generation times out, use a shorter prompt or split into segments.
export const maxDuration = 300;

const MAX_REFERENCE_IMAGES = 6;
const MIN_PROMPT_LENGTH = 10;

type RequestBody = {
  prompt?: string;
  style?: string;
  images?: Array<{ base64: string; mimeType?: string }>;
  duration?: number;
  aspectRatio?: string;
};

type ParsedGenerateRequest = {
  prompt: string;
  style: DramaStyleId;
  images: ReferenceImageInput[];
  duration?: number;
  aspectRatio?: "16:9" | "9:16";
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isValidStyle(style: string): style is DramaStyleId {
  return DRAMA_STYLES.some((s) => s.id === style);
}

function parseDuration(value: unknown): number | undefined {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return Number.isFinite(n) && n >= 3 && n <= 15 ? n : undefined;
}

function parseAspectRatio(value: unknown): "16:9" | "9:16" | undefined {
  return value === "16:9" || value === "9:16" ? value : undefined;
}

function parseImagesFromJson(raw: RequestBody["images"]): ReferenceImageInput[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item) => typeof item?.base64 === "string" && item.base64.length > 0)
    .slice(0, MAX_REFERENCE_IMAGES)
    .map((item) => ({
      base64: item.base64,
      mimeType: item.mimeType ?? "image/jpeg",
    }));
}

async function fileToReferenceImage(file: File): Promise<ReferenceImageInput> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    base64: buffer.toString("base64"),
    mimeType: file.type || "image/jpeg",
  };
}

async function parseMultipartRequest(
  request: NextRequest
): Promise<ParsedGenerateRequest | { error: string; status: number }> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { error: "Invalid multipart form data", status: 400 };
  }

  const prompt = String(form.get("prompt") ?? "").trim();
  const styleRaw = String(form.get("style") ?? "hongkong").trim();
  const style = isValidStyle(styleRaw) ? styleRaw : null;

  if (!style) {
    return { error: "Invalid visual style", status: 400 };
  }

  const files = [
    ...form.getAll("images"),
    ...form.getAll("image"),
  ].filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const images = await Promise.all(
    files.slice(0, MAX_REFERENCE_IMAGES).map(fileToReferenceImage)
  );

  return {
    prompt,
    style,
    images,
    duration: parseDuration(form.get("duration")),
    aspectRatio: parseAspectRatio(form.get("aspectRatio")),
  };
}

async function parseJsonRequest(
  request: NextRequest
): Promise<ParsedGenerateRequest | { error: string; status: number }> {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return { error: "Invalid JSON body", status: 400 };
  }

  const styleRaw = body.style?.trim() ?? "hongkong";
  if (!isValidStyle(styleRaw)) {
    return { error: "Invalid visual style", status: 400 };
  }

  return {
    prompt: body.prompt?.trim() ?? "",
    style: styleRaw,
    images: parseImagesFromJson(body.images),
    duration: parseDuration(body.duration),
    aspectRatio: parseAspectRatio(body.aspectRatio),
  };
}

async function parseGenerateRequest(
  request: NextRequest
): Promise<ParsedGenerateRequest | { error: string; status: number }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseMultipartRequest(request);
  }

  return parseJsonRequest(request);
}

export async function GET() {
  return jsonResponse(
    {
      ok: true,
      service: "drama-video-generate",
      provider: "kling-official",
      models: ["kling-v2.6-t2v", "kling-v2.6-i2v"],
      creditCost: VIDEO_GENERATION_CREDIT_COST,
      accepts: ["application/json", "multipart/form-data"],
      maxDurationSeconds: maxDuration,
    },
    200
  );
}

export async function POST(request: NextRequest) {
  const authResult = await resolveRequestAuth(request);
  if (!authResult.userId) {
    return jsonResponse(
      { ok: false, error: "Unauthorized", hint: "Sign in to generate video" },
      401
    );
  }

  const userId = authResult.userId;

  if (!getKlingCredentials()) {
    return jsonResponse(
      {
        ok: false,
        error: "Kling API is not configured",
        hint: "Set KLING_ACCESS_KEY and KLING_SECRET_KEY in .env.local",
      },
      503
    );
  }

  const parsed = await parseGenerateRequest(request);
  if ("error" in parsed) {
    return jsonResponse({ ok: false, error: parsed.error }, parsed.status);
  }

  const { prompt, style, images, duration, aspectRatio } = parsed;

  if (prompt.length < MIN_PROMPT_LENGTH) {
    return jsonResponse(
      {
        ok: false,
        error: `Prompt must be at least ${MIN_PROMPT_LENGTH} characters`,
      },
      400
    );
  }

  let creditsBefore: Awaited<ReturnType<typeof getUserCredits>>;
  try {
    creditsBefore = await getUserCredits(userId);
    if (creditsBefore.credits < VIDEO_GENERATION_CREDIT_COST) {
      return jsonResponse(
        {
          ok: false,
          error: "Insufficient credits",
          hint: "Purchase a credit pack on the pricing page to continue generating",
          creditsRequired: VIDEO_GENERATION_CREDIT_COST,
          creditsRemaining: creditsBefore.credits,
        },
        402
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read credits";
    return jsonResponse({ ok: false, error: message }, 500);
  }

  try {
    const result = await generateDramaVideo({
      prompt,
      style,
      images,
      duration,
      aspectRatio,
    });

    const creditsAfter = await deductUserCredits(
      userId,
      VIDEO_GENERATION_CREDIT_COST
    );

    return jsonResponse(
      {
        ok: true,
        videoUrl: result.videoUrl,
        taskId: result.taskId,
        model: result.model,
        durationSeconds: result.durationSeconds,
        mode: images.length === 0 ? "text-to-video" : "image-to-video",
        creditsDeducted: VIDEO_GENERATION_CREDIT_COST,
        creditsRemaining: creditsAfter.credits,
      },
      200
    );
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return jsonResponse(
        {
          ok: false,
          error: "Insufficient credits",
          hint: "Purchase a credit pack on the pricing page to continue generating",
          creditsRequired: error.required,
          creditsRemaining: error.available,
        },
        402
      );
    }

    const message =
      error instanceof Error ? error.message : "Video generation failed";
    console.error("[api/generate]", message, error);
    const isTimeout =
      /timeout|timed out|deadline|504|FUNCTION_INVOCATION_TIMEOUT/i.test(
        message
      );
    return jsonResponse(
      {
        ok: false,
        error: message,
        hint: isTimeout
          ? "Generation timed out. Try a shorter prompt, fewer images, or split into shorter segments."
          : "Check KLING_ACCESS_KEY / KLING_SECRET_KEY and your Kling account balance",
        creditsRemaining: creditsBefore.credits,
      },
      500
    );
  }
}
