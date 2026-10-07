export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://r01304213-cloud.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Content-Type": "application/json"
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Gemini API
    if (url.pathname === "/api/gemini") {
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          {
            status: 405,
            headers: corsHeaders
          }
        );
      }

      try {
        const body = await request.json();

        const messages = Array.isArray(body.messages)
          ? body.messages
          : [];

        const contents = messages
          .filter(
            m =>
              m &&
              (m.role === "user" || m.role === "assistant")
          )
          .map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [
              {
                text: String(m.content || "")
              }
            ]
          }));

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
  encodeURIComponent(env.GEMINI_API_KEY),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature:
                  Number(body.temperature) || 0.7
              }
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return new Response(
            JSON.stringify({
              error:
                data?.error?.message ||
                "Gemini API error"
            }),
            {
              status: response.status,
              headers: corsHeaders
            }
          );
        }

        const text =
          data?.candidates?.[0]?.content?.parts
            ?.map(p => p.text || "")
            .join("") || "";

        return new Response(
          JSON.stringify({ text }),
          {
            status: 200,
            headers: corsHeaders
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            error:
              error?.message ||
              "Server error"
          }),
          {
            status: 500,
            headers: corsHeaders
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        status: "Vyrnexa Worker aktif"
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  }
};
