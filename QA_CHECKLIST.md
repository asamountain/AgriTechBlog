# QA URL Checklist — tech-san.vercel.app

Run through this list after every deployment to verify all routes are alive.
Mark each item ✅ pass / ❌ fail / ⚠️ degraded.

---

## Frontend Routes (SPA — must load React app, not 404)

| Status | URL | Expected |
|--------|-----|----------|
| [ ] | https://tech-san.vercel.app/ | Home page loads |
| [ ] | https://tech-san.vercel.app/posts | All posts listing |
| [ ] | https://tech-san.vercel.app/blog/[any-slug] | Blog post content loads |
| [ ] | https://tech-san.vercel.app/portfolio | Portfolio page loads |
| [ ] | https://tech-san.vercel.app/portfolio/[any-slug] | Individual portfolio item |
| [ ] | https://tech-san.vercel.app/tags/iot | Tagged posts page loads |
| [ ] | https://tech-san.vercel.app/admin | Admin dashboard loads (not 404) |
| [ ] | https://tech-san.vercel.app/admin/seo | Admin SEO dashboard loads |
| [ ] | https://tech-san.vercel.app/create-post | Create post editor loads |
| [ ] | https://tech-san.vercel.app/edit-post/2170770177 | Edit post editor loads (not 404) |
| [ ] | https://tech-san.vercel.app/og-test | OG tester page loads |
| [ ] | https://tech-san.vercel.app/auth/callback | Auth callback page loads |
| [ ] | https://tech-san.vercel.app/user/[username] | User profile page loads |
| [ ] | https://tech-san.vercel.app/nonexistent-page | Shows 404 / Not Found component (not blank) |

---

## API Endpoints (must return JSON or valid content, not 404/500)

| Status | URL | Expected |
|--------|-----|----------|
| [ ] | https://tech-san.vercel.app/api/posts | JSON array of posts |
| [ ] | https://tech-san.vercel.app/api/posts?featured=true | JSON array of featured posts |
| [ ] | https://tech-san.vercel.app/api/meta?type=home | HTML with OG meta tags |
| [ ] | https://tech-san.vercel.app/api/meta?type=posts | HTML with OG meta tags |
| [ ] | https://tech-san.vercel.app/api/meta?type=blog&slug=[slug] | HTML with blog post OG tags |
| [ ] | https://tech-san.vercel.app/api/og-image | OG image (PNG) renders |
| [ ] | https://tech-san.vercel.app/api/rss.xml | Valid RSS XML |
| [ ] | https://tech-san.vercel.app/api/sitemap.xml | Valid Sitemap XML |
| [ ] | https://tech-san.vercel.app/api/health | `{ status: "ok" }` |
| [ ] | https://tech-san.vercel.app/api/portfolio | JSON portfolio data |
| [ ] | https://tech-san.vercel.app/api/admin/blog-posts | JSON (requires auth) |
| [ ] | https://tech-san.vercel.app/api/auth/user | Auth user info or 401 |

---

## Legacy URL Rewrites (backward compat — must not 404)

| Status | URL | Rewrites To |
|--------|-----|-------------|
| [ ] | https://tech-san.vercel.app/api/blog-posts | `/api/posts` |
| [ ] | https://tech-san.vercel.app/api/blog-posts/featured | `/api/posts?featured=true` |
| [ ] | https://tech-san.vercel.app/api/blog-post?id=[id] | `/api/posts?id=[id]` |
| [ ] | https://tech-san.vercel.app/api/blog-post-meta | `/api/meta` |
| [ ] | https://tech-san.vercel.app/api/blog-post-ssr | `/api/meta` |
| [ ] | https://tech-san.vercel.app/api/notion-sync/list-pages | `/api/notion-sync/pages` |
| [ ] | https://tech-san.vercel.app/api/notion-sync/test | `/api/notion-sync/pages?test=true` |

---

## Social / SEO (check with external tools)

| Status | Check | Tool |
|--------|-------|------|
| [ ] | OG image shows on Twitter/X card | https://cards-dev.twitter.com/validator |
| [ ] | OG image shows on Facebook/LinkedIn | https://developers.facebook.com/tools/debug/ |
| [ ] | Sitemap is valid XML | https://www.xml-sitemaps.com/validate-xml-sitemap.html |
| [ ] | RSS feed is valid | https://validator.w3.org/feed/ |

---

## Notes

- **Admin 500 error** on `/api/admin/blog-posts` is a known issue (MongoDB cold start on Vercel free tier) — see CLAUDE.md
- Replace `[any-slug]` and `[username]` with real values from the database when testing
- Use incognito window to test unauthenticated state
