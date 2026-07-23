# MATRICA REAL ESTATE LTD — FEATURES SPECIFICATION (PRD v7.1)
### Functional / Feature-Only Build Document — *Premium Multi-Project Land Developer*

> **Design intentionally excluded.** This document specifies **features, behavior, data, and integrations only** — no colors, fonts, layouts, spacing, component styling, or motion. Visual design is handled separately. Supersedes v7.0 for scope purposes.

---

## 0. HOW TO USE THIS DOCUMENT

Any AI coding assistant or developer should be able to build the full feature set from this document. It defines **what the site does**, its **data sources**, its **modules**, and its **behaviors** — not how it looks.

**Build order:**
1. §0–§1 (context + rules) → set up project
2. §2 (information architecture) → confirm routes & page map
3. §3 (database) → Supabase schema (**DB + Auth + Edge Functions only — NO Supabase Storage**)
4. §4 (media system) → `upload.php` + admin upload widget
5. §5 (shared-hosting PHP) → PHP files + `.htaccess`
6. §6 (global shell) → header, footer, floating elements, exit-intent mount
7. §7 (lead engine) → site-wide conversion system
8. §8–§18 (public pages) → build each
9. §19 (admin panel) → build each module
10. §20–§25 (SEO, scoring, automation, AI, performance, roadmap)

**Critical functional rules:**
- **No visible pricing and no plot-map inventory on the public site.** Pricing is lead-gated (brochure / call / WhatsApp). See §1.4.
- The site supports **multiple projects** with lifecycle statuses. Nothing is hardcoded to "Ventura City."
- **Product is land / plots only.** No flats, no apartments anywhere.
- **All media lives on shared hosting** under `/uploads/`, uploaded via `upload.php`. Supabase Storage is **never** used. See §4.
- Every admin image field is an **upload widget**, never a URL text input. See §4.3.
- All content (text, images, project data, team, blog, gallery) comes from Supabase tables — nothing content-related is hardcoded.
- Public pages must be **prerender-friendly** (static HTML at build time). Admin is a normal SPA.
- No `<form>` tags in React — use `onClick` / `onChange` handlers.
- No `localStorage` / `sessionStorage` for app data — all state from Supabase. (Allowed: one cookie for consent, one for exit-popup suppression.)
- Images served as WebP; all uploads auto-convert to WebP. Alt text required on images.
- **Office address and project addresses are completely different** and must never be conflated (§1, §10, §16).

---

## 0.1 WHAT CHANGED FROM v6.0 (functional scope)

| Area | v6.0 | This spec (v7.x) |
|---|---|---|
| Pricing | Prices shown everywhere | **No public pricing.** Lead-gated brochure / inquiry only |
| Plot inventory | Katha cards, availability counters, scarcity alerts | **Removed.** Editorial presentation + downloads + inquiry drive conversion |
| Projects | Single project (Ventura City) hardcoded | **Multi-project** with statuses: Ongoing / Upcoming / Ready / Completed |
| Product type | Mixed land/flat language | **Land / plot only** |
| Maps | One generic location block | **Per-project embedded Google Map** + separate office map on Contact |
| Team | Basic grid | **Management team + leadership message** (Chairman/MD) |
| Gallery | Simple image grid | **Advanced: admin categories + images + YouTube video + lightbox with zoom** |
| Media storage | Supabase / mixed | **100% shared hosting `/uploads/` via `upload.php`**, WebP auto-conversion |
| Lead capture | One home form | **Site-wide lead engine**: exit-intent popup, inline blocks, sidebar, sticky bar, blog forms, WhatsApp + email welcome |
| Blog | Basic listing | **SEO/GEO/AEO-grade** blog: categories, author E-E-A-T, schema, internal linking, embedded lead capture |

---

## 1. PROJECT OVERVIEW

**Company:** Matrica Real Estate Ltd. · **Website:** matricabd.com
**Business model:** Land aggregation — the company acquires land parcels and sells them to clients by size (katha). Inventory is managed **internally**; it is **not** shown publicly as numbered plots or a plot map.
**Product:** Land / plots only. No flats or apartments.
**Projects:** Multiple. Current flagship is **Ventura City** (Purbachal–Kanchan corridor, Dhaka). Additional projects are under development and will be published from the admin panel. Every project is treated generically.

**Corporate office (where clients meet the team):** Level-5(C), House-30, Road-42/43, Gulshan-2, Dhaka.
**Project sites are located elsewhere.** Office address and project addresses are entirely separate. The Contact page shows the **office** map; each project page shows **that project's** map.

**Hotline:** 01711-775538 · **Email:** info@matricabd.com · **Facebook:** facebook.com/matricabd

### 1.1 Primary goals
1. Generate high-quality leads (name + phone) from organic traffic.
2. Build a trustworthy brand (EEAT + local authority).
3. Present projects compellingly so visitors want to inquire.
4. Convert leads via AI WhatsApp + email nurture, then to sales.
5. Rank across SEO / AEO / GEO / Local SEO for Purbachal & Dhaka land intent.
6. Be 100% responsive and behave like a native mobile app on phones.

### 1.2 What this site IS
- A **multi-project** land-developer platform (projects have lifecycle statuses).
- A **lead-generation engine** with site-wide conversion touchpoints.
- A **fully dynamic, admin-managed** platform (content, media, projects, team, blog, gallery).
- An **SEO / AEO / GEO / Local-SEO / EEAT** platform for organic growth.

### 1.3 What this site is NOT
- NOT a plot-map subdivision tracker (no numbered plots, no per-plot status).
- NOT a flat/apartment site.
- NOT a site where prices are shown publicly.
- NOT a WordPress or generic template site.

### 1.4 Pricing & inventory policy (functional rule)
- **No prices anywhere on the public frontend** (home, project pages, programmatic pages).
- **No plot map, no katha-availability cards, no "X katha remaining" counters.**
- Where a price would appear, show a **conversion action** instead: "Request Price List", "Get Details on WhatsApp", "Book a Site Visit", or "Download Brochure" (gated).
- Pricing exists **internally** (admin-only + AI/WhatsApp context) but is never rendered to anonymous visitors. See §3.6 and §19.4.

---

## 2. INFORMATION ARCHITECTURE & SITEMAP

Projects have a **status lifecycle**:

| status | meaning (LAND) | public label |
|---|---|---|
| `ongoing` | Development in progress (roads, utilities, filling) | Ongoing |
| `upcoming` | Announced, acquisition/planning phase | Upcoming |
| `ready` | Developed, plots ready for booking/registration | Ready |
| `completed` | Fully sold / handed over | Completed |

### 2.1 Public routes
```
/                              Home
/projects                      All projects (tabbed: Ongoing | Upcoming | Ready | Completed)
/projects/:slug                Project detail (own map, downloads, inquiry — NO pricing/plot map)
/why-purbachal                 Location pillar page (SEO)
/locations/:area               (optional) area pillar pages
/about                         About Matrica
/leadership                    Management team + Chairman's/MD's message (§12)
/gallery                       Advanced gallery (categories + image + video, §11)
/blog                          Blog listing (§14)
/blog/:slug                    Blog article (§14)
/blog/category/:slug           Blog category archive
/contact                       Contact (OFFICE map, §16)
/site-visit                    Book a site visit (§17)
/faq                           FAQ
/landowner                     Landowner proposal page (§18)
/privacy, /terms               Legal
/projects/:slug/:size-slug     (optional programmatic SEO) — NO price, content + inquiry only
```

### 2.2 Admin routes — see §19.

### 2.3 Global navigation
```
Home · Projects ▾ (Ongoing / Upcoming / Ready / Completed / All)
Why Purbachal · Gallery · Blog · About ▾ (About / Leadership / Landowner) · Contact
Right: Hotline (tel:) + "Book a Visit"
```

---

## 3. DATABASE SCHEMA (Supabase — DB + Auth + Edge Functions ONLY)

> **Supabase Storage is NOT used.** The `media` table stores URLs returned by `upload.php` (files live on shared hosting under `/uploads/`). YouTube videos store only a `youtube_id`.
>
> **Free-tier note:** Supabase free projects pause after ~7 days of inactivity. Add a keep-alive cron (`GET /api/keepalive.php` → tiny Supabase query) every 3 days.

### 3.1 Media
```sql
media (id uuid pk, kind text,            -- 'image'|'pdf'|'video_youtube'
  original_url, webp_url, sizes jsonb,   -- {"480":url,"960":url,"1440":url,"1920":url}
  lqip text, youtube_id text,
  width int, height int, file_size int, mime_type text,
  alt_text text,                          -- required for images
  title, caption, folder, created_by uuid, created_at timestamptz)
```

### 3.2 Projects (multi-project, status-driven, NO plot tables)
```sql
projects (id uuid pk, name, name_bn, slug unique,
  status text,             -- 'ongoing'|'upcoming'|'ready'|'completed'
  publish_status text,     -- 'draft'|'published'|'archived'
  tagline, tagline_bn, summary, summary_bn, description, description_bn,
  hero_media_id uuid, card_media_id uuid,
  location_area, location_address, location_lat numeric, location_lng numeric,
  map_embed_url text,      -- THIS project's Google Maps embed src
  land_type default 'land', possession_note, rajuk_note,
  featured boolean, sort_order int,
  meta_title, meta_description, og_media_id uuid, created_at)

-- INTERNAL pricing/sizing (NEVER public; admin + AI context only)
project_sizing_internal (id, project_id, size_name, size_katha numeric,
  price_per_katha numeric, notes, status, sort_order)

-- controls which sections/tabs render on the project page
project_features (id, project_id, feature_key, enabled boolean, sort_order, config jsonb)
  -- feature_key: overview|location|highlights|amenities|gallery|progress|documents|testimonials|faq|inquiry

-- viewable/downloadable documents per project
project_documents (id, project_id,
  doc_type text,           -- 'location_map'|'layout_plan'|'brochure'|'custom'
  label, label_bn, media_id uuid,
  viewable boolean, gated boolean,   -- brochure typically gated
  version int, download_count int, enabled boolean, sort_order)

project_highlights (id, project_id, icon_name, text, text_bn, sort_order, enabled)
amenities (id, project_id, name, name_bn, icon_name, image_id, description, sort_order, enabled)
landmarks (id, project_id, name, name_bn, distance, distance_unit, type, icon_name, sort_order)
progress_updates (id, project_id, title, title_bn, description, image_id, date, sort_order)
```

### 3.3 Advanced Gallery (categories + image + video)
```sql
gallery_categories (id, name, name_bn, slug unique, cover_media_id, project_id null, sort_order, enabled)
gallery_items (id, category_id, media_id, media_type text /* 'image'|'video' */,
  title, title_bn, caption, sort_order, enabled, created_at)
```

### 3.4 Leadership / Team + message
```sql
team_members (id, name, name_bn, designation, designation_bn, photo_id,
  phone, email, linkedin, category text /* management|sales|advisory */,
  is_leadership boolean, message, message_bn, message_signature,
  bio, bio_bn, sort_order, status default 'active')
```

### 3.5 Leads & CRM
```sql
leads (id, name, phone, email, nid,
  source text,     -- website|exit_popup|blog|whatsapp|facebook|google|referral|contact|site_visit|landowner|newsletter
  landing_page, referrer, utm jsonb, project_id null, size_preference null, message,
  asset_context null, form_context null,
  status default 'new',   -- new|contacted|qualified|site_visit|reservation|negotiation|won|lost
  score int, tier text,   -- hot|warm|cool|cold
  assigned_to jsonb default '[]',   -- [{user_id, role, assigned_at}]
  consent boolean, created_at)
lead_activities (id, lead_id, type, description, metadata jsonb, actor, created_at)
lead_notes (id, lead_id, author_id, note, created_at)
```

### 3.6 Blog
```sql
blog_categories (id, name, name_bn, slug unique, description, seo_title, seo_description, sort_order)
blog_posts (id, title, title_bn, slug unique, category_id,
  excerpt, excerpt_bn, body, tldr,
  featured_image_id uuid, author_id uuid /* fk team_members */, reading_time int,
  status,   -- draft|published|scheduled
  published_at, scheduled_at,
  meta_title, meta_description, og_media_id, canonical_url,
  focus_keyword, secondary_keywords jsonb, faqs jsonb /* [{q,a}] */,
  related_project_ids jsonb, view_count, created_at, updated_at)
```

### 3.7 Config, forms, popup, nurture, misc
```sql
settings (id, key, group, value jsonb)
  -- groups: general, office (address+hours+map_embed_url), hero, stats, trust, footer, nap,
  --         whatsapp, smtp, ai, payments(internal)
lead_forms (id, key, title, title_bn, fields jsonb, submit_label, success_message, success_message_bn, enabled)
popup_config (id, key, enabled, trigger jsonb, headline, headline_bn, subcopy, image_id,
  offer_label, suppress_days int, target_rules jsonb)
nurture_sequences (id, name, trigger_type, status)
nurture_steps (id, sequence_id, step_order, delay_minutes, channel, template_key, template_config jsonb, condition jsonb)
nurture_enrolments (id, sequence_id, lead_id, current_step, status, started_at, last_step_at)
testimonials (id, project_id, name, name_bn, photo_id, occupation, quote, quote_bn, rating,
  video_media_id null, status, sort_order)
faqs (id, category, project_id null, question, answer, status, sort_order)
scripts (id, name, script_type, code, placement, enabled, consent_required, sort_order)
profiles (id, user_id, name, phone, role, avatar_id, status)   -- admin users
audit_log (id, user_id, action, entity_type, entity_id, metadata jsonb, ip, created_at)
pages (id, slug, title, body, meta_title, meta_description)     -- privacy/terms/landowner
```

### 3.8 Google Maps embeds (functional rule)
- **Office map** → `settings.office.map_embed_url` (Contact + About + Leadership + footer).
- **Project map** → `projects.map_embed_url` per project (only on that project's page).
- Store the Google Maps embed `src`; render in a lazy `<iframe loading="lazy" title="...">`. Never hardcode one map site-wide.

---

## 4. MEDIA SYSTEM — SHARED HOSTING UPLOADS (NO SUPABASE STORAGE)

Hard requirement (Supabase free plan). All media — images, PDFs, video poster frames — upload to shared hosting `/public_html/uploads/` via `upload.php`. Supabase stores only the returned URLs. YouTube videos store only `youtube_id`.

### 4.1 Flow
```
Admin picks a file → browser POSTs to https://matricabd.com/upload.php (auth header)
  → upload.php validates, converts image → WebP, generates 480/960/1440/1920 + LQIP
  → saves under /uploads/YYYY/MM/<uuid>.webp (+ original fallback)
  → returns { webp_url, original_url, sizes, lqip, width, height, file_size, mime_type }
  → frontend INSERTs a `media` row and stores media.id on the parent record
```

### 4.2 WebP policy + admin guidance (feature)
- `upload.php` **auto-converts** JPG/PNG → WebP (~quality 82), so admins can upload JPG/PNG safely.
- The upload widget **encourages WebP**: hint text ("WebP recommended for speed & SEO; JPG/PNG auto-converts"), a format badge (shows "WebP ✓" when already WebP), and a **"How to convert to WebP"** helper with 3 methods: Squoosh.app (recommended), Photoshop Export As → WebP, and `cwebp -q 82 in.jpg -o out.webp` / bulk online tools.
- If input is already WebP, skip conversion (preserve quality); still generate responsive sizes + LQIP.
- **Alt text required** on images before save (a11y + SEO); offer AI alt-text if AI configured.

### 4.3 Upload widget (REPLACES every image URL input)
> No admin field anywhere accepts a raw image URL. Every image input is this widget.
```
Props: value(media_id|null), onChange(media_id), accept('image'|'pdf'|'any'), label, required
Behavior:
  - empty → drop-zone (click/drag), format hint, WebP helper link
  - on select → progress → calls upload.php → INSERT media row → set value
  - value set → preview + filename + size + [Replace] [Edit alt/title] [Remove]
  - "Choose from Media Library" → picker modal (reuse existing uploads)
  - PDF mode → file icon + name + size (no image processing)
Validation: max 20MB; images jpg/png/webp; pdf allowed for documents; errors inline
```

### 4.4 Video (YouTube) handling (feature)
- Videos are **not uploaded**. Admin pastes a YouTube URL → extract `youtube_id`, store `media` row `kind='video_youtube'`, fetch thumbnail (optionally re-host as WebP poster via `upload.php`).
- Frontend uses a **facade**: poster + play button; the YouTube iframe loads only on click (protects performance).

---

## 5. SHARED HOSTING PHP FILES

### 5.1 `upload.php`
```
Location: public_html/upload.php
Security: require Authorization: Bearer <UPLOAD_TOKEN> (+ optional Supabase JWT check);
  CORS allowlist matricabd.com; verify mime with finfo; sanitise filenames; max 20MB.
Allowed: image/jpeg, image/png, image/webp, application/pdf.
Image processing (Imagick preferred, GD fallback):
  1. JPG/PNG → WebP q82 (already-WebP kept); strip EXIF; auto-orient
  2. widths 480/960/1440/1920 (no upscaling); 3. LQIP 20px blurred base64
  4. save /uploads/YYYY/MM/<uuid>-<w>.webp + master + original fallback
PDF: save as-is; return url + size.
Response JSON: { webp_url, original_url, sizes{}, lqip, width, height, file_size, mime_type }.
Log failures to /uploads/_logs/upload.log. /uploads dir writable (755/775).
```
`/uploads/.htaccess`: deny script execution inside uploads; long-cache image/pdf.

### 5.2 `asset-deliver.php`
```
Serve GATED documents (brochure) after lead capture.
?token=xxx (single-use, TTL ~24h) → validate against Supabase → stream with attachment header
  → increment download_count → mark used. Invalid/expired → 403.
```

### 5.3 `webhook-whatsapp.php`
```
GET → verify token (WhatsApp Cloud API handshake).
POST → validate X-Hub-Signature → forward message to Edge Fn 'ai-concierge' (inject project+lead context)
  → return 200 immediately.
```

### 5.4 `keepalive.php`
```
Cron every 3 days → tiny Supabase query so the free-tier project never auto-pauses.
```

### 5.5 `.htaccess` (site root) — behaviors
```
Force HTTPS; non-www canonical redirect; long-cache static assets; security headers
(X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy);
block .env/.sql/.ht*; SPA fallback to index.html (serve real files, php, static, sitemap/robots/llms first);
gzip/brotli for text assets.
```

---

## 6. GLOBAL SHELL (functional)

### 6.1 Top bar
Hotline + email + office short address + social links. Data: `settings.general` + `settings.office`. (Hidden on mobile; info moves into the mobile panel.)

### 6.2 Header
Sticky. Logo (from settings), primary nav, **Projects mega-menu grouped by status** (lists published projects + "All Projects"), **About menu** (About / Leadership / Landowner), hotline, and a "Book a Visit" action. Active-route indication. Adds a scrolled state via IntersectionObserver.

### 6.3 Mobile slide panel
Slide-in nav: full link list, expandable Projects (by status) and About groups, large Call + WhatsApp actions, "Book a Visit", office address + hours. Close on X / backdrop / Escape / route change.

### 6.4 Footer
Brand + socials + trust marks (RAJUK/REHAB); Explore links; Projects grouped by status; **office** contact block (address, hotline, email, hours) with "Get Directions" to office map; optional newsletter capture (creates `source='newsletter'` lead); legal links + copyright.

### 6.5 Floating buttons + mobile sticky bar
Desktop: WhatsApp + Call floating actions. Mobile: sticky bottom bar (Call / WhatsApp / Inquire); "Inquire" opens the lead modal; bar hides when footer is in view. Controlled by settings.

### 6.6 SEO head (every public page)
Unique title + meta description, canonical, OG + Twitter tags, favicon, hreflang (bn/en where used), JSON-LD per page type (§20), and enabled head scripts.

### 6.7 Consent banner
Shows only if a script requires consent and no consent cookie exists. Accept-all / reject-non-essential. Cookie `matrica_consent` (365d). Gated scripts load only on accept.

---

## 7. LEAD CAPTURE & CONVERSION ENGINE (site-wide)

Commercial core: maximise quality leads and move them toward sale. Capture is present on every page.

### 7.1 Touchpoints
1. Hero primary CTA (home + project) 2. Sticky Inquiry sidebar (project) 3. Inline "Request Price List / Brochure" (gated, project) 4. **Exit-intent popup** (site-wide) 5. Blog inline + end-of-post + sticky mini-bar 6. Footer newsletter 7. Mobile sticky "Inquire" 8. Contact & Site-visit forms 9. Floating WhatsApp/Call.

### 7.2 Exit-intent popup (REQUIRED)
```
Trigger (popup_config):
  Desktop: mouse leaves toward top (mouseout, clientY<=0).
  Mobile: fast upward scroll OR back-intent OR 45s dwell + scroll depth >60%.
  Fire once per session; suppress for suppress_days (default 7) via cookie matrica_popup_seen.
  Never on admin, thank-you states, if a lead already submitted this session, or within 10s of load.
Content (from popup_config): headline, subcopy (value promise: location map + layout plan + 30-min callback),
  fields Name + Phone (validated) + optional Project; primary CTA; WhatsApp/Call alternative; privacy note.
On submit: validate → INSERT lead {source:'exit_popup', form_context, landing_page, utm, project_id?}
  → fire on-lead-created (WhatsApp welcome + welcome email) → SUCCESS state → set suppression cookie.
target_rules can vary headline/image by page type.
```

### 7.3 Reusable capture components
- **LeadModal(formKey)** — opened by any "Inquire"/"Book a Visit"/"Request Details" trigger; fields + copy from `lead_forms`.
- **LeadInline(variant, formKey)** — section-level capture (band / card / split) used on home, projects, and blog.
Both use the same submit pipeline (§7.5). Bottom-sheet on mobile.

### 7.4 Smart lead integration on blog single posts
- Sticky sidebar Inquiry card (desktop).
- Slim inline "Get the price list" band after the intro/first H2 (contextual to the post's related project).
- Full split capture block at end of post + related-project card.
- Sticky mobile mini-bar with one-tap "Get Info Pack".
- Contextual CTA injection: posts referencing a project prefill `project_id`.
- All blog leads set `source:'blog'`, `form_context:'blog:<slug>'`.

### 7.5 Post-submit automation (every lead)
```
Edge Fn on-lead-created:
  1. lead scoring (§21) → score + tier
  2. auto-assign (round-robin / AI) → assigned_to
  3. WhatsApp welcome (Cloud API template, concierge "Rafi")
  4. welcome EMAIL (SMTP, branded): highlights + gated brochure token (asset-deliver.php) + office/map + next steps
  5. enrol in welcome nurture sequence
  6. Telegram alert to assigned rep (hot flagged)
  7. log lead_activities
```

### 7.6 Success state
Confirmation message + "details sent to your WhatsApp, callback within 30 min" + [Open WhatsApp] + [Download Brochure] (if gated token issued) + social-proof count ("joined by N this week").

### 7.7 Lead-to-SALE toolkit (features to enable)
Instant WhatsApp handoff (AI concierge, 24/7) → books visits; site-visit booking with free Gulshan pickup; callback-in-30-min SLA with Telegram alerts; multi-step WhatsApp+email nurture; re-engagement at 7/30 days; gated brochure/price-list; project-specific personalised email; testimonials/video near CTAs; retargeting pixels (consent-gated); "Register interest" waitlist for Upcoming projects; scoring/tiering so sales prioritise hot leads; referral ask on won, reason capture on lost.

### 7.8 Validation & anti-spam
Phone regex `^01[3-9]\d{8}$`; name ≥2 chars; email validated if present; honeypot + min-time-to-submit; IP rate-limit in Edge Fn; dedupe by phone within 24h (update, not duplicate).


---

## 8. HOME PAGE — `/` (sections + data, no styling)

Multi-project, no prices, no plot cards. Sections:

1. **Hero** — full-bleed imagery from `settings.hero` slides (single or slow crossfade); headline/sub (bn+en); CTAs "Explore Projects" + "Book a Visit". Preload hero image.
2. **Brand intro** — short brand statement + stat row (`settings.stats`, count-up on view) + "Learn more" → /about.
3. **Featured projects** — editorial cards from `projects` (published, `featured`, sort_order): card image, status badge, name, location, 1-line tagline, "Explore →". Upcoming → "Register Interest" (LeadModal waitlist). **No price / no katha counts.**
4. **Why Matrica** — 3-4 trust pillars (icon + title + line) from settings.
5. **Location strength** — corridor copy + landmark chips (from a flagship project) + "Why Purbachal →".
6. **Leadership message teaser** — portrait + pull-quote from `team_members` (is_leadership, first) + "Read our vision" → /leadership.
7. **Gallery teaser** — preview of 6-8 `gallery_items` (mixed image + video) + "View full gallery".
8. **Testimonials** — video (YouTube facade) + text testimonials; stars, quote, name, occupation; filter by project optional.
9. **Inline lead capture** — LeadInline (split): image + Name/Phone/Project + CTA + WhatsApp/Call alt.
10. **Blog teaser** — 1 featured + 3 recent posts → /blog.
11. **Final CTA band** — headline + Book a Visit + Hotline + WhatsApp.
12. **JSON-LD** — Organization + RealEstateAgent (no priceRange) + WebSite.

---

## 9. PROJECTS LISTING — `/projects`

- Short intro strip.
- **Filter tabs:** All | Ongoing | Upcoming | Ready | Completed (from `projects.status`, counts shown, deep-linkable `?status=`). Optional `location_area` sub-filter.
- Editorial project cards (same fields as home §8.3) → /projects/:slug. Upcoming also → "Register Interest".
- Empty state per tab: "New projects coming soon — register interest".
- **No prices, no availability anywhere.**
- JSON-LD: CollectionPage + ItemList + BreadcrumbList.

---

## 10. PROJECT DETAIL — `/projects/:slug`

Sections render/hide per `project_features`. **No pricing, no plot map.**

1. **Hero** — `hero_media_id`; status badge, location eyebrow, name, tagline (bn+en); CTAs Book a Visit / Request Details / WhatsApp; trust chips (RAJUK, possession_note — no numbers/prices).
2. **Sticky tab nav** — tabs from enabled features in order: Overview · Location · Highlights · Amenities · Gallery · Progress · Documents · Testimonials · FAQ · Inquiry. Scroll-spy + smooth-scroll.
3. **Layout** — main content + sticky Inquiry sidebar (desktop); single column + inline inquiry + sticky "Inquire" bar (mobile).
4. **Overview** — description, summary, highlights; quick-facts strip (Area, Land type, Roads, Possession, Status) — **no price**.
5. **Location** — `location_address` + `location_area` (clearly the project site, distinct from office); **this project's Google Map embed** (`projects.map_embed_url`, lazy iframe); landmark chips + "Get Directions"; link to /why-purbachal.
6. **Documents** (§10.7 below).
7. **Inquiry sidebar** — Name, Phone, Size preference (**names only, no price**), optional Message, CTA; direct Call/WhatsApp/Email; document quick links; trust chips. Submit → §7.5 with `project_id`.
8. **Amenities / Highlights / Progress / Testimonials / FAQ / Gallery** — from respective tables, filtered to this project. Gallery uses the advanced lightbox (§11). FAQ has search + FAQPage schema.
9. **JSON-LD** — Place + RealEstateListing (**no offers/price**) + BreadcrumbList (+ FAQPage).

### 10.7 Documents (view + download)
From `project_documents` (enabled): Location Map · Layout Plan · Brochure · custom. Each: label + size + version, plus:
- **View** → inline viewer (image → lightbox/zoom; PDF → embedded viewer or new tab).
- **Download** → if `gated=false` direct; if `gated=true` (brochure typical) → LeadModal(formKey='document') → single-use token → download via `asset-deliver.php`; increment `download_count`.

---

## 11. GALLERY MODULE — `/gallery` (advanced)

Admin-managed categories, images + YouTube videos, lightbox with zoom.

- **Category tabs** from `gallery_categories` (enabled, sort_order): "All" + each; optional sub-filter Images | Videos | All (`media_type`).
- **Grid** of mixed tiles. Image tile: WebP, caption on hover, opens lightbox. Video tile: poster + play button + duration; opens video modal.
- **Load more** in batches (12–16) — not infinite (perf + crawlability).
- **Lightbox (images) with ZOOM:** prev/next (arrows + swipe), close (X/Escape), counter, caption + category; zoom via click/tap (up to ~3x), pinch-to-zoom, drag-to-pan when zoomed, double-tap reset, wheel zoom; preload neighbors; LQIP while loading; thumbnail strip (desktop). Keyboard ← → Esc + / -.
- **Video modal:** YouTube facade (iframe loads on click only).
- **Admin** (§19.7): CRUD categories (create/rename/reorder/cover/project link) and items (image via upload widget OR YouTube URL, category, caption, reorder, enable).
- **SEO:** image alt text; ImageGallery / VideoObject JSON-LD; lazy-load; canonical to /gallery.

---

## 12. ABOUT — `/about`
Story + office photo; Mission & Vision; Values; Milestones; Legal & compliance (RAJUK, registration, REHAB, tax — EEAT); **office block with office Google Map embed** (`settings.office.map_embed_url`), address, hours, hotline (clearly the corporate office, distinct from project sites); leadership teaser → /leadership; partner logos. JSON-LD: Organization + BreadcrumbList.

## 13. LEADERSHIP — `/leadership` (management team + message)
- **Chairman's/MD's message:** portrait (`is_leadership`) + `message`/`message_bn` + `message_signature`; multiple leaders → stacked messages.
- **Management team grid:** `team_members` (category='management', active, sort_order): photo, name (bn), designation, LinkedIn; bio on hover.
- Optional advisory/sales grids by category.
- CTA: "Meet us at our Gulshan-2 office" → office map + Book a Visit.
- JSON-LD: Organization + Person (each) + BreadcrumbList.

## 14. WHY PURBACHAL — `/why-purbachal` (SEO pillar, 2500+ words)
Article page, generalised to support multiple corridor projects. H1 + TL;DR box + executive summary (AEO 40-60 word answers). H2s: infrastructure now (Metro, Asian Highway, Kanchan Bridge, 300ft road, utilities — dated real photos); RAJUK/government investment; land appreciation (table + sources); Purbachal vs other areas (comparison table); "Where are Matrica's projects here?" → /projects by area; risks & mitigation (honest, EEAT); expert opinion (leadership quote + Person schema); FAQ. Inline lead capture mid + end. Internal links (projects, blog, contact) + external authority (RAJUK, Wikipedia). JSON-LD: Article + FAQPage + BreadcrumbList; byline = leadership member.

## 15. BLOG MODULE — `/blog` (organic-traffic engine)

### 15.1 Listing
Category tabs + search + optional tag filter; featured post + post grid (image, category, title, excerpt, author, date, reading time); pagination (not infinite); category archives `/blog/category/:slug` with own SEO; desktop sidebar (search, categories, popular, Inquiry card). JSON-LD: Blog + ItemList + BreadcrumbList.

### 15.2 Article `/blog/:slug`
Category + H1 + author byline (photo, name → /leadership) + published/updated dates + reading time; featured image; **TL;DR box** (GEO/AEO); body (TipTap HTML) with answer-first paragraphs under question-style H2s, captioned images, tables; **Table of Contents** (from H2s, sticky desktop); author box (E-E-A-T); related-project card(s) (prefill LeadModal); FAQ accordion (`faqs` field → FAQPage schema); related posts (3); lead capture (intro inline + end split + sticky mobile bar); share buttons. JSON-LD: Article (+ dates, author Person, publisher Org, image) + FAQPage + Speakable + BreadcrumbList.

### 15.3 Ranking factors (built in)
Unique meta per post & category; focus + secondary keywords guide on-page usage; internal linking to ≥2 projects + ≥1 related post (topical clusters); freshness (dateModified surfaced, refresh reminders); reading time + updated date + author authority (EEAT); Speakable + TL;DR + FAQ (AEO/GEO); image SEO (WebP, alt, lazy, dimensions); local keywords ("Purbachal plot", "Kanchan land"); NAP consistency.

### 15.4 Admin (§19.6)
Rich editor + SEO panel (live title/desc length, focus-keyword checks), FAQ builder, author select (team_members), category, featured image (upload widget), TL;DR, related projects, scheduling, AI assists (outline / FAQ / meta / alt).

## 16. CONTACT — `/contact`
**Office Google Map embed** (`settings.office.map_embed_url`) + office photo; contact form (Name, Phone, Email, Subject select, Message, Preferred contact: Phone/WhatsApp/Email); office info card (Gulshan-2 address, hours, hotline, email); big WhatsApp + Call; note that project sites are separate (see each project page). Submit → lead `source='contact'`. JSON-LD: Organization + LocalBusiness NAP + ContactPage + BreadcrumbList.

## 17. SITE VISIT — `/site-visit`
Booking form: Name, Phone, Email (opt), Project select, Size preference (name only), Preferred date (min today, max +30), Time (Morning/Afternoon), People count, "Free transport from Gulshan-2" checkbox, Message. Value props (free transport, meet advisor, see the land). Submit → lead `status='site_visit'` (+10 intent) → confirmation WhatsApp + email + day-before & 2h-before reminders (§22). JSON-LD: BreadcrumbList.

## 18. OTHER PAGES
- **/faq** — category tabs + search accordion + CTA; FAQPage schema.
- **/landowner** — pitch to landowners to partner with Matrica (benefits, process, trust, form `source='landowner'`); own SEO; builds land pipeline.
- **/privacy /terms** — from `pages` table (content + SEO meta).
- **/projects/:slug/:size-slug** (optional programmatic) — editorial size guide, **no price**, content + inquiry; noindex if <200 unique words; Product/BreadcrumbList (no offers).


---

## 19. ADMIN PANEL — `/admin`

SPA (no prerender), auth-gated. **Every image field uses the upload widget (§4.3) — no URL inputs.**

### 19.1 Auth + layout
Supabase `auth.getUser()` → `profiles.role`; not allowed → /admin/login. Sidebar: Dashboard · Leads · Projects · Documents · Media · Gallery · Team & Leadership · Content (Pages, Blog, Testimonials, FAQs) · Popups & Forms · Nurturing · SEO · Scripts · Settings (General, Office/Maps, WhatsApp, SMTP, AI, Payments, Theme) · Users · Audit Log. Top bar: breadcrumb + notifications (hot leads / new visits) + user menu.

### 19.2 Dashboard
KPI cards (leads today vs yesterday, site visits this week, new/unassigned leads, published projects); lead funnel; leads by source; recent activity feed; AI insight (7-day summary) if configured. No public pricing shown.

### 19.3 Leads CRM
Filters (date, source incl. exit_popup/blog/landowner, status, tier, assigned, project, search); Table + Kanban (drag to change status); export CSV; bulk assign/status. Lead detail: contact info; multi-assign (primary/support); activity timeline; notes; score breakdown; AI suggested next action + WhatsApp reply; quick actions (WhatsApp/Call/Email/Schedule follow-up); attribution (form_context, landing_page, utm).

### 19.4 Projects manager
List (name, status, publish, featured, sort, actions). Create/Edit tabs:
- **Basic:** name(_bn), slug, status, publish_status, tagline(_bn), summary(_bn), description(_bn), featured, sort_order; hero + card images (upload widget).
- **Location:** location_area, address, lat/lng, **map_embed_url (this project's map)**, landmarks manager.
- **Highlights / Amenities:** managers (images via upload widget).
- **Internal pricing/sizing:** `project_sizing_internal` (admin-only; NEVER public; names used in public "size preference" selects; prices used only in AI/sales context).
- **Documents:** link to §19.5.
- **Features:** toggle + reorder which sections/tabs appear publicly.
- **SEO:** meta_title, meta_description, OG image.

### 19.5 Documents manager (per project)
Table: doc_type, label, file (upload widget: pdf/image), size, version, viewable, gated, downloads, enabled. Standard: location_map, layout_plan, brochure (+ custom). Replace file bumps version. Gated → requires lead capture (brochure typically gated; maps/layout usually open).

### 19.6 Media library
Grid of all `media` (shared-hosting uploads); upload (→ upload.php); edit alt/title/caption; copy URLs; delete; filter by kind/date/search; WebP badge + convert guidance. Picker mode reused by all upload widgets.

### 19.7 Content — Blog / Pages / Testimonials / FAQs
Blog: list + rich editor + SEO panel + TL;DR + FAQ builder + author select + category + featured image + related projects + schedule + AI assists. Testimonials: CRUD incl. optional video (YouTube) + photo. FAQs: CRUD w/ category + optional project. Pages: rich text + SEO (privacy/terms/landowner).

### 19.8 Gallery manager
Categories: create/rename/reorder/enable, cover (upload widget), optional project link. Items: add via upload widget (image) OR YouTube URL (video); assign category; caption; auto media_type; reorder; enable/disable; bulk image upload; live preview.

### 19.9 Team & Leadership
CRUD `team_members`: photo (upload widget), name(_bn), designation(_bn), category, is_leadership, message(_bn) + signature (Chairman/MD message), bio(_bn), phone/email/linkedin, sort, status.

### 19.10 Popups & Forms
Popup config (exit-intent): enable, triggers (desktop/mobile), headline(_bn), subcopy, image (upload widget), offer label, suppress_days, per-page target rules, live preview. Lead forms: manage field sets + copy + success messages per formKey (home, project, document, blog, contact, site_visit, landowner, newsletter).

### 19.11 Nurturing · SEO · Scripts · Settings · Users · Audit
- **Nurturing:** sequences + steps (WhatsApp/email), enrolments, broadcasts to segments.
- **SEO:** global OG default (upload widget), NAP check, per-page meta, schema toggles, sitemap.xml + robots.txt + llms.txt editors/generators.
- **Scripts:** GA4/GTM/GSC/Meta Pixel/Clarity/custom, placement, enable, consent flag (retargeting consent-gated).
- **Settings:** General (logo via upload widget, name, tagline, hotline, email, socials); **Office/Maps (office address + office map_embed_url, hours)**; WhatsApp; SMTP; AI (keys, models, persona, prompts); Payments (internal); Theme.
- **Users & roles:** super_admin, admin, sales_manager, sales_rep, content_editor, viewer.
- **Audit log:** filter + export.

---

## 20. SEO / AEO / GEO / LOCAL SEO / EEAT

**On-page (every page):** unique title (50-60) + meta description (150-160) + canonical; one H1; clean heading hierarchy; 3-5 internal + 1-2 external authority links; WebP images with alt; OG + Twitter; JSON-LD per type.

**Structured data:** Home → Organization + RealEstateAgent (no priceRange) + WebSite · Projects listing → CollectionPage + ItemList + BreadcrumbList · Project → Place + RealEstateListing (no offers) + BreadcrumbList (+ FAQPage) · Blog → Article + Person + FAQPage + Speakable + BreadcrumbList · About/Leadership → Organization + Person + BreadcrumbList · Contact → LocalBusiness NAP + ContactPage · Gallery → ImageGallery/VideoObject.

**AEO:** question-style H2s with 40-60 word answers; FAQ sections; TL;DR boxes; entity-rich content (RAJUK, Purbachal, Kanchan Bridge, Asian Highway, Dhaka Metro); `/llms.txt`.

**GEO:** Key-Facts boxes; verifiable claims with sources; comprehensive single-source pages; Speakable; extractable structure.

**Local SEO:** consistent NAP (Gulshan-2 office) in footer/Contact/About/schema; LocalBusiness/RealEstateAgent schema with office geo + areaServed (Purbachal, Dhaka); Google Business Profile alignment; office map embeds; location pages; local keywords in blog; real-name + video reviews.

**EEAT:** dated site photos (progress); named leadership + advisor bylines; RAJUK/REHAB/registration; transparent process; working hotline + office; honest risk sections.

**Technical:** sitemap.xml (status-aware), robots.txt (allow public, disallow /admin), llms.txt, canonical everywhere, no broken links, HTTPS, mobile-first; programmatic pages noindex if thin (<200 words).

---

## 21. LEAD SCORING (max 100)
```
DEMOGRAPHIC (20): BD mobile +5 · NRB phone +8 · corporate email +5 · NID +5
BEHAVIORAL (45): viewed project +3 · viewed documents +4 · downloaded brochure +5 ·
  >3 pages +3 · session >3min +3 · return visit +5 · organic entry +3 · blog→project +4 ·
  registered interest +5 · asked registration/legal +10
INTENT (25): submitted form +5 · specific project/size +5 · booked site visit +10 · asked to buy +5
SOURCE (10): direct/typed +5 · google organic +5 · referral +5 · facebook +3
TIERS: Hot 75-100 (immediate human) · Warm 50-74 (AI + human <2h) · Cool 25-49 (AI + weekly) · Cold 0-24 (drip, re-engage 30d)
```

## 22. AUTOMATION TRIGGERS
```
Lead created (any form) → WhatsApp welcome + welcome email + score + auto-assign + enrol welcome + Telegram.
Score ≥75 → HOT LEAD Telegram + suggest human takeover.
Gated doc downloaded → follow-up WhatsApp + score +5 + log.
Register interest (Upcoming) → waitlist sequence + launch notify.
Site visit booked → confirmation + day-before + 2h-before reminders + next-day follow-up.
No engagement 7d → re-engage; 30d → final re-engage → Cold.
Won → thank you + referral ask. Lost → reason capture + farewell.
```

## 23. AI INTEGRATION
**WhatsApp concierge "Rafi":** BD land advisor, Banglish by default (mirrors user's language/script), never invents prices/availability (uses injected internal data), never pushy, escalates to humans, always nudges toward a site visit, multi-project aware, ≤100 words/message. **Models (fallback Claude → GPT-4o-mini → Gemini Flash):** WhatsApp → Claude Haiku · scoring → GPT-4o-mini · blog assist → Claude Sonnet · meta/alt → Gemini Flash · smart reply/sentiment/email → Claude Haiku. Soft budget cap (~$200/mo) in Edge Functions. Keys/persona/prompts in Settings → AI.

## 24. PERFORMANCE, RESPONSIVENESS & TECHNICAL
```
Build: Vite → prerender static HTML per public route → public_html/. Admin = separate SPA chunk.
Images: WebP via upload.php; responsive 480/960/1440/1920; <picture>+srcset; LQIP blur-up;
  hero eager+preload; rest lazy + decoding=async; explicit dimensions (avoid layout shift).
Code: code-split per route; tree-shake icons; YouTube facade; no heavy libs.
100% responsive across mobile/tablet/desktop; mobile-native behaviors:
  full-height sections, safe-area insets, sticky bottom action bar, bottom-sheet modals/lightbox,
  large touch targets, no 300ms tap delay, no horizontal scroll, skeleton loaders.
All animations respect prefers-reduced-motion.
Target: Lighthouse 95+ (Perf/A11y/Best-Practices/SEO) on shared hosting.
```

## 25. IMPLEMENTATION ROADMAP
```
W1-2  Supabase schema + upload.php + upload widget + global shell + exit-intent/lead pipeline.
W3-4  Home + Projects listing (status tabs) + Project detail (tabs, own map, documents, inquiry).
W5-6  Advanced Gallery (categories, image+video, lightbox+zoom) + About + Leadership (message) + Contact (office map) + Site visit.
W7-8  Blog (listing + article + categories + SEO/GEO/AEO + author EEAT + embedded capture) + Why Purbachal + FAQ + Landowner.
W9-11 Admin: dashboard, Leads CRM, Projects/Documents/Media/Gallery/Team, Content/Blog, Popups&Forms, Nurturing, SEO/Scripts/Settings/Users/Audit.
W12   AI & automation: WhatsApp API + Edge Functions (concierge, scoring, email, sends) + Telegram + nurture + reminders + tests.
W13   Content & polish: seed projects, blog posts, testimonials (incl. video), gallery, team + messages; a11y + perf pass.
W14+  Launch: GSC/Bing, GA4/Pixel/Clarity (consent-gated), sitemap submit, monitor; then weekly blog + monthly SEO review.
```

## 26. SUCCESS METRICS
```
M1:  Lighthouse 95+ · ~300 organic sessions · 20+ leads · first site visits.
M3:  brand + "Ventura City" top 5 · ~1,500 sessions · 60+ leads.
M6:  "Purbachal plot/land" page-1 · ~8,000 sessions · 200+ leads · multiple projects live.
M12: "Purbachal plot" top 3 · ~25,000 sessions · 500+ leads · AI cost < $200/mo.
```

---

### END OF FEATURES SPECIFICATION (PRD v7.1)
Feature-only scope: multi-project (land, no flats), no public pricing/plot-map, shared-hosting media via upload.php (WebP auto-conversion), advanced gallery (categories + image/video + zoom lightbox), site-wide lead engine (exit-intent popup + blog-integrated capture + WhatsApp/email automation), per-project maps vs separate office map, leadership messaging, full admin panel, and SEO/AEO/GEO/Local-SEO/EEAT coverage. **Visual design is specified separately and intentionally excluded here.**
