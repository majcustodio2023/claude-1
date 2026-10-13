import "server-only";
import { randomUUID } from "node:crypto";

// Higgsfield API (docs.higgsfield.ai): submit a job, then poll its status.
// Auth is "Key <id>:<secret>"; the key is stored encrypted and only used here.

const BASE = "https://api.higgsfield.ai";

export const HIGGSFIELD_MODELS = {
  image: "higgsfield-ai/soul/v2/standard",
  imageToVideo: "kling-video/v3.0-turbo/image-to-video",
} as const;

async function call<T>(key: string, path: string, init?: { body: Record<string, unknown> }): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method: init ? "POST" : "GET",
    headers: {
      Authorization: `Key ${key}`,
      ...(init ? { "Content-Type": "application/json", "Idempotency-Key": randomUUID() } : {}),
    },
    body: init ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    /* not JSON */
  }
  if (!res.ok) {
    const msg = (json.detail ?? json.message ?? json.error ?? text) || `HTTP ${res.status}`;
    throw new Error(`Higgsfield: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
  }
  return json as T;
}

export async function submitImage(key: string, prompt: string): Promise<string> {
  const r = await call<{ request_id: string }>(key, HIGGSFIELD_MODELS.image, { body: { prompt } });
  return r.request_id;
}

export async function submitImageToVideo(key: string, prompt: string, imageUrl: string, duration = 5): Promise<string> {
  const r = await call<{ request_id: string }>(key, HIGGSFIELD_MODELS.imageToVideo, { body: { prompt, image_url: imageUrl, duration } });
  return r.request_id;
}

export interface JobStatus {
  status: "queued" | "in_progress" | "completed" | "failed" | "nsfw" | "canceled" | string;
  url?: string;
}

export async function jobStatus(key: string, requestId: string): Promise<JobStatus> {
  const r = await call<{ status: string; images?: { url: string }[]; video?: { url: string } }>(key, `requests/${encodeURIComponent(requestId)}/status`);
  return { status: r.status, url: r.video?.url ?? r.images?.[0]?.url };
}
