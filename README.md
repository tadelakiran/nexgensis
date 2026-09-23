# Product Admin Dashboard

An admin dashboard for the free [DummyJSON](https://dummyjson.com) product catalogue:
sign in, browse and search 194 products with server-side pagination, filter by category,
sort, and add / edit / delete products.

Built with **Next.js 16** (App Router) · **React 19** · **Tailwind CSS 4** · **Axios**.
No React Query, no SWR, no table or pagination libraries — the fetching, caching-free
pagination, debouncing and race handling are all written by hand.

---

## Live demo and repository

| | |
| --- | --- |
| Live app | `_add your Vercel / Netlify URL here after deploying (see below)_` |
| Repository | `_add your public GitHub URL here_` |

Sign in with:

```
username: emilys
password: emilyspass
```

The login screen has a **Fill demo credentials** button so you do not have to type them.

---

## Quick start

Requires **Node.js 20.9+** (Next.js 16 dropped Node 18).

```bash
git clone <your-repo-url>
cd <repo-folder>

npm install
npm run dev
```

Open <http://localhost:3000> — you are redirected to `/login`, and after signing in you
land on `/products`.

No environment variables and no API key are needed: DummyJSON is public and this app
calls it directly from the browser.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server (Turbopack) on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript + `react-hooks`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest — 124 tests across 7 files (~4s) |
| `npm run test:watch` | Vitest in watch mode |

---

## What is finished

### Authentication
- [x] Login with `emilys` / `emilyspass` via `POST /auth/login`
- [x] Inline error for wrong details (`Incorrect username or password`), and per-field
      errors for empty inputs
- [x] Token + user persisted, so a refresh keeps you signed in
- [x] Product pages are protected; signed-out visitors are redirected to
      `/login?next=…` and returned to where they were heading
- [x] Logout button, plus automatic sign-out and a message when the API rejects the
      token (HTTP 401)
- [x] Duplicate-submit protection on the login button

### Product list
- [x] Image, title, category, price, rating and stock
- [x] **Table on desktop, cards on mobile** — same data, one component each
- [x] Stock shown as a coloured state (in stock / low stock / out of stock)
- [x] Fractional star ratings, discount percentage, brand, "New/Edited (local)" badges

### Pagination
- [x] Server-side `limit` + `skip`, page size **10 / 20 / 50**
- [x] `Showing 21–30 of 194` computed from the same range the table renders
- [x] Numbered pages with first/last always reachable and ellipses in between,
      plus **Previous / Next**
- [x] Page, size and range all live in the URL

### Search
- [x] `GET /products/search?q=` with a 400 ms debounce, so typing `phone` costs one
      request rather than five
- [x] Returns to page 1 whenever the term changes
- [x] Clear (×) button that commits immediately instead of waiting out the debounce

### Filter and sort
- [x] Category filter, populated from `/products/categories` (24 categories)
- [x] Sort by price, rating or title, with an ascending/descending toggle
- [x] Sensible default direction per field (A–Z for titles, best-first for numbers)
- [x] **Reset** button, and the search/category exclusivity rule explained in the UI

### Product details — `/products/[id]`
- [x] Image gallery with clickable thumbnails
- [x] Description, price (with discount), rating, stock, full specification list, tags
- [x] Reviews with stars, reviewer, comment and date
- [x] A deliberate **"Product not found"** screen for a wrong id, and for `abc` / `1.5`
- [x] Global 404 page for unknown routes

### Add, edit and delete
- [x] Modal form used for both add and edit, with validation rules and inline messages
- [x] Confirmation dialog before deleting, naming the product and the request it makes
- [x] Changes appear immediately and survive a refresh
- [x] Header shows a change counter with a **Reset** action

### Loading, empty and error states
- [x] Shimmer skeleton on first load, sized to the page so the layout does not jump
- [x] Distinct empty states for "no match for this search", "nothing in this category",
      "catalogue is empty" and "this page is past the end"
- [x] Error state with a **Try again** button, and a "Clear filters" alternative when a
      filter caused the failure
- [x] Empty / error states for the category list too, without taking the page down

### Cross-cutting
- [x] One shared Axios setup; all API calls live in `lib/api/`, never in UI code
- [x] Page, search, filter and sort persisted in the URL
- [x] Hand-written debounce, race guard, pagination and table — no library shortcuts
- [x] 124 tests, clean `typecheck`, clean `lint`, clean production build

**Not built (deliberate scope):** user management, a real backend, dark mode, i18n.

---

## How the tricky requirements are handled

### "If the user types fast, old search results must never replace new ones"

Two mechanisms, in `hooks/useProductsQuery.ts`:

1. **A request id (the correctness guarantee).** Each request takes a monotonically
   increasing id *before* it starts. A response is applied only if its id is still the
   newest; otherwise it is dropped silently. This is what actually prevents the bug,
   because an abort can arrive after a response has already been resolved.
2. **An `AbortController` per request (the efficiency measure).** Aborted in the effect
   cleanup, so superseded requests stop wasting the connection. Aborts are normal, not
   errors, so they never surface to the user.

Debouncing is a third layer that *reduces* how many races can happen — it does not make
them safe, which is why the guard above is the real answer.

**To see it working:** turn on the **Slow mode · 2s delay** switch in the toolbar. It adds
`&delay=2000` to every request, which is the reproduction the brief describes. Type
quickly and the list always ends up showing the newest term.

This is covered by tests that go further than the delay trick: they let a superseded
request resolve *after* the newer one, with the abort signal deliberately ignored, which
is the worst case a slow network can produce.

### "The API cannot search and filter by category at the same time"

Verified against the live API:

```
GET /products/search?q=phone                      → 23 results
GET /products/search?q=phone&category=smartphones → 23 results  (category silently ignored)
GET /products/category/smartphones                → 16 results
```

`category` is dropped without an error on the search endpoint, and
`/products/category/…` has no `q` support. The app therefore makes the two **mutually
exclusive**, and says so:

- choosing a category clears the search term and disables the search box, with an inline
  note explaining that the API cannot do both;
- typing a search clears the category.

Why not the alternatives:

- *Allowing both and ignoring one* would display a filter that is not applied — the user
  would be looking at results that contradict what the screen says.
- *Intersecting both sets in the browser* would break the server's `total`, and therefore
  the page count and the "of 194" label. It also contradicts "load data page by page
  from the API".

The rule itself lives in exactly one place, `buildProductsRequest` in
`lib/api/products.ts`, where search takes precedence if both ever arrive — and
`parseQuery` normalises a URL containing both, so what is on screen, what is in the URL
and what is sent to the API can never disagree.

### "Add, edit and delete are not really saved by the API"

Correct — DummyJSON accepts writes and returns convincing responses, but persists
nothing. Confirmed directly:

```
PUT  /products/1  {"title":"RENAMED BY PUT"}   → 200, returns the renamed product
GET  /products/1                               → still the original title
DELETE /products/1                             → 200, returns the deleted product
GET  /products/1                               → still there
```

**Approach:** each action does both halves.

1. It performs the real HTTP call (`POST /products/add`, `PUT /products/{id}`,
   `DELETE /products/{id}`). Nothing is faked, so validation, auth headers, loading
   states and error handling are exercised for real — a failed request is reported.
2. It records the outcome in a **local overlay** (`lib/product-overlay.ts`) that is merged
   over every server response and persisted to `localStorage`.

The overlay holds `created` products, per-id `updated` patches and `deleted` ids.
Locally created rows get ids from 1000 upward, because DummyJSON returns the same id
(195) for every creation — reusing it would make a second new product overwrite the first.

The app is upfront about this rather than pretending: local rows carry a **New (local)**
or **Edited (local)** badge, the header shows `n local changes` with a **Reset** button,
the footer states that changes are browser-local, and the delete dialog says plain text
that the API discards deletes. A `PUT`/`DELETE` is deliberately *not* sent for a locally
created row, since the API has never seen that id and would return 404.

Accepted trade-offs, documented rather than hidden:
- Created rows are pinned to the top of page 1. A fabricated record has no meaningful
  position in the server's global ordering, and pretending otherwise would break
  pagination.
- The "of N" figure is adjusted by the overlay (created rows that match the current view
  added, deleted rows removed). The server remains authoritative for ordering and page
  boundaries, so this is an approximation.

### "Wrong URL values like `?page=abc` or `?page=999` must not break the page"

| URL | Behaviour |
| --- | --- |
| `?page=abc` | becomes page 1; the URL is rewritten to `/products` |
| `?page=0`, `?page=-3` | page 1 |
| `?page=2.9` | page 2 |
| `?page=99999999` | clamped to the sanity bound of 10 000 |
| `?page=999` | valid but empty → "Page 999 is past the end of these results" with a **Go to the last page** button |
| `?limit=7`, `?limit=xyz` | page size 10 |
| `?order=sideways` | `asc` — **important**, because DummyJSON answers a bad `order` with HTTP 400 |
| `?sort=banana` | default order |
| `?category=doesnotexist` | renders an empty state; the select shows the unknown slug rather than looking blank |
| `?q=x&category=laptops` | both accepted by the parser, then normalised so search wins, matching what is requested |

Every value is whitelisted in `lib/url-query.ts` before it is used, and the URL is
*repaired* rather than merely tolerated: the normalised query is compared with the
address bar and rewritten if they differ, so a hand-edited link becomes a clean canonical
URL on load. It converges in one step because the canonical form parses back to itself.

A page past the end is deliberately **not** silently clamped — clamping would make the URL
lie about what is displayed — and it is not an error either, because the link is
well-formed.

### "Clicking Save or Login many times quickly must not send many requests"

Guarded in both the places a request is triggered by a click:

- `hooks/useProductMutations.ts` keeps a `Set` of in-flight keys in a **ref**.
- The login form and the form dialog each keep an in-flight ref.
- The confirm dialog owns its own busy state rather than trusting the caller.

The ref is the part that matters: React state updates are not flushed before a second
click in the same tick, so two fast clicks would both read `isSubmitting === false` and
fire twice. The ref is mutated synchronously inside the handler, closing that window.
`isSubmitting` state still exists — but only to show the spinner and disable the button.

---

## Project structure

```
app/
  layout.tsx                  Providers, Inter font, metadata
  page.tsx                    Redirects to /products
  not-found.tsx               Global 404
  globals.css                 Tailwind theme tokens, keyframes, base styles
  login/page.tsx              Await searchParams, validate ?next= server-side
  products/
    layout.tsx                AuthGuard + header + footer, applied to every product route
    page.tsx                  Suspense boundary around the URL-reading list view
    [id]/page.tsx             Awaits the async params promise

components/
  auth/        AuthGuard, LoginView
  layout/      AppHeader (brand, local-changes counter, user, logout)
  products/    ProductsView (orchestrator), ProductToolbar, SearchInput, ProductsTable,
               ProductsCardList, ProductsSkeleton, Pagination, ProductImage,
               ProductFormDialog, ProductDeleteDialog, ProductDetailView, ProductActions
  providers/   AuthProvider, ProductsOverlayProvider, ToastProvider
  ui/          Button, form-controls, Modal, ConfirmDialog, Badge, Rating, StockBadge,
               StatePanel, icons

hooks/
  useProductQuery        URL <-> state, plus URL self-repair
  useProductsQuery       Fetch a page, with the stale-response guard
  useProductDetail       One product; local records first, 404 -> not found
  useProductMutations    Create / update / delete, with duplicate-submit guards
  useCategories          Category options, independently retryable
  useDebouncedValue      Generic debounce

lib/
  axios.ts               THE shared Axios instance: token + centralised errors
  api/auth.ts            POST /auth/login
  api/products.ts        All product reads/writes + the endpoint-selection rule
  url-query.ts           Parse / validate / serialise the query string
  pagination.ts          Ranges, labels, page window (pure)
  product-overlay.ts     Local writes over API data (pure)
  validation.ts          Form rules and payload conversion (pure)
  format.ts              Locale-pinned number, currency and date formatting
  safe-redirect.ts       Open-redirect guard for ?next=
  local-storage.ts       SSR-safe storage helpers
  auth-storage.ts        Session persistence
  constants.ts           Tunable values and the whitelists used by URL parsing
  types.ts               DummyJSON response shapes

tests/                   124 tests: URL parsing, pagination, overlay, validation,
                         endpoint selection, redirect safety, race conditions
```

### Architecture rules I held myself to

1. **No API call in a component.** Every request goes through `lib/api/*`, driven by a
   hook. Components render; hooks fetch; `lib` holds logic.
2. **One Axios instance.** `lib/axios.ts` is the only place that knows about base URLs,
   tokens or HTTP error shapes.
3. **Pure logic in `lib`, side effects in hooks.** URL parsing, pagination maths, overlay
   merging and validation are pure functions with no React import, which is what makes
   them testable.
4. **Small components.** Each file has one job; the largest is the products list
   orchestrator, which only wires state together.

---

## Testing

```bash
npm test
```

124 tests in 7 files, roughly 4 seconds.

| File | Covers |
| --- | --- |
| `tests/url-query.test.ts` | Every malformed URL case in the table above |
| `tests/pagination.test.ts` | Page ranges, "Showing 21–30 of 194", the page window, ellipsis behaviour |
| `tests/product-overlay.test.ts` | Create/edit/delete merging, persisted-state repair |
| `tests/validation.test.ts` | Form rules, form↔payload conversion, the `5.1` rating regression |
| `tests/products-api.test.ts` | Which endpoint and params a view state produces |
| `tests/safe-redirect.test.ts` | Open-redirect attempts via `?next=` |
| `tests/useProductsQuery.test.tsx` | **Race conditions**: a superseded response resolving last must not win |

The race test is the interesting one. It mocks the API module and lets the *older* request
resolve *after* the newer one, with the abort signal deliberately ignored — the worst case
a slow network can produce. Only the request-id guard can pass it.

The suite earned its place twice during development: it caught `rating: "5.1"` passing
validation, and the `act()` warnings it produced forced the hook tests to be deterministic
(deferred promises) instead of racing microtasks. See [NOTES.md](./NOTES.md).

I also verified the API contract itself with live requests rather than trusting the
documentation — that is where the "writes are not persisted", "`order=sideways` is a 400"
and "`category` is ignored alongside `q`" findings came from, and each one changed the
design.

### Manual checks

Covered by hand in the browser, since they need real interaction:

- Bad credentials show the inline error; a second fast click sends no second request
  (confirmed in the Network tab).
- Refresh and the Back button preserve the view; a copied URL reopens it.
- Slow mode on, then typing quickly: the newest term always wins.
- Add → the row appears at the top of page 1 with a "New (local)" badge → refresh → still
  there → Reset in the header → gone.
- Edit and delete affect only the list, never the API's stored data.
- `/products/9999` and `/products/abc` show "Product not found"; `/nonsense` shows the 404.
- Table at ≥768 px, cards below it.

---

## Deployment

The app is a standard Next.js project with no environment variables, so both hosts work
without configuration.

**Vercel**

```bash
npm install -g vercel
vercel            # preview deployment
vercel --prod     # production
```

Or push to GitHub and import the repository at <https://vercel.com/new>. Vercel detects
Next.js automatically; build command `npm run build`, output is handled for you.

**Netlify**

Install the official Next.js runtime first, or the routing will be wrong:

```bash
npm install -D @netlify/plugin-nextjs
```

Connect the repository at <https://app.netlify.com/start>, or add `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## Accessibility and UX details

- Modals are real dialogs: `role="dialog"`, `aria-modal`, labelled by their heading,
  Escape to close, background scroll locked, focus moved in on open, a Tab trap while
  open, and focus restored to the trigger on close.
- `aria-current="page"` on the active pagination button, `role="switch"` +
  `aria-checked` on the slow-mode toggle, `aria-live` on the pagination range, and
  `role="alert"` on validation messages so they are announced as they appear.
- Destructive and loading buttons report `aria-busy`, and every icon-only control has an
  accessible name.
- Ratings expose their value as text (`Rated 4.3 out of 5 from 3 reviews`) instead of
  relying on star glyphs.
- URL updates use `scroll: false` so the page does not jump, except when the page number
  changes, which scrolls the results into view deliberately.
- `prefers-reduced-motion` disables the animations.

---

## Known limitations and what I would do next

- **The token is in `localStorage`.** Right for a public demo API; a real app handing out
  long-lived credentials should use an httpOnly cookie. The consequence is that route
  protection is client-side — `components/auth/AuthGuard.tsx` waits for the session to
  resolve and then redirects, showing a full-page loader in the meantime so protected
  content never flashes. With an httpOnly cookie I would move the check to a
  `proxy.ts` (Next 16's replacement for middleware) and redirect before rendering.
- **The session is not re-validated on load.** A stored token is trusted until a request
  comes back 401, which the interceptor turns into a sign-out with a message. Calling
  `/auth/me` on mount would catch an expired token sooner, at the cost of a network
  round-trip on every page load and a forced sign-out when offline.
- **Local changes are per browser.** They cannot be shared, and Reset discards them.
- **No optimistic UI.** The list updates once the API responds, which is honest about
  what happened and simpler to reason about.
- **Next steps I would prioritise:** server-side pagination over a real backend; a
  `proxy.ts` guard once the token moves to a cookie; virtualising the table for page
  sizes above 50; and end-to-end tests (Playwright) for the flows now checked by hand.
