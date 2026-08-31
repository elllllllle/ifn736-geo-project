# GEO Phase 2 Prototype

Static site for the GEO Phase 2 prototype (IFN736, Group 22). Deployed on GitHub Pages.

- `/` — findings dashboard (V1 recall vs V2 search-grounded vs V3 content-injected)
- `/chat/` — interactive chat demo (placeholder for now, build to follow)

## Deploying to GitHub Pages

From this folder:

```bash
git init
git add .
git commit -m "GEO Phase 2 prototype: dashboard + chat placeholder"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root)**.

The site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two — dashboard at the root URL, chat demo at `/chat/`.

## Before building the chat interface

If the chat page calls the Gemini API directly from browser JavaScript, the API key will be
readable in the page source on the live (public) site — GitHub Pages only serves static files,
so there's no server to hide a key behind. Options when you get there:

1. Keep the repo private (needs a paid GitHub plan for Pages on a private repo).
2. Use a separate, rate-limited key you're fine with someone eventually finding.
3. Put a small server-side proxy in front of it (e.g. a Cloudflare Worker) so the browser never sees the real key.
