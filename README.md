# InstaVault

## Tool pages and downloads

The Reels/Video selector now navigates to separate localized landing pages, each with its own H1, description, instructions, canonical URL and selected tool link. These tool links use full document navigation to avoid stale metadata from the dynamic root route during client transitions.

Results remain inside the tool page with its informational content. The Download button fetches the file, saves it via a browser download, and shows any expired-link or network error inside the result instead of navigating to a JSON response. Video previews use the signed same-origin proxy; failed previews show a visible fallback. The download endpoint streams approved CDN media, accepts one byte range for video playback, preserves inline/attachment disposition, and enforces the 40 MB ceiling. Page requests time out after 12 seconds; media transfers after 30 seconds.

Live verification after this update: the Reel DdwnPyYu6IZ resolved and downloaded as a 3,059,368-byte MP4. A preview request for bytes 0–1023 returned HTTP 206, the correct Content-Range and an MP4 ftyp header. Browser tests separately verify successful file saving, error display without navigation, and independent Reels/Video page metadata. Three-MB live media was verified; larger Vercel transfers still require deployment testing.

The user-supplied Story link was tested through VideoDropper's public UI and did produce a download link there. This proves that service returned a result, not that its upstream extraction method or a licensed integration is available to this application. No undocumented third-party downloader endpoint was added, and Stories remain disabled in this project.

## Reels and videos only

Stories have been removed from navigation, tabs, landing pages, sitemap and the resolver. Story links are rejected as invalid input before any upstream request. The public collection extractor was removed. Photo and carousel pages remain disabled. Paste stays visible on desktop and mobile.

Next.js App Router + TypeScript + Tailwind v4, shadcn-style Radix Button, Lucide, Framer Motion, and Zod. English at `/`, French at `/fr`, Arabic with RTL at `/ar`. White-and-red theme by default, with an optional red-accented night theme. Homepage SEO targets free Instagram downloads naturally in English, French and Arabic, with free Offer structured data and contextual internal links. Includes 10 translated content routes per language, metadata, canonical/hreflang links, sitemap, robots, Open Graph image, JSON-LD, mobile navigation, theme switching, clipboard controls and accessible forms.

## Start locally (Node 22+)

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. For a production build:

```powershell
npm run build
npm start
```

Set `DOWNLOAD_SECRET` to a random secret of at least 32 characters before production. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. This is a local signing key, not an API key. Development uses a temporary secret.

## Direct public metadata, no external API

At the user's request there is **no third-party API dependency**. `POST /api/media/resolve` accepts `{ "url": "https://www.instagram.com/reel/.../", "rights": true }`. It validates and normalizes the URL, fetches the public page once, and parses Open Graph tags, public HTML video sources, and public embedded JSON with Cheerio. Embedded Reel video_versions are accepted only from a media object whose code matches the requested Reel. It never logs in, replays cookies, accesses private endpoints, executes Instagram scripts, or bypasses restrictions. Reels require an actual video URL; covers are not presented as videos.

**This cannot reliably download every public Instagram link.** Instagram often requires login, blocks automated page access, or omits video URLs. In these cases the real backend returns an explicit error. Stories are not supported. Carousels may expose only one image or incomplete metadata; the UI clearly says so. Images may be previews instead of full-resolution originals. Nothing is fabricated. The UI links to terms instead of requiring a checkbox. Users remain responsible for having permission to save content. Site operators must verify that direct automated public-page access is permitted for their use and deployment before enabling it.

`GET /api/media/download?token=...` verifies a ten-minute HMAC token, permits HTTPS Instagram/Meta CDN subdomains only, checks DNS for public unicast addresses, refuses redirects, enforces content types, and downloads at most 40 MB. Request timeouts are 12 seconds. Serverless execution and response-size limits may impose smaller limits; for large media use a separately reviewed streaming backend. DNS validation precedes fetch; production egress controls should also block private networks to mitigate DNS rebinding. No arbitrary remote URLs are accepted by the API.

The rate limiter is bounded and per server instance (12 requests/minute shared by resolve/download). It is not a distributed abuse prevention system. Configure deployment-wide Vercel Firewall rate limiting for `/api/media/*`. The Vercel trusted forwarded header is used only on Vercel; local requests share a bucket. Raw network addresses are not stored by application code. Host logs are outside application control.

## Vercel

1. Import this folder into a Git repository and create a Vercel project with the Next.js preset and Node 22+.
2. Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS domain (without a trailing slash).
3. Set the strong `DOWNLOAD_SECRET`. Optionally set `NEXT_PUBLIC_CONTACT_EMAIL` and `GOOGLE_SITE_VERIFICATION` (the Search Console HTML verification token).
4. Deploy. Submit `/sitemap.xml` to Search Console. Check all three language URLs and canonical URLs on the real domain.
5. Configure firewall limits and hosting log retention. Review the starter privacy/terms text and provide real operator contact information before a public launch.

No deployment or ranking guarantee is included. No provider credential is needed. For a future authorized provider, replace only the resolver's public-page extraction with a server-side licensed integration returning the same result shape. Validate its returned media hostnames and rights contract; do not expand the downloader into an arbitrary URL proxy. Store any future keys only in server-side environment variables.

## Checks

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit tests cover URL/host validation, metadata extraction, honest errors, signature tampering and rate limiting. Playwright checks desktop/mobile layout, SEO, navigation, Arabic RTL, real API validation, missing pages and the UI download contract. The success workflow is explicitly mocked **only in the test**, not the application. A live download of the user-provided public Reel DdwnPyYu6IZ was verified: resolve HTTP 200, download HTTP 200, video/mp4, 3,059,368 bytes, and a valid MP4 ftyp header. Other public links can still be restricted. No Lighthouse score is claimed without a measured report.

## Structure

- `src/app/[[...path]]`: static localized homepage and content pages
- `src/app/api/media`: real resolve and download route handlers
- `src/lib/media.ts`: URL validation and public metadata extraction
- `src/lib/server.ts`: guarded fetch, token signatures, limits and error mapping
- `src/lib/content.ts`, `pages.ts`: translations and distinct page content
- `src/components`: responsive interface and UI primitive
- `tests`: unit and Playwright suites

There is no contact form pretending to deliver mail. A real mail link appears when the operator configures an email address. Generic unexpected-error and 404 screens are in English; normal pages, controls, FAQs and media errors are translated.


