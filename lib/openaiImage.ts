import "server-only";

// OpenAI image generation (the image model behind ChatGPT). Uses the same OpenAI key as Kit's
// voice; the key stays on the server. Returns the picture's bytes; the caller stores them.

/** Newest first; the next one is tried if OpenAI says the model isn't available to the key. */
const MODELS = process.env.OPENAI_IMAGE_MODEL ? [process.env.OPENAI_IMAGE_MODEL] : ["gpt-image-1.5", "gpt-image-1"];

export type ImageShape = "portrait" | "square" | "landscape";
const SIZES: Record<ImageShape, string> = { portrait: "1024x1536", square: "1024x1024", landscape: "1536x1024" };

export async function openaiImage(key: string, prompt: string, shape: ImageShape = "portrait"): Promise<{ bytes: Buffer; type: string; model: string }> {
  let last = "";
  for (const model of MODELS) {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, size: SIZES[shape] ?? SIZES.portrait, quality: "high", output_format: "png", n: 1 }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { b64_json?: string }[]; error?: { message?: string; code?: string } };
    const b64 = json.data?.[0]?.b64_json;
    if (res.ok && b64) return { bytes: Buffer.from(b64, "base64"), type: "image/png", model };
    last = json.error?.message ?? `OpenAI error ${res.status}`;
    const missing = res.status === 404 || json.error?.code === "model_not_found" || /model.*(not exist|not found|does not have access)/i.test(last);
    if (!missing) break;
  }
  if (/verif/i.test(last)) last += " (OpenAI asks you to verify your organization once at platform.openai.com → Settings → Organization before its image model can be used.)";
  if (/safety|moderation|rejected/i.test(last)) last = `OpenAI turned this prompt down: ${last}`;
  throw new Error(`ChatGPT images: ${last}`);
}
