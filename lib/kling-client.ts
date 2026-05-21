import { createKlingAI } from "@ai-sdk/klingai";

const DEFAULT_BASE_URL = "https://api-singapore.klingai.com";

export function getKlingCredentials() {
  const accessKey = process.env.KLING_ACCESS_KEY?.trim();
  const secretKey = process.env.KLING_SECRET_KEY?.trim();

  if (!accessKey || !secretKey) {
    return null;
  }

  return { accessKey, secretKey };
}

export function createKlingProvider() {
  const credentials = getKlingCredentials();
  if (!credentials) {
    throw new Error("KLING_ACCESS_KEY and KLING_SECRET_KEY are not configured");
  }

  const baseURL = process.env.KLING_API_BASE_URL?.trim() || DEFAULT_BASE_URL;

  return createKlingAI({
    accessKey: credentials.accessKey,
    secretKey: credentials.secretKey,
    baseURL,
  });
}
