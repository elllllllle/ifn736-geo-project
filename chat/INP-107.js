/*
 * INP-107 — Add timeout/error handling for API calls
 *
 * This is PROPOSED code, not yet merged anywhere. index.html has NOT been
 * modified -- it stays exactly as originally built, byte for byte. This
 * file is the actual deliverable for this ticket: the replacement version
 * of callGemini() that whoever owns the repo can review and merge in
 * themselves, at chat/index.html, replacing the current callGemini()
 * function there.
 *
 * What changed vs. the current version in index.html: callGemini() there
 * currently has NO timeout at all -- if Gemini hangs, the page just waits
 * indefinitely, relying only on the browser's own default (often minutes).
 * The AbortController-based 20-second timeout below is the fix.
 */

async function callGemini(historyArr, apiKey, timeoutMs = 20000){
  // USER STORY 213 / INP-107: explicit timeout added here, matching the same
  // AbortController pattern fetchSiteContent() already uses well elsewhere
  // in index.html. Without this, a hung Gemini call has no controlled
  // timeout at all -- it just sits on "Thinking…" until the browser's own
  // default fetch timeout eventually gives up (which can be minutes, not
  // seconds).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: historyArr, generationConfig: { maxOutputTokens: 500 } }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok){
    const errText = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || "").join("");
}
