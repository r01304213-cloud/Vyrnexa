export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API Gemini untuk Vyrnexa
    if (url.pathname === "/api/gemini") {
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          {
            status: 405,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      try {
        const body = await request.json();
        const messages = Array.isArray(body.messages) ? body.messages : [];

        const contents = messages
          .filter(m => m && (m.role === "user" || m.role === "assistant"))
          .map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: String(m.content || "") }]
          }));

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
            encodeURIComponent(env.GEMINI_API_KEY),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: Number(body.temperature) || 0.7
              }
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return new Response(
            JSON.stringify({
              error: data?.error?.message || "Gemini API error"
            }),
            {
              status: response.status,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        const text =
          data?.candidates?.[0]?.content?.parts
            ?.map(p => p.text || "")
            .join("") || "";

        return new Response(JSON.stringify({ text }), {
          headers: { "Content-Type": "application/json" }
        });

      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message || "Server error" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    // Selain API, layani index.html
    return new Response("Vyrnexa Worker aktif.", {
      headers: { "Content-Type": "text/plain" }
    });
  }
};
