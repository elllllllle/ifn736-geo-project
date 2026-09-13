/*
 * INP-109: Test under simulated slow/failed connection.
 *
 * index.html has NOT been modified (see INP-107.js / INP-108.js -- those are
 * PROPOSED code, not yet merged in). So this test combines:
 *   - GEMINI_URL and fetchSiteContent(), read live from the real,
 *     untouched index.html (proves the existing, unchanged code still works)
 *   - callGemini() and describeError(), read from INP-107.js / INP-108.js
 *     (proves the PROPOSED code actually works, before anyone merges it)
 *
 * Run this from chat/tests/, one folder below index.html and the two
 * INP-*.js files.
 */
require("./dom_stub");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const CHAT_DIR = path.join(__dirname, "..");

// Pull GEMINI_URL and fetchSiteContent() out of the real, untouched index.html
const html = fs.readFileSync(path.join(CHAT_DIR, "index.html"), "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("Couldn't find a <script> block in index.html -- has the file moved?");
  process.exit(1);
}
const indexScript = scriptMatch[1];

// The proposed replacements -- not part of index.html
const inp107 = fs.readFileSync(path.join(CHAT_DIR, "INP-107.js"), "utf8");
const inp108 = fs.readFileSync(path.join(CHAT_DIR, "INP-108.js"), "utf8");

const exposed = new Function(`
  ${indexScript}
  ${inp107}
  ${inp108}
  return { callGemini, describeError, fetchSiteContent, sendTurn, retryLastTurn, resetConversation };
`)();

const { callGemini, describeError, fetchSiteContent } = exposed;

let testsRun = 0, testsPassed = 0;
async function test(name, fn) {
  testsRun++;
  try { await fn(); testsPassed++; console.log(`  PASS  ${name}`); }
  catch (e) { console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

(async () => {
  console.log("Simulated SLOW connection (Gemini call times out):");

  await test("callGemini times out and aborts after timeoutMs, not left hanging", async () => {
    global.fetch = (url, opts) => new Promise((_, reject) => {
      opts.signal.addEventListener("abort", () => {
        const e = new Error("aborted"); e.name = "AbortError"; reject(e);
      });
    });
    let threw = null;
    try { await callGemini([], "fake-key", 50); } catch (e) { threw = e; }
    assert.ok(threw && threw.name === "AbortError", "expected an AbortError from the timeout");
  });

  await test("describeError() gives a clear message for that timeout (the actual gap this patch closes)", () => {
    const err = new Error("aborted"); err.name = "AbortError";
    const msg = describeError(err);
    assert.ok(msg.includes("taking longer than expected"), `got: "${msg}"`);
    assert.ok(!msg.startsWith("Something went wrong"), "must not fall through to the generic message");
  });

  await test("callGemini succeeds normally when Gemini responds before the timeout", async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "Flight Centre is a great choice." }] } }] }),
    });
    const result = await callGemini([], "fake-key", 5000);
    assert.ok(result.includes("Flight Centre"));
  });

  console.log("\nSimulated FAILED connection:");

  await test("network drop -> Failed to fetch -> friendly network message", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    let threw = null;
    try { await callGemini([], "fake-key"); } catch (e) { threw = e; }
    assert.ok(threw);
    assert.strictEqual(describeError(threw), "Couldn't reach the network — check your connection and try again.");
  });

  await test("bad API key (403) -> friendly key message, not a raw stack trace", async () => {
    global.fetch = async () => ({ ok: false, status: 400, statusText: "Bad Request", text: async () => "API_KEY_INVALID" });
    let threw = null;
    try { await callGemini([], "bad-key"); } catch (e) { threw = e; }
    assert.ok(threw);
    assert.strictEqual(describeError(threw), "Gemini rejected that API key — double-check it's correct and try again.");
  });

  await test("rate limited (429, no quota mention) -> 'wait a moment' message", async () => {
    global.fetch = async () => ({ ok: false, status: 429, statusText: "Too Many Requests", text: async () => "Please retry shortly" });
    let threw = null;
    try { await callGemini([], "fake-key"); } catch (e) { threw = e; }
    assert.strictEqual(describeError(threw), "Rate limit hit on this key — wait a moment and try again.");
  });

  await test("quota exhausted (429 + 'quota' in body) -> distinct message, doesn't suggest retrying immediately", async () => {
    global.fetch = async () => ({
      ok: false, status: 429, statusText: "Too Many Requests",
      text: async () => JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED", message: "You exceeded your current quota, please check your plan and billing details." } }),
    });
    let threw = null;
    try { await callGemini([], "fake-key"); } catch (e) { threw = e; }
    const msg = describeError(threw);
    assert.ok(msg.includes("quota"), `expected a quota-specific message, got: "${msg}"`);
    assert.ok(msg.toLowerCase().includes("won't help") || msg.toLowerCase().includes("different key"),
      "must NOT imply that waiting a moment and retrying will fix it");
  });

  console.log("\nRegression check -- confirm the ALREADY-GOOD fetchSiteContent() fallback still works:");

  await test("fetchSiteContent falls back to the embedded snapshot if the live site fetch fails", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    const content = await fetchSiteContent("https://example.com/site.html");
    assert.ok(content.includes("Flight Centre"), "should fall back to the embedded snapshot, not throw");
  });

  await test("fetchSiteContent times out on a slow site and still falls back gracefully", async () => {
    global.fetch = (url, opts) => new Promise((_, reject) => {
      opts.signal.addEventListener("abort", () => {
        const e = new Error("aborted"); e.name = "AbortError"; reject(e);
      });
    });
    const start = Date.now();
    const content = await fetchSiteContent("https://example.com/slow.html");
    assert.ok(content.includes("Flight Centre"), "should still return the fallback snapshot");
    assert.ok(Date.now() - start < 6000, "should not hang past its own 5s timeout");
  });

  console.log(`\n${testsPassed}/${testsRun} passed`);
  process.exit(testsPassed === testsRun ? 0 : 1);
})();
