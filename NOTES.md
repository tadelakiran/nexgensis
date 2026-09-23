# Engineering notes

Short write-up to go with the code: the choices I made, one problem I hit and how I
fixed it, and where AI helped. Setup steps and the feature list live in
[README.md](./README.md).

---

## 1. Choices, and why

### The URL is the state container, not React state
Page, page size, search term, category and sort all live in the query string, and
nothing is duplicated in component state. `parseQuery` (in `lib/url-query.ts`) is
the only reader and `queryToParams` the only writer, so refreshing, sharing a link,
and the browser Back button all work without any extra code.

The alternative — `useState` for the filters plus an effect that pushes them to the
URL — has two sources of truth, and they drift. I picked the version with one.

### Every value from the URL is validated before it is used
`parseQuery` whitelists each field and substitutes a default otherwise. This is not
defensive box-ticking: DummyJSON answers `?order=sideways` with **HTTP 400**, so an
unvalidated URL value would show an error screen instead of a product list. `?page=abc`
becomes page 1, `?limit=7` becomes 10, `?order=sideways` becomes `asc`.

I also let the app *repair* the URL rather than only tolerating it: the normalised
query is compared with the address bar and rewritten if they differ, so
`?page=abc&limit=7&order=sideways` visibly becomes `/products`. It converges in one
step because the canonical form parses back to itself.

### `?page=999` shows an empty state, not an error and not a silent rewrite
Clamping 999 to the last page would make the URL lie about what is displayed, and
erroring would punish a valid-shaped link. So the page renders a friendly empty state
that says how many pages exist and offers to jump to the last one.

### Search and category are mutually exclusive — enforced in the UI
This is the one real API limitation. I verified it with live requests:

```
/products/search?q=phone                                 → 23 results
/products/search?q=phone&category=smartphones            → 23 results (category ignored!)
/products/category/smartphones                           → 16 results
```

`category` is **silently dropped** on the search endpoint. So the app cannot honour
both filters, and the options were:

1. **Let both be set and silently ignore one.** Rejected: the UI would show a category
   filter that is not being applied. That is worse than a missing feature.
2. **Filter one side in the browser.** Rejected: intersecting the two result sets
   client-side breaks the server's `total`, and therefore the page count and the
   "of 194" label. It also contradicts the brief's "load data page by page from the API".
3. **Make them mutually exclusive.** Chosen. Selecting a category clears and disables
   the search box (with an inline explanation); typing a search clears the category.
   The rule lives in one function, `buildProductsRequest`, which prefers search if both
   somehow arrive — and the parse step normalises a URL that contains both, so the UI
   and the request can never disagree.

### Loading state is derived, not stored
`useProductsQuery` tags each result with the view it belongs to, so "do we have data
for what is on screen?" is a comparison rather than a flag. Two benefits: the skeleton
and the "Updating…" indicator can never disagree with the table, and there is no
`setState` at the start of an effect. It also fixed a real bug — the detail hook
briefly rendered the *previous* product while the new one loaded, because a stale
`fetched` value was still in state.

The same keying gives a deliberate two-tier loading UX: a filter change (different
view) replaces the table with a skeleton, while a page change (same view) keeps the
rows on screen and dims them.

### Duplicate submits are blocked with a ref, not with state
`isSubmitting` disables the button, but React state updates are not flushed before a
second click in the same tick — two fast clicks would both observe `false` and fire
two requests. So the real guard is a synchronously-mutated `Set` in `useProductMutations`
(and an equivalent ref in the login form and the form dialog). State is kept only for
the spinner and the disabled attribute. I use this pair everywhere a request is
triggered by a click.

### Add / edit / delete: real requests, local truth
The API accepts writes and returns convincing responses, but stores nothing — I
confirmed by `PUT`ting a new title and re-`GET`ting (original returned), and by
`DELETE`ing id 1 and re-`GET`ting (still there). So each action does both:

1. performs the genuine HTTP call, so validation, auth headers, error handling and
   failure paths are real rather than simulated; then
2. records the outcome in a local overlay (`lib/product-overlay.ts`) that is merged
   over every server response and persisted to `localStorage`.

Locally created rows get an id from `LOCAL_ID_BASE + n`, because DummyJSON returns the
same id (195) for every creation — reusing it would make two new products collide. The
overlay is deliberately honest about itself: edited and created rows carry a badge, the
header shows a change count with a **Reset** button, and the footer says the changes are
browser-local.

Two consequences I accepted and documented rather than hid:
- Created rows are pinned to page 1. A fabricated record has no meaningful position in
  the server's global ordering, and inventing one would break pagination.
- Adjusting "of N" by the overlay is an approximation. The server stays authoritative
  for ordering and page boundaries.

### One Axios instance for everything
`lib/axios.ts` attaches the bearer token in a request interceptor and converts every
failure into a single `ApiError` in a response interceptor, including the policy that a
401 ends the session. To avoid a circular import between the network layer and the auth
context, the module exposes `setUnauthorizedHandler` and the auth provider subscribes —
so `lib/axios.ts` imports no React and no Next.js code.

UI code only ever sees `ApiError`, which carries a `kind` (`network`, `timeout`,
`canceled`, `client`, `server`) so components can decide whether offering **Retry**
makes sense. Aborted requests are filtered out in one place instead of being caught
and re-checked in every caller.

---

## 2. The problem I hit, and how I fixed it

**A shared link like `/products?q=phone&page=3` silently jumped to page 1.**

Cause: the search box commits its debounced value on mount. That commit went through
the same handler as a real edit, and the handler resets `page` to 1 — correct when the
*term* changes, wrong when it did not. So the app looked like it was ignoring the page
number in the link.

I found it while reasoning about which page a redundant commit would produce, then
confirmed the mechanism: opening a link with `q` and `page` together rewrote the URL to
`page=1` before any data loaded.

Fix: make the commit handler a no-op when the term is unchanged, so the page-reset only
happens for a genuine edit:

```ts
if (q === query.q) return; // the search box re-commits on mount; this is not an edit
setQuery({ q, ...(q ? { category: "" } : {}), page: 1 }, { replace: true });
```

That also removed the need for the "have I already committed this?" bookkeeping state
inside `SearchInput`, so the fix simplified the component. I verified it by launching the
built app and requesting `/products?q=phone&page=3` directly.

A second, smaller one worth mentioning: my test suite caught that `rating: "5.1"` passed
validation. The pattern was `^[0-5](\.\d{1,2})?$` — the *leading character* was in range,
so the whole value looked valid even though 5.1 is above the maximum. The pattern now
only checks the number's shape and the 0–5 range is enforced numerically, with a
regression test naming the bug.

---

## 3. Where AI helped

I used an AI agent (Claude/Codebuff) throughout, and being specific about which parts
matters more than a blanket statement.

**Where it genuinely saved time**
- Scaffolding and boilerplate: project setup, Tailwind theme tokens, the icon set, form
  control styling, and the first draft of the presentational components.
- Prose: drafting this file and the README from my notes.

**Where I did not trust it, and why that mattered**
- *The API contract.* I assumed — as one would — that a documented demo API with a
  documented `discountPercentage` and a `/products/add` endpoint would persist writes
  and combine filters. It does not. Every fact the design depends on came from live
  requests: writes are discarded, `order=sideways` is a 400, `category` is silently
  dropped alongside `q`, `/products/{category}` returns `{products: [], total: 0}` for an
  unknown slug, and `limit=7` is accepted without complaint. Had I written the app from
  the documentation I would have shipped a broken filter and a fake-looking CRUD flow.
- *Next.js 16.* It is recent enough that training data is unreliable, so I read the
  version-matched docs bundled in `node_modules/next/dist/docs/` and confirmed async
  `params`/`searchParams`, the Suspense requirement for `useSearchParams`, and the
  `react-hooks` lint ruleset. I deliberately used explicit `Promise<{...}>` prop types
  instead of the generated `PageProps` helpers so `tsc --noEmit` works on a fresh clone
  without running codegen.
- *Correctness of its own output.* The generated code claimed to be done; the tests and
  the build disagreed. Concretely: the lint run surfaced ten
  `react-hooks/set-state-in-effect` violations, which is what pushed me to the derived
  loading-state design above; the test suite caught the `5.1` rating bug; and the
  `act()` warnings forced the hook tests to become deterministic (deferred promises)
  instead of racing microtasks. I treated AI output as a first draft to be verified, not
  as an answer.

The short version: AI was most useful for volume and least useful for truth. Everything
load-bearing — which endpoint, what shape, what the browser actually does — I verified
myself.

---

## 4. If I were walking through this live

The three files worth opening first, in order:

1. `lib/axios.ts` — the one network setup: token injection, error normalisation, and the
   subscriber pattern that keeps it free of React imports.
2. `hooks/useProductsQuery.ts` — the stale-response guard, and the derived
   loading-state reasoning.
3. `lib/api/products.ts` (`buildProductsRequest`) — which endpoint a given view maps to,
   including the search-vs-category rule in one place.

The easiest live changes to make are: add a page size to `PAGE_SIZES`, add a field to
the sort menu, or change a validation rule in `FORM_LIMITS` — each is a one-line edit
because those values are centralised.
