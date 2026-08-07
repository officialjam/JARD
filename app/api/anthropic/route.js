// Server-only route. The API key lives here (via an environment
// variable), never in the browser. The client calls this route;
// this route calls Google's Gemini API and reshapes the response
// into the same {content:[{type:"text",text}]} shape the client
// already expects, so nothing on the client had to change.
//
// Free-tier model availability shifts over time. If this model
// stops being free (or stops existing), check
// https://ai.google.dev/gemini-api/docs/pricing and swap MODEL below.
const MODEL = "gemini-3.6-flash";

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "GEMINI_API_KEY is not set on the server. Add it in your Vercel project's Settings → Environment Variables, then redeploy.",
      },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { system, messages, max_tokens } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Missing messages." }, { status: 400 });
  }

  // Gemini's turn format: role is "user" or "model" (not "assistant"),
  // and each turn is { role, parts: [...] } instead of { role, content }.
  // content can be a plain string (existing behavior) or an array of
  // parts like [{type:"text",text}, {type:"file",mimeType,data}] for
  // multimodal input (e.g. a PDF sent straight to the model).
  const toParts = (content) => {
    if (typeof content === "string") return [{ text: content }];
    if (Array.isArray(content)) {
      return content.map((part) => {
        if (part.type === "file") {
          return { inline_data: { mime_type: part.mimeType, data: part.data } };
        }
        return { text: part.text || "" };
      });
    }
    return [{ text: "" }];
  };

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: toParts(m.content),
  }));

  const payload = {
    contents,
    generationConfig: { maxOutputTokens: max_tokens || 1000 },
  };
  if (system) {
    payload.system_instruction = { parts: [{ text: system }] };
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return Response.json(
        { error: data?.error?.message || "Gemini API returned an error." },
        { status: geminiRes.status }
      );
    }

    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;
    const text = candidate?.content?.parts?.[0]?.text || "";

    if (finishReason === "MAX_TOKENS") {
      return Response.json(
        { error: "The response got cut off before it finished (ran out of output room). Try a shorter job description, or a leaner profile." },
        { status: 502 }
      );
    }
    if (finishReason && finishReason !== "STOP" && !text) {
      return Response.json(
        { error: `The model stopped early (${finishReason}) without returning a usable response. Try again.` },
        { status: 502 }
      );
    }

    return Response.json({ content: [{ type: "text", text }] });
  } catch (e) {
    return Response.json({ error: "Failed to reach the Gemini API." }, { status: 502 });
  }
}
