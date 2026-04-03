/**
 * Appels Google Gemini avec backoff exponentiel (erreurs réseau / 429 / 5xx).
 * Clé : GEMINI_API_KEY dans .env.local
 */

const DEFAULT_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

const DELAYS_MS = [1000, 2000, 4000, 8000, 16000];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {string} prompt
 * @param {{ json?: boolean, responseSchema?: object }} [opts]
 * @returns {Promise<string|null>} texte brut ou JSON string si json=true
 */
export async function generateContent(prompt, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY manquante");
    return null;
  }

  const model = DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (opts.json) {
    payload.generationConfig = {
      responseMimeType: "application/json",
      ...(opts.responseSchema
        ? { responseSchema: opts.responseSchema }
        : {
            responseSchema: {
              type: "OBJECT",
              properties: {
                categorie: { type: "STRING" },
                fragile: { type: "BOOLEAN" },
                conseils: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
              },
            },
          }),
    };
  }

  let lastErr;
  for (let i = 0; i < DELAYS_MS.length; i++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Gemini ${res.status}: ${t}`);
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text == null) throw new Error("Réponse Gemini vide");
      return text;
    } catch (e) {
      lastErr = e;
      if (i < DELAYS_MS.length - 1) await sleep(DELAYS_MS[i]);
    }
  }
  console.error("Gemini échec après retries:", lastErr);
  return null;
}
