import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function errorResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ error: message, ...extra }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch reference image: ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/png";
  const mimeType = contentType.split(";")[0].trim();
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const data = btoa(binary);
  return { data, mimeType };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const {
      prompt,
      aspectRatio,
      durationSeconds,
      resolution,
      personGeneration,
      apiKey,
      model,
      referenceImageUrl,
    } = await req.json();

    if (!prompt || !apiKey) {
      return errorResponse("prompt and apiKey are required", 400);
    }

    const veoModel = model || "veo-3.1-generate-preview";
    const veoUrl = `https://generativelanguage.googleapis.com/v1beta/models/${veoModel}:predictLongRunning`;

    const instance: Record<string, unknown> = { prompt };

    if (referenceImageUrl) {
      const { data, mimeType } = await fetchImageAsBase64(referenceImageUrl);
      instance.image = {
        inlineData: {
          mimeType,
          data,
        },
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const veoResponse = await fetch(veoUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        instances: [instance],
        parameters: {
          aspectRatio: aspectRatio || "16:9",
          durationSeconds: Number(durationSeconds) || 8,
          resolution: resolution || "720p",
          personGeneration: personGeneration || (referenceImageUrl ? "allow_adult" : "allow_all"),
        },
      }),
    });

    clearTimeout(timeout);

    const data = await veoResponse.json();

    if (!veoResponse.ok) {
      return errorResponse("Veo API error", veoResponse.status, {
        details: data,
        status: veoResponse.status,
      });
    }

    return new Response(JSON.stringify({ operationName: data.name }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const isAbort =
      err instanceof DOMException && err.name === "AbortError";
    return errorResponse(
      isAbort ? "Request timeout" : "Internal error",
      isAbort ? 504 : 500,
      { message: String(err) }
    );
  }
});
