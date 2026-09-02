# ChalkMap website v2 — build spec (Pulse Azure Dark)

Owner-locked 2026-09-02: the website adopts the app's theme exactly. Research report and rationale:
https://claude.ai/code/artifact/9db7aac8-fc29-4bfe-bec4-c095b7900bb4

Static site, no build tooling at runtime. Output lives in `v2/` and is assembled by `v2/build.py`
(written by the orchestrator) which inlines `v2/sections/*.html` into `v2/index.html` and
concatenates `v2/assets/css/*.css` and `v2/assets/js/*.js` in a fixed order. **Each section agent
writes exactly three files and nothing else:** `v2/sections/<name>.html`, `v2/assets/css/<name>.css`,
`v2/assets/js/<name>.js`. Do not touch any other file. Do not create images.

## 1. Tokens (CSS custom properties, already defined by the shell in `base.css`; use them, never hex)

```
--bg:#0A0A0A  --surface:#161617  --elevated:#1F1F22  --subdued:#242427
--fg:#FAFAFA  --muted:#A3A3A3  --tertiary:#71717A  --on-accent:#0A0A0A
--accent:#38BDF8  --accent-bright:#7DD3FC  --accent-soft:rgba(56,189,248,.14)  --accent-bg:rgba(56,189,248,.10)
--accent-border:rgba(56,189,248,.35)
--hair:rgba(250,250,250,.10)   /* 1px hairline borders carry depth; no box-shadows */
--warning:#FBBF24 --danger:#F87171 --success:#4ADE80
--r-sm:4px --r:8px --r-lg:16px --r-xl:20px --r-pill:999px
--s1:4px --s2:8px --s3:12px --s4:16px --s5:24px --s6:32px --s7:48px --s8:64px --s9:96px --s10:128px
--font-display:"Inter Tight",system-ui,sans-serif
--font-body:"Inter",system-ui,sans-serif
--font-mono:"JetBrains Mono",ui-monospace,monospace
--font-ja-display:"Zen Kaku Gothic New","Noto Sans JP",sans-serif
--font-ja-body:"Noto Sans JP",sans-serif
--container:1200px  --gutter:clamp(16px,4vw,48px)
```

Type scale (desktop / mobile): display-xl `clamp(56px,11vw,168px)` weight 700 tracking -0.04em line-height 0.92;
display `clamp(40px,6vw,88px)` -0.035em/0.98; h2 `clamp(28px,3.6vw,48px)` -0.03em/1.05;
h3 22px/1.25; body 17px/1.55 (JA 1.7); small 14px; mono caption 11–12px uppercase tracking +0.08em weight 500.
JA text: `body[data-lang="ja"]` swaps display font to `--font-ja-display` (weight 700, tracking 0),
body to `--font-ja-body` weight 400→ use 500 on the dark canvas (JA glyphs need one weight up), line-height 1.7.
Headlines end with a period: "Mitake." / "御岳。" (signature; keep it).

## 2. Language mechanism (already in the shell)

Every text node with two languages is `<el data-en="…" data-ja="…"></el>` (empty inner; the shell fills it).
Images with locale variants use `<img data-src-en="…" data-src-ja="…" src="…">`. The shell toggles
`body[data-lang]` and fills all of them. Write BOTH languages for every string. **Copy source:** reuse the
existing EN/JA pairs from `../index.html` verbatim where the same idea exists (grep `data-ja=` there);
they are owner-approved translations. New JA lines: crag is エリア (never 岩場), never トポ as a product noun,
no em dashes anywhere (EN or JA), natural JA, short.

## 3. Motion contract (GSAP 3 + ScrollTrigger are loaded by the shell as globals; Lenis smooth scroll is on)

- Each section's JS exports `window.CM.register('<name>', function init(ctx){ … })` where
  `ctx = { gsap, ScrollTrigger, reduced /* boolean */, lang /* 'en'|'ja' */, onLang(fn) }`.
- If `ctx.reduced` is true, do NOT create scroll animations: leave the static layout (everything visible,
  lines fully drawn, counters at final value). The static layout must look finished on its own.
- Reveal, don't burst: reveals move 12–32px, 0.5–0.8s, `power2.out`/`power3.out`. **No bounce, no elastic,
  no overshoot, no scroll hijacking** (never intercept wheel/touch). One pinned section at a time.
- Animate only `transform` and `opacity` (and SVG `stroke-dashoffset` for the line). No layout properties.
  No `will-change` in CSS; GSAP handles it.
- Use `ScrollTrigger.matchMedia`/`gsap.matchMedia()` with `(min-width: 900px)` for pinned layouts; on
  narrower screens use simpler non-pinned reveals unless the section says otherwise.
- Use `100svh` for viewport heights, never `100vh`.
- Images: `<picture>` with WebP source + JPEG fallback, `loading="lazy"` except the hero (eager +
  `fetchpriority="high"`). Use the smallest variant that fits: 720 / 1200 / 1920 widths exist.

## 4. Assets (all under `v2/assets/`; paths are relative to `v2/index.html`)

Photos (owner's own, taken in the app; JPEG + WebP at 1920/1200/720, e.g. `assets/img/web/hero-1920.webp`):
- `hero-*` Rocky boulder (ロッキーボルダー) at Mitake (御岳), 4 lines incl. Egoisuto (エゴイスト). Landscape 4:3.
- `lines-*` Ninjagaeshi rock (忍者返しの岩) at Mitake, 8 lines. Landscape 4:3.
- `chapter1-*` Rocky boulder, other face, 4 lines. `chapter2-*` Kujira boulder (クジラ岩) at Ogawayama (小川山), 2 lines.
- Crag photos: `ogawayama-*`, `mitsumine-*`, `shimonita-*`, `mitake-*`, `una_roof-*` (Mitake area).
- App screenshots (phone-shaped PNG, EN/JA pairs): `assets/img/screen-map.png|screen-map-ja.png`,
  `screen-line(-ja).png`, `screen-recap(-ja).png`. Logo: `assets/img/chalkmap_logo.png`.
- Map image (may or may not exist at build time): `assets/img/japan-map.png` (dark Japan silhouette).
  The map section must work WITHOUT it (procedural fallback), and use it if present (`onerror` → fallback).

Data (JSON, fetch relative `assets/data/…`):
- `lines.json`: `{hero|lines|chapter1|chapter2: {boulder_ja, boulder_romaji, crag_ja, crag_romaji, w, h,
  problems:[{name_ja,name_romaji,grade:{summary_ja,summary_en,v_scale,dan_q}|{}, points:[{x,y,cp1,cp2}], starting_holds:[{x,y}]}]}}`.
  Points are normalized 0–1 over the photo. Segment k is a cubic Bézier from point[k-1] to point[k]
  using `point[k-1].cp2` and `point[k].cp1` as control points (null → use the endpoint itself).
  Render as an SVG `<path>` in a `viewBox="0 0 w h"` overlaid on the photo (`preserveAspectRatio="xMidYMid slice"`
  must match the photo's object-fit). Stroke `--accent`, width ≈ 0.45% of w, round caps/joins, opacity .85;
  starting holds as hollow circles r ≈ 0.9% of w, stroke-width same as the line.
- `crags.json`: `[{name_ja,name_romaji,lat,lng}]` for the 4 public crags.
- `stats.json`: `{public_crags, public_boulders, public_lines, boulder_photos}` honest live counts.

## 5. Sections (in page order) and their contracts

Shell provides: `<header>` nav (transparent over hero → solid), language toggle, footer, GSAP/Lenis,
`base.css` tokens + resets + `.container`, `.eyebrow` (mono caption), `.btn`, `.btn-primary`, `.btn-ghost`,
`.card` (surface + hairline), `.section` (padding `--s9` vertical), `.sr-only`.

### hero  (`sections/hero.html`, pinned ~180vh on desktop, ~130vh mobile)
Full-bleed `hero-1920` photo (`object-fit: cover`, `100svh`), a gradient scrim to `--bg` at the bottom
(so the next section blends), and an SVG line overlay for the "Egoisuto" problem (from `lines.json.hero`,
pick the problem whose `name_romaji` starts with "Egoisuto"; draw the others too at 0.35 opacity after it).
Layers (bottom → top): photo, scrim, SVG lines, text block. Text block bottom-left in the container:
- eyebrow mono: `MITAKE · TOKYO · ROCKY BOULDER` / `御岳 · 東京 · ロッキーボルダー`
- display-xl headline: `Mitake.` / `御岳。`
- sub (h3, muted→fg): `The hub for outdoor bouldering` / `外岩ボルダリングの情報を、ひとつの場所に。`
- lead (body, max 44ch): `Every crag, every line, every bit of local knowledge, kept current by the climbers who actually climb there.` / `エリアも、課題も、登り方も。実際に登るクライマーの手で、いつも最新に。`
- CTA row: App Store button (`https://apps.apple.com/app/id6746106211` placeholder → use `#download` if unsure), Google Play (`#download`), both `.btn-primary` / `.btn-ghost`; below, a tiny mono line `FREE · iOS & ANDROID · 日本語 / EN`.
- A line caption chip near the line's start hold, mono: `エゴイスト` + grade summary if present.
Scroll choreography (desktop): pin the section; over the pin, (1) photo scales 1.06 → 1 and its brightness
drops via an overlay opacity 0 → .35, (2) headline/text translate up 40px slower than scroll (parallax), (3) the
Egoisuto path draws itself with `stroke-dashoffset` scrubbed from 0% → 60% of the pin, start-hold rings pop
in (scale .6→1, opacity) at 60–70%, the caption chip fades in at 70%, the other lines fade to .35 at 80–100%.
Also a page-load sequence (not scroll): eyebrow, headline, sub, lead, CTAs stagger up 24px over 0.9s.
Mobile: no pin; line draws on enter (1.4s) after load; keep the photo `100svh`.

### map  (`sections/map.html`, pinned split on desktop)
Left column (sticky/pinned, 50%): a dark map card (`--surface`, hairline) showing Japan with the 4 public
crags as pins. Use `assets/img/japan-map.png` if it loads; otherwise a procedural fallback: a canvas or SVG
dot-grid (dots `--tertiary` at 18% opacity every 14px) with a faint azure contour ring. Pins are placed by
lat/lng with a simple equirectangular projection over Japan's bbox (lng 128–146, lat 30–46) so they land in the
right place on the silhouette; a pin = small azure dot + soft halo + mono label (romaji EN / 漢字 JA). Active pin
is bright with a pulsing halo (CSS animation, respects reduced motion); inactive pins at .45 opacity.
Right column: 4 steps, one per crag, each min-height 80vh: crag photo (`<picture>` 1200 variant, aspect 4:3,
`--r-lg`, hairline), eyebrow mono with prefecture (`NAGANO` / `長野`, `SAITAMA` / `埼玉`, `GUNMA` / `群馬`,
`TOKYO` / `東京`), h2 crag name with period (`Ogawayama.` / `小川山。` etc.), one-line body. Ogawayama body:
`One of Japan's most iconic classic climbing areas.` / `日本を代表するクラシックなクライミングエリア。`
Others: `Public on ChalkMap, with parking, access notes and every documented line.` / `ChalkMapで公開中。駐車場、アクセス情報、記録されたすべてのラインを確認できます。`
Section header above both columns: eyebrow `PUBLIC CRAGS · 公開エリア`, h2 `Real crags. Real access info.` / `本物のエリアと、本物のアクセス情報。`,
body: `ChalkMap launched in summer 2026. These are the first public crags. More open as establishers publish them.` /
`ChalkMapは2026年夏に公開されました。これが最初の公開エリアです。開拓者が公開するたびに、地図は広がります。`
Choreography: as each step enters the middle of the viewport, its pin becomes active and the step's photo
reveals (clip-path inset 8% → 0 plus opacity). Mobile: map card sticky at top (height 38svh), steps scroll under it.

### phone  (`sections/phone.html`, pinned on desktop)
Header: eyebrow `IN THE APP · アプリの中`, h2 `Built for the field.` / `現場で使える設計。`
Center: a CSS phone frame (rounded 44px, 1px hairline, subtle inner bezel, 300×650 on desktop, scales down)
with three screenshot layers stacked (map, line, recap; use `data-src-en/ja`). Left and right of the phone
(desktop) three captions that light up in turn; mobile: captions stacked under the phone.
Captions (existing copy): `Map · Crags & Boulders` / `地図 · エリアとボルダー`; `Lines · Drawn on the rock` /
`ライン · 岩の上に表示`; `Recap · Your climbing` / `まとめ · あなたの記録`. Each with one sentence from the
"What you can do" copy in `../index.html`.
Choreography: pin ~250vh; screenshots slide up through the frame (translateY 100% → 0 → -100%) one after
another, crossfading, scrubbed; the active caption gets `--fg`, others `--muted`. Frame itself has a
slight 3D tilt on entry (rotateY 12deg → 0). Mobile: no pin; three frames stacked with reveals.

### features  (`sections/features.html`)
Eyebrow `FEATURES · できること`, h2 `What you can do.` / `できること。`
Dense data blocks, not airy cards: a 3×2 grid (1 column mobile) of `.card` blocks each with an icon slot
(simple inline SVG line icon, 20px, `--accent`), h3, body, and a mono footer line with a concrete datum
(e.g. `GRADES · 10級 – 5段 · VB – V17`, `LINES · BÉZIER ON PHOTO`, `RISK · LANDING · HIGHBALL · SD`,
`OFFLINE · MAP TILES CACHED`, `PRIVACY · INVITE ONLY`, `LOG · SENDS · FLASHES · PROJECTS`). Use the six
existing feature copy pairs from `../index.html` ("Find boulders on a map" … "Track your climbing").
Above the grid a numbers strip from `stats.json`: four mono-labelled counters (`PUBLIC CRAGS`, `BOULDERS`,
`LINES`, `PHOTOS`) that count up on enter (1.2s, no bounce; reduced motion → final value).
Choreography: blocks stagger in (y 24px, 0.6s), hairline border brightens on hover.

### lines  (`sections/lines.html`)
A single wide photo moment: `lines-1920` (忍者返しの岩) with ALL 8 lines drawn from `lines.json.lines`,
each with a tiny mono label at its start hold (name_ja in JA, name_romaji in EN). Eyebrow
`MITAKE · NINJAGAESHI ROCK · 8 LINES` / `御岳 · 忍者返しの岩 · 8ライン`, h2 `The right line, made clear.` /
`正しいラインがひと目でわかる。`, body: existing copy "See each problem drawn on the boulder photo…" pair.
Choreography: lines draw in sequence as the photo enters (stagger 0.15s, each 1s), labels fade after.
Photo has a slow parallax (y -6% → 6%) across the section. Full-bleed on mobile.

### establishers  (`sections/establishers.html`, the quiet chapter, slowest on the page)
Eyebrow `FOR ESTABLISHERS · 開拓者の方へ`, h2 `Your crag, your call.` / `あなたのエリアは、あなたの判断で。`
Intro paragraph: existing "ChalkMap exists because of establishers…" pair. A vertical JA label
(`writing-mode: vertical-rl`, mono, `--muted`) reading `開拓者とともに` floats at the section's left edge on
desktop (hidden on mobile). Two offset photos: `chapter1-1200` offset right, `chapter2-1200` offset left, each
with a mono caption (`ROCKY BOULDER · MITAKE`, `KUJIRA BOULDER · OGAWAYAMA` / JA equivalents), reveals slower
(1s, y 32px). Four promise blocks using the existing pairs: "Private is a promise", "Open it when you're ready",
"Change your mind, safely", "Not a topo, but a tool for topos" (h3 + body, hairline-topped list, one column,
max-width 62ch). Then a manners block titled with the existing `Climb with respect` / `クライミングエリアへのリスペクト`
pair, the intro sentence, and the four `We ask everyone to:` bullets, plus the reporting line.
Choreography: everything reveals on enter with the slowest timings on the page (0.9–1.1s). No pin.

### tail  (`sections/tail.html`)
Three parts. (a) How it works: eyebrow `HOW IT WORKS · 使い方`, h2 `Discover · Climb · Log · Share` /
`使い方`, four steps in a row (1 col mobile) using the existing Discover/Climb/Log/Share pairs; a hairline
progress rule connects them and fills as you scroll. (b) FAQ: h2 `Questions, answered.` / `よくある質問。`,
accordion with the existing seven Q/A pairs from `../index.html` (copy verbatim, including `&#10;&#10;`
paragraph breaks rendered as paragraphs); one open at a time; buttons with `aria-expanded`. (c) Download
band with id `download`: h2 `Free on iOS and Android.` / `iOSとAndroidで、無料。`, the two store buttons
(`.btn-primary`), a `Contact Support` / `サポートに問い合わせ` ghost button linking `../support.html`, and
the mono line `FREE TO START · PREMIUM OPTIONAL · 無料で始められます`. The footer itself is in the shell.

## 6. Accessibility and Japan rules (binding)
- `prefers-reduced-motion: reduce` → static page (the shell sets `ctx.reduced`; also add a CSS
  `@media (prefers-reduced-motion: reduce)` guard for any CSS animation you write).
- Contrast: body text `--fg` on `--bg`; `--muted` only for captions/metadata. JA body weight 500.
- Focus visible on every interactive element (`outline: 2px solid var(--accent); outline-offset: 3px`).
- No text in images. All images have alt text in both languages via `data-alt-en/ja` (shell fills `alt`).
- Nothing loads from outside the repo except Google Fonts and the two script CDNs the shell already uses.

## 7. Definition of done for a section agent
1. The three files exist and are valid HTML/CSS/JS (no template syntax, no framework).
2. `node -e "require('vm').Script(require('fs').readFileSync('v2/assets/js/<name>.js','utf8'))"` parses.
3. Every visible string has both `data-en` and `data-ja`.
4. The section renders sensibly with JS disabled (static layout is complete).
5. Return a 10-line summary: what the section does on scroll, what it does with reduced motion, any asset
   or copy you could not find, and any deviation from this spec.
