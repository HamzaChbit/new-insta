# InstaVault

## Current scope: free Reels and video downloads

The product focuses on free Instagram Reels and video downloads. Stories, photo and carousel landing pages return 404 and are excluded from navigation, internal links, static routes and sitemap. Resolve responses return video files only. English SEO targets "Download Instagram Reels Free", with localized French and Arabic content. Legacy content definitions remain in source but are not routed or indexed.

GitHub Actions runs unit tests, the production build, and desktop/mobile browser tests on Ubuntu on each push or pull request. Deployment still needs a real domain, signing secret, and operator contact configuration. There are seven content routes per language, plus each localized homepage.

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

**This cannot reliably download every public Instagram link.** Instagram often requires login, blocks automated page access, or omits video URLs. In these cases the real backend returns an explicit error. Stories are unsupported and rejected. Carousels may expose only one image or incomplete metadata; the UI clearly says so. Images may be previews instead of full-resolution originals. Nothing is fabricated. User permission to save content is required. Site operators must verify that direct automated public-page access is permitted for their use and deployment before enabling it.

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
