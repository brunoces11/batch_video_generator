import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { operationName, apiKey } = await req.json();

    if (!operationName || !apiKey) {
      return new Response(
        JSON.stringify({
          error: "operationName and apiKey are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const pollResponse = await fetch(pollUrl, {
      method: "GET",
      signal: controller.signal,
      headers: { "x-goog-api-key": apiKey },
    });

    clearTimeout(timeout);

    const data = await pollResponse.json();

    if (!pollResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Veo poll error",
          details: data,
          status: pollResponse.status,
        }),
        {
          status: pollResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let videoUrl = null;
    let videoUri = null;

    if (
      data.done &&
      data.response?.generateVideoResponse?.generatedSamples?.[0]
    ) {
      const sample =
        data.response.generateVideoResponse.generatedSamples[0];
      videoUrl = sample.video?.uri || null;
      videoUri = sample.video?.uri || null;
    }

    return new Response(
      JSON.stringify({
        done: data.done || false,
        videoUrl,
        videoUri,
        raw: data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const isAbort =
      err instanceof DOMException && err.name === "AbortError";
    return new Response(
      JSON.stringify({
        error: isAbort ? "Poll timeout" : "Internal error",
        message: String(err),
      }),
      {
        status: isAbort ? 504 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
