/*
 * INP-108 — Add 'please wait / try again' UI messaging
 *
 * This is PROPOSED code, not yet merged anywhere. index.html has NOT been
 * modified -- it stays exactly as originally built, byte for byte. This
 * file is the actual deliverable for this ticket: the replacement version
 * of describeError() that whoever owns the repo can review and merge in
 * themselves, at chat/index.html, replacing the current describeError()
 * function there.
 *
 * IMPORTANT CONTEXT: the "please wait" typing indicator and the Retry
 * button already exist in index.html and don't need to change -- that part
 * was already built. The actual proposed change is two specific additions
 * inside describeError(), marked below:
 *   1. A message for when the connection times out (see INP-107) -- right
 *      now a timeout falls through to the generic "Something went wrong"
 *      message at the bottom, since there's no check for it at all.
 *   2. Telling apart "rate limited" from "quota fully exhausted" -- Google
 *      signals both with the same HTTP 429 status, but they need different
 *      advice: a rate limit is worth waiting a moment for, an exhausted
 *      quota is not, and the current code gives the same "wait a moment"
 *      message for both.
 */

function describeError(err){
  // PROPOSED ADDITION for INP-108, part 1: not present in the current
  // index.html -- an aborted (timed-out) request currently falls through
  // to the generic message at the bottom instead of this.
  if (err && err.name === "AbortError"){
    return "This is taking longer than expected — Gemini didn't respond in time. Try again.";
  }
  const msg = (err && err.message) || String(err);
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")){
    return "Couldn't reach the network — check your connection and try again.";
  }
  if (msg.includes("API_KEY_INVALID") || msg.includes("400")){
    return "Gemini rejected that API key — double-check it's correct and try again.";
  }
  if (msg.includes("429")){
    // PROPOSED ADDITION for INP-108, part 2: the current code just returns
    // the "wait a moment" message below for every 429, with no quota check.
    // Catches the exhausted-quota case specifically, since "wait a moment"
    // is actively wrong advice there (this exact error hit the team during
    // Sprint 1 harness testing on the free tier).
    if (msg.toLowerCase().includes("quota")){
      return "This API key has used up its available quota. Waiting a moment won't help — try a different key, or wait for it to reset (often 24 hours on the free tier).";
    }
    return "Rate limit hit on this key — wait a moment and try again.";
  }
  return "Something went wrong: " + msg;
}
