# Verification in this workspace

- `npm install`: passed, audit reported zero vulnerabilities at installation.
- `npm test`: 10/10 passed.
- `npm run test:e2e`: 14/14 passed against the local Next.js development server, desktop Chrome and mobile Chromium.
- Local homepage: HTTP 200; browser preview opened.
- Production compilation and TypeScript: passed. Full `npm run build` did **not** complete: this Windows sandbox repeatedly returned `EPERM` while Next.js created `.next/server/app/*.segments/*` folders during prerendering. Both bundlers were tried, along with reduced worker concurrency and a specific output-directory permission grant. A production build and deployment remain unverified. Re-run the documented build on your machine or Vercel before launch.
- A live successful download was verified for the user-provided public Reel DdwnPyYu6IZ: resolve 200, download 200, video/mp4, 3,059,368 bytes, and MP4 ftyp header. The resolver now reads matching Reel video_versions from public embedded JSON. Public-page access can be blocked or omit media; Story extraction is now attempted, with exact media-ID matching. The supplied live Story returned no media and produced STORY_UNAVAILABLE; no successful live Story download has been verified. The UI success test uses an explicitly labelled test-only fixture.
- No Lighthouse performance score or Google ranking is claimed.

Playwright browsers were installed in the workspace `work/browsers` because this environment changes its temporary browser-cache location between commands. On a regular machine `npx playwright install chromium` is sufficient.

Latest scope: Stories removed; inputs are rejected before fetching. The Story landing page returns 404 and is absent from sitemap. Persistent Paste remains supported.

