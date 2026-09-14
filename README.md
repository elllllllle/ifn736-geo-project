# GEO Phase 2 Prototype

Static site for the GEO Phase 2 prototype (IFN736, Group 22). Deployed on GitHub Pages.

- `/` — findings dashboard (V1 recall vs V2 search-grounded vs V3 content-injected)
- `/chat/` — interactive chat demo — ask a travel question, compare Baseline vs Optimised (content-injected) responses from Gemini, with live Inclusion Rate / Ranking Position / rubric-score metrics per turn
- `/mockups/` — the 9 Flight Centre GEO mockup site variants used for V3 testing (an Incremental Comparison Ladder + Isolated Technique Variants), with a directory page linking to each

## Deploying to GitHub Pages

From this folder:

```bash
git init
git add .
git commit -m "GEO Phase 2 prototype: dashboard, chat demo, mockup sites"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root)**.

The site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two — dashboard at the root URL, chat demo at `/chat/`, mockup sites at `/mockups/`.

## About the chat demo's API key

The chat page calls the Gemini API directly from browser JavaScript, so each visitor pastes in
their own Gemini API key rather than the site shipping a shared one. The key lives only in that
browser tab for the session (sent straight to Google with each request, never stored or sent
anywhere else) and has to be re-entered on reload. This keeps things simple for a static,
GitHub-Pages-hosted demo, but it does mean each visitor needs their own key and is on the free
tier's rate limits.

If this ever needs to run with one shared key instead (e.g. so visitors don't need their own),
the options are:

1. Keep the repo private (needs a paid GitHub plan for Pages on a private repo).
2. Use a separate, rate-limited key you're fine with someone eventually finding.
3. Put a small server-side proxy in front of it (e.g. a Cloudflare Worker) so the browser never sees the real key.