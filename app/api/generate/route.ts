import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { resolveRequestAuth } from "@/lib/api-auth";
import type { DramaStyleId } from "@/lib/constants";
import { DRAMA_STYLES } from "@/lib/constants";
import {
  addUserCredits,
  deductUserCredits,
  getUserCredits,
  InsufficientCreditsError,
} from "@/lib/credits";
import {
  getCreditCostForDurationValue,
  CREDIT_COST_BY_DURATION,
} from "@/lib/generation-cost";
import { buildVideoPrompt } from "@/lib/video-prompt";
import {
  DEFAULT_VIDEO_DURATION,
  parseVideoDuration,
  VIDEO_DURATION_OPTIONS,
} from "@/lib/video-duration";
import { DEFAULT_ASPECT_RATIO } from "@/lib/video-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const KLING_BASE_URL =
  process.env.KLING_API_BASE_URL?.trim().replace(/\/$/, "") ||
  "https://api.klingai.com";
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 280_000;
const MAX_REFERENCE_IMAGES = 6;
const MIN_PROMPT_LENGTH = 10;

type RequestBody = {
  prompt?: string;
  style?: string;
  images?: Array<{ base64: string; mimeType?: string }>;
  duration?: number;
  aspectRatio?: string;
};

type ReferenceImageInput = {
  base64: string;
  mimeType: string;
};

type ParsedGenerateRequest = {
  prompt: string;
  style: DramaStyleId;
  images: ReferenceImageInput[];
  duration?: number;
  aspectRatio?: "16:9" | "9:16";
};

type KlingApiEnvelope<T> = {
  code: number;
  message: string;
  data?: T;
};

type KlingCreateTaskData = { task_id: string };
type KlingTaskData = {
  task_id: string;
  task_status: string;
  task_status_msg?: string;
  task_result?: { videos?: Array<{ url?: string }> };
};

// ---------------------------------------------------------------------------
// Kling official JWT auth (HS256) — new token for each API call
// iss = Access Key, signed with Secret Key
// ---------------------------------------------------------------------------

function createKlingJwt(accessKey: string, secretKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: accessKey,
      exp: now + 1800,
      nbf: now - 5,
    })
  ).toString("base64url");
  const signingInput = `${header}.${payload}`;
  const signature = createHmac("sha256", secretKey)
    .update(signingInput)
    .digest("base64url");
  return `${signingInput}.${signature}`;
}

function getKlingCredentials() {
  const accessKey = process.env.KLING_ACCESS_KEY?.trim();
  const secretKey = process.env.KLING_SECRET_KEY?.trim();
  if (!accessKey || !secretKey) return null;
  return { accessKey, secretKey };
}

function sdkIdToApiModelName(id: string): string {
  let name = id.replace(/-(t2v|i2v)$/i, "");
  name = name.replace(/\.0$/, "");
  return name.replace(/\./g, "-");
}

function resolveModelName(mode: "text-to-video" | "image-to-video"): string {
  const env =
    mode === "text-to-video"
      ? process.env.KLING_MODEL_T2V?.trim()
      : process.env.KLING_MODEL_I2V?.trim();
  if (env) return sdkIdToApiModelName(env);
  const fallback = process.env.KLING_MODEL_NAME?.trim();
  if (fallback) return sdkIdToApiModelName(fallback);
  return "kling-v2-6";
}

function assertKlingOk<T>(body: KlingApiEnvelope<T>, context: string): T {
  if (body.code !== 0) {
    throw new Error(
      body.message
        ? `Kling API ${context}: ${body.message} (code ${body.code})`
        : `Kling API ${context} failed (code ${body.code})`
    );
  }
  if (body.data == null) {
    throw new Error(`Kling API ${context}: empty response data`);
  }
  return body.data;
}

async function klingRequest<T>(
  path: string,
  init?: RequestInit
): Promise<KlingApiEnvelope<T>> {
  const credentials = getKlingCredentials();
  if (!credentials) {
    throw new Error("KLING_ACCESS_KEY and KLING_SECRET_KEY are not configured");
  }

  const token = createKlingJwt(credentials.accessKey, credentials.secretKey);
  const res = await fetch(`${KLING_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: KlingApiEnvelope<T>;
  try {
    body = JSON.parse(text) as KlingApiEnvelope<T>;
  } catch {
    throw new Error(
      `Kling API invalid JSON (${res.status}): ${text.slice(0, 200)}`
    );
  }

  if (!res.ok && body.code === undefined) {
    throw new Error(
      `Kling API HTTP ${res.status}: ${body.message ?? text.slice(0, 200)}`
    );
  }

  return body;
}

async function pollTask(
  endpoint: "/v1/videos/text2video" | "/v1/videos/image2video",
  taskId: string
): Promise<KlingTaskData> {
  const started = Date.now();

  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const data = assertKlingOk<KlingTaskData>(
      await klingRequest<KlingTaskData>(`${endpoint}/${taskId}`, {
        method: "GET",
      }),
      "poll"
    );

    if (data.task_status === "succeed") return data;
    if (data.task_status === "failed") {
      throw new Error(data.task_status_msg ?? "Kling generation failed");
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error("Kling video generation timed out");
}

async function generateKlingVideo(input: {
  prompt: string;
  style: DramaStyleId;
  images: ReferenceImageInput[];
  duration?: number;
  aspectRatio?: "16:9" | "9:16";
}) {
  const images = input.images;
  const mode: "text-to-video" | "image-to-video" =
    images.length === 0 ? "text-to-video" : "image-to-video";
  const duration = input.duration ?? DEFAULT_VIDEO_DURATION;
  const aspectRatio = input.aspectRatio ?? DEFAULT_ASPECT_RATIO;
  const fullPrompt = buildVideoPrompt(input.prompt, input.style, {
    hasReferenceImages: images.length > 0,
    referenceCount: images.length,
  });
  const modelName = resolveModelName(mode);
  const negativePrompt =
    "blurry, low quality, watermark, text, logo, deformed face, distorted hands";

  if (mode === "text-to-video") {
    const created = assertKlingOk<KlingCreateTaskData>(
      await klingRequest<KlingCreateTaskData>("/v1/videos/text2video", {
        method: "POST",
        body: JSON.stringify({
          model_name: modelName,
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
          mode: "pro",
          aspect_ratio: aspectRatio,
          duration: String(duration),
        }),
      }),
      "text2video"
    );

    const task = await pollTask("/v1/videos/text2video", created.task_id);
    const videoUrl = task.task_result?.videos?.[0]?.url;
    if (!videoUrl) throw new Error("No video URL in Kling response");

    return {
      videoUrl,
      taskId: created.task_id,
      model: modelName,
      durationSeconds: duration,
      mode,
    };
  }

  const primary = images[0];
  if (!primary) {
    throw new Error("At least one reference image is required");
  }

  const imageBase64 = primary.base64.replace(/^data:[^;]+;base64,/, "");

  const created = assertKlingOk<KlingCreateTaskData>(
    await klingRequest<KlingCreateTaskData>("/v1/videos/image2video", {
      method: "POST",
      body: JSON.stringify({
        model_name: modelName,
        prompt: fullPrompt.slice(0, 2500),
        negative_prompt: negativePrompt,
        mode: "pro",
        image: imageBase64,
        duration: String(duration),
      }),
    }),
    "image2video"
  );

  const task = await pollTask("/v1/videos/image2video", created.task_id);
  const videoUrl = task.task_result?.videos?.[0]?.url;
  if (!videoUrl) throw new Error("No video URL in Kling response");

  return {
    videoUrl,
    taskId: created.task_id,
    model: modelName,
    durationSeconds: duration,
    mode,
  };
}

// ---------------------------------------------------------------------------
// HTTP handlers
// ---------------------------------------------------------------------------

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

function parseDuration(value: unknown) {
  return parseVideoDuration(value);
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
  if (!style) return { error: "Invalid visual style", status: 400 };

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
      provider: "kling-official-jwt",
      apiBase: KLING_BASE_URL,
      models: ["kling-v2-6 (text2video / image2video)"],
      creditCostByDuration: CREDIT_COST_BY_DURATION,
      durationOptions: [...VIDEO_DURATION_OPTIONS],
      defaultDuration: DEFAULT_VIDEO_DURATION,
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

  const durationSeconds = duration ?? DEFAULT_VIDEO_DURATION;
  const creditCost = getCreditCostForDurationValue(durationSeconds);

  let creditsBefore: Awaited<ReturnType<typeof getUserCredits>>;
  try {
    creditsBefore = await getUserCredits(userId);
    if (creditsBefore.credits < creditCost) {
      return jsonResponse(
        {
          ok: false,
          error: "Insufficient credits",
          hint: "Purchase credits on the pricing page",
          creditsRequired: creditCost,
          creditsRemaining: creditsBefore.credits,
          duration: durationSeconds,
        },
        402
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read credits";
    return jsonResponse({ ok: false, error: message }, 500);
  }

  let creditsAfterDeduct: Awaited<ReturnType<typeof deductUserCredits>>;
  try {
    creditsAfterDeduct = await deductUserCredits(userId, creditCost);
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return jsonResponse(
        {
          ok: false,
          error: "Insufficient credits",
          hint: "Purchase credits on the pricing page",
          creditsRequired: error.required,
          creditsRemaining: error.available,
          duration: durationSeconds,
        },
        402
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to deduct credits";
    return jsonResponse({ ok: false, error: message }, 500);
  }

  try {
    const result = await generateKlingVideo({
      prompt,
      style,
      images,
      duration: durationSeconds,
      aspectRatio,
    });

    return jsonResponse(
      {
        ok: true,
        videoUrl: result.videoUrl,
        taskId: result.taskId,
        model: result.model,
        durationSeconds: result.durationSeconds,
        mode: result.mode,
        creditsDeducted: creditCost,
        creditsRemaining: creditsAfterDeduct.credits,
      },
      200
    );
  } catch (error) {
    try {
      await addUserCredits(userId, creditCost);
    } catch (refundError) {
      console.error("[api/generate] Credit refund failed", refundError);
    }

    const refunded = await getUserCredits(userId);

    if (error instanceof InsufficientCreditsError) {
      return jsonResponse(
        {
          ok: false,
          error: "Insufficient credits",
          creditsRequired: error.required,
          creditsRemaining: error.available,
        },
        402
      );
    }

    const message =
      error instanceof Error ? error.message : "Video generation failed";
    console.error("[api/generate]", message, error);
    const isTimeout = /timeout|timed out/i.test(message);

    return jsonResponse(
      {
        ok: false,
        error: message,
        hint: isTimeout
          ? "Try a shorter prompt or fewer reference images. Credits were refunded."
          : "Generation failed. Credits were refunded. Check Kling API keys and balance.",
        creditsRemaining: refunded.credits,
        creditsRefunded: creditCost,
      },
      500
    );
  }
}
