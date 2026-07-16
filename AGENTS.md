# AGENTS.md

# AI Development Guide

## General Principles

* Always prioritize clean, readable, and maintainable code.
* Follow the existing project architecture.
* Reuse existing components, helpers, hooks, utilities, DTOs, and API patterns before creating new ones.
* Never duplicate logic.
* Keep files small and focused on a single responsibility.
* Maintain consistency with the rest of the codebase.
* Follow the existing coding style rather than introducing new patterns.

---

# Search Before Creating

Before generating any code, always search the repository for existing implementations.

Search for:

* Similar pages
* Similar components
* Existing helpers
* Existing DTOs
* Existing API routes
* Existing actions
* Existing permissions
* Existing tables
* Existing dialogs
* Existing forms
* Existing filters

Only create a new implementation when there is no suitable existing implementation.

Always prefer:

1. Reuse
2. Extend
3. Create new

Never duplicate an existing implementation.

---

# Repository-Specific Working Style

This repository has strong consistency requirements.

When contributing:

* Match the implementation style of existing folders that already work.
* Do not invent a new structure if another module already provides the correct pattern.
* Follow the exact naming, file placement, and function separation used by the nearest equivalent feature.
* If the request says "samakan dengan folder lain", treat that as a strict instruction.
* Prefer refactoring toward the dominant project pattern instead of introducing one-off solutions.

If one module already has:

* `page.tsx`
* `page.config.tsx`
* `actions.ts`
* local `components`

then new or migrated modules should follow that same structure.

---

# Project Structure

Every feature should follow this structure when it is a full module:

```text
app/
└── feature/
    ├── page.tsx
    ├── page.config.tsx
    ├── types.ts
    ├── actions.ts
    └── components/
        ├── form-data.tsx
        ├── dialog.tsx
        ├── modal.tsx
        ├── table.tsx
        └── ...
```

Rules:

* Every page must have a `types.ts`.
* Dynamic list pages should have a `page.config.tsx`.
* Every page that communicates with APIs should have an `actions.ts` unless the surrounding module clearly uses direct fetch orchestration in `page.tsx`.
* Shared interfaces belong inside `types.ts`.
* UI components belong inside the local `components` folder.
* Do not place large JSX directly inside `page.tsx`.
* `page.tsx` should only orchestrate the page.
* Split large UI into reusable components.

---

# Dynamic Page Pattern

Many dashboard modules in this project use a dynamic page pattern.

Expected responsibilities:

* `page.tsx`
  * owns state
  * fetches data
  * handles modal open/close
  * handles pagination, filter state, and mutation refresh
* `page.config.tsx`
  * owns table columns
  * owns toolbar and filter renderer
  * owns action renderer
  * owns export config
  * should reuse project UI components
* `actions.ts`
  * owns API-facing business logic when the page already follows an action pattern
* `components/`
  * contains dialog, form-data, modal, card, or smaller visual building blocks

Rules:

* Do not collapse multiple subpages into one giant file if other modules already separate them.
* Keep `page.tsx` focused on orchestration, not large JSX blocks.
* Keep config-driven renderers consistent with existing pages like attendances, payrolls, submissions, employees, petty cash, and finance submodules.

---

# Next.js Standards

This project uses the Next.js App Router.

Frontend pages live inside:

```text
app/
```

Backend API routes live inside:

```text
app/api/
```

Do not create backend code outside the existing API structure unless explicitly requested.

Always follow the existing folder structure.

---

# API Structure

Backend endpoints must follow:

```text
app/api/<feature>/
```

Examples:

```text
app/api/users
app/api/payroll
app/api/overtime
```

Do not create duplicate endpoints.

Reuse existing endpoint patterns.

---

# Pagination

All paginated APIs must use:

* page
* limit

Example:

```text
GET /api/users?page=1&limit=10
```

Do not introduce:

* offset
* skip
* take
* perPage

unless an existing API already requires them.

Follow the existing API response format.

---

# Data Fetching

Never perform duplicate API requests.

Rules:

* Never fetch the same endpoint twice.
* Reuse existing fetched data.
* Combine requests whenever the backend already provides the required information.
* Avoid unnecessary `useEffect`.
* Avoid unnecessary refetching.
* Do not request the same data from multiple components.

Prefer this pattern for list pages when the module already follows it:

```ts
const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(ITEMS_PER_PAGE));
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    const response = await fetch(`${ENDPOINT}?${params.toString()}`);
    const json = await response.json();
    setData(json.data || []);
    setTotal(json.total || 0);
  } finally {
    setLoading(false);
  }
}, [currentPage, debouncedSearchTerm]);
```

Rules:

* Prefer a single `fetchData` function with `useCallback` for paginated pages.
* Reuse that fetch function after create, update, delete, approve, reject, or filter changes.
* Keep query param names aligned with the API: `page`, `limit`, `search`, `status`, `month`, `year`, `tenantId`, and similar existing params.

---

# Actions

Every page communicating with APIs should have an `actions.ts` when the surrounding module uses that pattern.

Business logic belongs inside actions.

UI components should never contain business logic.

Avoid calling `fetch()` directly inside UI components unless the project already follows that pattern.

---

# DTO

Whenever communicating with APIs:

Always create DTOs inside:

```text
lib/dto/
```

Example:

```text
lib/
└── dto/
    ├── user.ts
    ├── submission.ts
    └── overtime.ts
```

Never place DTOs inside page folders.

Reuse existing DTOs whenever possible.

If a module still stores API interfaces in local `types.ts` but those interfaces are true API contracts:

* move them into `lib/dto/`
* rename them with `Dto` suffix
* use descriptive file names such as `finance-account-category.ts`
* update imports across the feature
* remove obsolete local types once migration is complete

Examples:

* `AccountCategoryDto`
* `JournalDto`
* `PartnerDto`

---

# Types

Avoid redefining interfaces.

Before creating new types, search:

* local `types.ts`
* `lib/dto`

Reuse existing types whenever possible.

---

# Helpers

Before writing any helper:

Search inside:

```text
lib/
```

If a helper already exists:

* reuse it
* never rewrite it

Examples:

* formatter
* validator
* pagination
* currency
* date
* upload
* table

If a helper is genuinely new:

* place it in the appropriate `lib/helper` or existing shared utility area
* do not bury reusable helpers inside page components

---

# Existing Components

Before creating any component:

Search the project first.

Priority:

1. Reuse existing component
2. Extend existing component
3. Create a new component

Never recreate existing UI.

---

# UI Standards

Always use components from:

```text
@/components/ui
```

Examples:

* Button
* Card
* Dialog
* Input
* Label
* Badge
* Select
* DropdownMenu
* Alert
* Sheet
* Tabs
* Skeleton

Never recreate these components.

Reuse them.

The user strongly prefers shared UI primitives and consistent interaction patterns.

Rules:

* Do not use raw HTML buttons, selects, or modal structures when a shared UI component exists.
* Avoid plain legacy form layouts if equivalent form layout patterns already exist in the repo and can be reused.
* Delete actions should follow the established confirmation or popover pattern used elsewhere in the project.
* Dialog sizing should be adjusted to match the content and follow existing modules.
* Preserve dark mode support.

When modernizing old pages:

* replace inconsistent raw markup with shared UI components
* keep the visual hierarchy aligned with other modules
* avoid introducing a visibly different page style

---

# Filter Standards

Do not create custom filter UIs.

Before creating any filter:

* Search existing pages that already implement filters.
* Reuse the existing filter layout.
* Reuse the same spacing.
* Reuse the same components.
* Reuse the same interactions.
* Reuse the same styling.

All pages must have a consistent filter UI.

Never introduce a different filter design unless explicitly requested.

For text-based filters that trigger API requests:

* implement debounce to avoid excessive requests
* keep the typing experience responsive
* apply the same debounce pattern across overtime, reimbursement, payroll, and similar list pages

If search exists in the UI:

* make sure the backend endpoint actually supports the `search` query param
* do not ship a frontend-only search input that does not affect the API

---

# Table Standards

Reuse the existing table implementation.

Support:

* pagination
* searching
* sorting
* loading
* empty state

Do not build a custom table unless absolutely necessary.

---

# Styling

Use:

* Tailwind CSS
* Existing spacing
* Existing typography
* Existing colors
* Existing shadows
* Existing border radius

Maintain consistency across all pages.

Support:

* Responsive layout
* Dark mode

---

# Forms

Reuse existing form patterns.

Validation should remain centralized.

Avoid duplicated validation logic.

Move large forms into reusable components.

For edit forms:

* make sure existing data appears correctly when editing
* use shared formatting helpers for date and time values
* if a new formatting helper is needed, place it in `lib/helper`

---

# Dialog Standards

Always use the shared Dialog component.

Avoid custom modal implementations.

Reuse existing dialog patterns.

For dense business forms:

* allow wider dialog widths when needed
* multi-column layouts are acceptable if they improve readability
* keep layouts aligned with employee, recap, and similar admin-facing forms

---

# Dashboard Standards

Dashboard content must be role-aware and useful for decision making.

Do not reuse the same dashboard blocks for every role.

Expected direction:

* `super_admin`
  * tenant-level strategy
  * top tenants
  * most active tenants
  * expiring subscriptions
  * tenant and employee growth trends
  * avoid low-value operational cards unless explicitly requested
* `admin`
  * tenant operations
  * employee distribution
  * pending submissions
  * new employees
  * attendance visibility
* `employee`
  * personal attendance
  * personal submissions
  * personal overtime or work summary
* `finance`
  * accounts
  * journals
  * partners
  * finance workflow metrics

When adding dashboard metrics:

* prefer metrics that support decisions for that role
* avoid mixing strategic metrics with low-value noise
* explain counts clearly through labels or subtitles

---

# Date And Time Handling

Be careful with locale and form input values.

Rules:

* Reuse date helpers inside `lib/helper/`
* If new date and time formatting helpers are needed, place them in `lib/helper`, not inside page components
* Keep input formatting stable for `date` and `time` fields
* Avoid server and client hydration mismatches caused by locale formatting
* Be especially careful with `toLocaleString("id-ID")`, SSR text, and ISO conversion

---

# Employee Module Expectations

The employee module has stricter UI expectations than many other pages.

Rules:

* Employee forms should use shared UI components and match newer module patterns.
* Do not leave legacy raw form layouts in place when the rest of the project has moved to shared primitives.
* Recap and employee dialogs should have widths and column layouts that suit dense business data.
* Wider modal layouts and 3-column desktop arrangements are acceptable when they improve readability and align with the request.
* Export output must include all relevant employee titles and fields if those fields are shown in the data model.

---

# Finance Module Expectations

Finance submodules should mirror the same structure as other mature modules.

Rules:

* Do not centralize many unrelated finance pages into one debugging-heavy file.
* Each finance submodule should have its own `page.tsx`, `page.config.tsx`, and local components when the pattern is already used elsewhere.
* Finance dashboard cards should remain stable in size; adapt typography when values are long.
* Keep customer, vendor, account category, account, journal, and ledger pages structurally aligned.
* Prefer smaller, feature-scoped files over one oversized shared page file.

---

# Loading

Every async page should provide:

* loading skeleton
* empty state
* error state

---

# Icons

Use the existing icon library already used by the project.

Keep icon sizes consistent.

---

# File Upload

Every upload feature must use the existing MinIO implementation.

Never store uploaded files locally.

Reuse existing upload helpers.

Never introduce another upload implementation.

---

# Permissions

Whenever creating a new module or page:

Always update:

* Model
* Actions

inside:

```text
MASTER_PERMISSIONS
```

Never create a new feature without updating permissions.

---

# Naming

Components:

```text
form-data.tsx
table.tsx
dialog.tsx
modal.tsx
card.tsx
```

Types:

```text
Employee
EmployeeForm
EmployeeFilter
EmployeeState
```

Actions:

```text
fetchEmployees
createEmployee
updateEmployee
deleteEmployee
```

DTO:

```text
SomethingDto
```

Avoid ambiguous names:

```text
data
temp
item
test
newData
```

---

# Imports

Prefer alias imports.

```text
@/components
@/components/ui
@/lib
@/hooks
@/types
```

Avoid long relative imports.

---

# Code Style

Prefer:

* early return
* async/await
* descriptive variable names
* optional chaining
* nullish coalescing
* small functions

Avoid:

* duplicated state
* unnecessary `useEffect`
* unnecessary abstraction

---

# File Length

Recommended maximums:

* `page.tsx` ≤ 700 lines
* component ≤ 500 lines
* action ≤ 250 lines
* helper ≤ 150 lines

Split files when they become too large.

---

# Performance

* Avoid unnecessary re-renders.
* Avoid duplicated state.
* Avoid duplicated API calls.
* Memoize expensive computations when appropriate.
* Reuse existing data whenever possible.

---

# Final Checklist

Before completing any task, verify:

* Project structure is followed
* Dynamic page structure matches equivalent modules
* Page has `types.ts`
* Page has `page.config.tsx` when the surrounding pattern uses it
* Page has `actions.ts` when needed
* DTO created or reused
* Existing helper reused
* Existing component reused
* Existing filter implementation reused
* Existing table implementation reused
* Uses `@/components/ui`
* Uses `page` and `limit` pagination
* No duplicate API requests
* Search inputs are really implemented in the API
* Debounce added where needed for live filters
* Uses MinIO for uploads
* `MASTER_PERMISSIONS` updated
* Role-specific dashboards show relevant information
* Run verification in this order:
  * `npm run build`
  * `npm run lint`
  * manual review of the affected UI and main user flow
* `npm run build` is required before considering the work complete
* Responsive
* Dark mode compatible
* Clean and maintainable code

---

# AI Behavior

When generating code:

* Do not introduce a new architecture unless explicitly requested.
* Follow existing project patterns.
* Keep code concise and maintainable.
* Minimize unnecessary comments.
* Prefer consistency over creativity.
* Reuse existing helpers, DTOs, actions, components, and utilities whenever possible.
* Update all related files when implementing a feature.
* When creating a new feature, include permissions, DTOs, actions, and supporting files.
* Always search the project before generating new code.
* Never create a new UI pattern if an equivalent implementation already exists in the project.
* The existing project implementation is the source of truth. Match its coding style, UI structure, and user experience as closely as possible.
