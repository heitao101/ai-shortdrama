import type { DramaStyleId } from "@/lib/constants";
import { getClerkSessionToken } from "@/lib/checkout-client";

export type GenerateApiResponse = {
  ok?: boolean;
  videoUrl?: string;
  taskId?: string;
  model?: string;
  durationSeconds?: number;
  mode?: "text-to-video" | "image-to-video";
  creditsDeducted?: number;
  creditsRemaining?: number;
  creditsRequired?: number;
  error?: string;
  hint?: string;
};

export class GenerateError extends Error {
  constructor(
    message: string,
    readonly code:
      | "NOT_SIGNED_IN"
      | "NO_TOKEN"
      | "API_ERROR"
      | "INSUFFICIENT_CREDITS"
      | "INVALID_RESPONSE",
    readonly creditsRemaining?: number
  ) {
    super(message);
    this.name = "GenerateError";
  }
}

type GetTokenFn = (options?: { skipCache?: boolean }) => Promise<string | null>;

async function parseGenerateResponse(res: Response): Promise<GenerateApiResponse> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await res.json()) as GenerateApiResponse;
  }

  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new GenerateError(
      res.status === 401
        ? "Please sign in before generating"
        : `Server returned HTML instead of JSON (${res.status})`,
      "INVALID_RESPONSE"
    );
  }

  try {
    return JSON.parse(text) as GenerateApiResponse;
  } catch {
    throw new GenerateError(
      `Unexpected response (${res.status})`,
      "INVALID_RESPONSE"
    );
  }
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export async function requestVideoGeneration(
  params: {
    prompt: string;
    style: DramaStyleId;
    images: Array<{ file: File; base64?: string }>;
    duration?: number;
  },
  getToken: GetTokenFn
): Promise<GenerateApiResponse> {
  const token = await getClerkSessionToken(getToken);

  const images = await Promise.all(
    params.images.map(async (img) => ({
      base64: img.base64 ?? (await fileToBase64(img.file)),
      mimeType: img.file.type || "image/jpeg",
    }))
  );

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      prompt: params.prompt,
      style: params.style,
      images,
      duration: params.duration,
      aspectRatio: "9:16",
    }),
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseGenerateResponse(res);

  if (res.status === 402 || data.error === "Insufficient credits") {
    throw new GenerateError(
      [data.error, data.hint].filter(Boolean).join(" — ") ||
        "Insufficient credits",
      "INSUFFICIENT_CREDITS",
      data.creditsRemaining
    );
  }

  if (!res.ok || data.ok === false || !data.videoUrl) {
    const message = [data.error, data.hint].filter(Boolean).join(" — ");
    throw new GenerateError(
      message || `Generation failed (${res.status})`,
      "API_ERROR",
      data.creditsRemaining
    );
  }

  return data;
}
