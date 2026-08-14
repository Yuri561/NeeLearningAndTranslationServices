# Frontend–Backend Integration Audit

Audit date: 2026-08-11  
Contract source: deployed `https://neelearningandtranslationservices.onrender.com/openapi.json`

## Scope and verification level

The frontend source, route tree, API wrappers, forms, query invalidation, role guards, live OpenAPI schema, and safe public GET responses were inspected. The production build and automated tests pass after the fixes.

No test credentials were provided. Therefore, authenticated mutations and database effects across three simultaneous accounts were not executed against production. They are marked “Partially working” even when the source and contract now match.

## 1. Pages audited

### Admin

- Overview: live services and bookings
- Tutors: tutor registration and tutor/service roster
- Services: list, detail, tutor-specific drill-down
- Availability: list, detail, tutor-specific drill-down
- Bookings: list, detail, learner-specific and tutor-specific drill-down
- Files: translation request summaries and attached file management
- Settings: account/security UI

### Tutor

- Overview: own services, availability, bookings
- Services: create, edit, delete, activate/deactivate
- Availability: create, edit, delete, activate/deactivate
- Bookings: request, upcoming, history views and status updates
- Files: informational placeholder because assignment APIs do not exist
- Settings: account/security UI; tutor-profile fields are not integrated

### Learner

- Overview: live booking and service-derived statistics
- Services and booking entry
- Bookings, upcoming bookings, booking history
- Tutor availability
- Files/translation workspace
- Profile and password settings

## 2. API-to-page mapping

Legend: ✅ Working, 🔧 Fixed, ⚠️ Partially working, ❌ Missing integration/API

### Authentication

| API | Page / trigger | Role | Status |
|---|---|---|---|
| `POST /api/v1/auth/register` | Register form; Admin Tutors form | Public / Admin | ⚠️ Connected, but backend accepts elevated public roles |
| `POST /api/v1/auth/login` | Login and post-registration login | Public | ✅ Working contract |
| `POST /api/v1/auth/logout` | All dashboard sidebars | All authenticated roles | ⚠️ Connected; schema has no JWT security/revocation guarantee |
| `GET /api/v1/auth/me` | protected routes, role redirect, dashboards | All authenticated roles | ✅ Working contract |
| `POST /api/v1/auth/become-tutor` | No page | Learner | ❌ Unused; conflicts with Admin-controlled onboarding |
| `POST /api/v1/auth/forgot-password` | Forgot Password | Public | ✅ Working contract and tests |
| `POST /api/v1/auth/reset-password` | Reset Password | Public | ✅ Working contract and tests |
| `POST /api/v1/auth/change-password` | Account Security / settings | Learner, Tutor | ✅ Working contract and tests |
| `GET /api/v1/auth/google/login` | Login/Register Google action | Public | ✅ Connected |
| `GET /api/v1/auth/google/callback` | Google callback page | Public | ✅ Connected |

### Services

| API | Page / trigger | Role | Status |
|---|---|---|---|
| `GET /api/v1/services/` | Admin Services/Overview | Admin | ✅ Connected |
| `POST /api/v1/services/` | Tutor Services create | Tutor | ⚠️ Contract matched; authenticated write not production-tested |
| `POST /api/v1/services/bulk` | No page | Tutor/Admin | ❌ Unused optional onboarding feature |
| `GET /api/v1/services/tutor/{tutor_id}` | Tutor Services and Admin tutor drill-down | Tutor/Admin | 🔧 Fixed stale route and removed fetch-all filtering |
| `GET /api/v1/services/with-tutors` | Learner Services/Availability; Admin Tutors | Learner/Admin | ✅ Connected |
| `GET /api/v1/services/{service_id}` | Admin service details / Tutor edit | Tutor/Admin | ✅ Connected |
| `PUT /api/v1/services/{service_id}` | Tutor Services edit/activate | Tutor | ⚠️ Connected; ownership must be backend-enforced |
| `DELETE /api/v1/services/{service_id}` | Tutor Services delete | Tutor | ⚠️ Connected; ownership must be backend-enforced |

### Availability

| API | Page / trigger | Role | Status |
|---|---|---|---|
| `GET /api/v1/availability/` | Admin Availability | Admin | ✅ Connected |
| `POST /api/v1/availability/bulk` | Tutor Availability create | Tutor | ⚠️ Connected; authenticated mutation not production-tested |
| `GET /api/v1/availability/tutor/{tutor_id}` | Learner tutor availability, Tutor Availability, Admin drill-down | All roles | ✅ Connected |
| `GET /api/v1/availability/{availability_id}` | Learner/Admin details | Learner/Admin | ✅ Connected |
| `PUT /api/v1/availability/{availability_id}` | Tutor Availability edit/toggle | Tutor | ⚠️ Connected; ownership/overlap validation is backend work |
| `DELETE /api/v1/availability/{availability_id}` | Tutor Availability delete | Tutor | ⚠️ Connected; booked-slot behavior is undocumented |

### Bookings

| API | Page / trigger | Role | Status |
|---|---|---|---|
| `GET /api/v1/bookings/` | Admin Overview/Bookings | Admin | ⚠️ Connected, but backend exposes all bookings publicly |
| `POST /api/v1/bookings/` | Learner booking modal | Learner | 🔧 Payload fixed to live `learner_id/service_id/tutor_id/availability_id` schema |
| `GET /api/v1/bookings/learner/{learner_id}` | Learner Overview/Bookings; Admin drill-down | Learner/Admin | 🔧 Replaced unscoped fetch-all and stale `student` route |
| `GET /api/v1/bookings/tutor/{tutor_id}` | Tutor Overview/Bookings; Admin drill-down | Tutor/Admin | 🔧 Replaced unscoped fetch-all and stale `teacher` route |
| `GET /api/v1/bookings/{booking_id}` | Admin booking detail | Admin | ⚠️ Connected, but backend endpoint is public |
| `PUT /api/v1/bookings/{booking_id}` | No page | Unknown | ❌ Unused and publicly writable in schema |
| `DELETE /api/v1/bookings/{booking_id}` | No page | Unknown | ❌ Unused and publicly destructive in schema |
| `PATCH /api/v1/bookings/{booking_id}/status` | Tutor Bookings status action | Tutor | ⚠️ Connected, but backend endpoint is public and transition rules are undocumented |

### Files and translation requests

| API | Page / trigger | Role | Status |
|---|---|---|---|
| `POST /api/v1/files/upload` | Learner Files upload | Learner | ⚠️ Connected; backend trusts client-supplied uploader/request IDs and has no JWT security |
| `GET /api/v1/files/` | No page | Unknown | ❌ Unused; live endpoint publicly exposes all file metadata/URLs |
| `GET /api/v1/files/{file_id}` | Learner/Admin file detail | Learner/Admin | 🔧 Admin stale `/files/upload/{id}` path fixed |
| `PUT /api/v1/files/{file_id}` | No page | Authenticated | ❌ Unused; no replace/metadata edit UI |
| `DELETE /api/v1/files/{file_id}` | Learner/Admin delete | Learner/Admin | ⚠️ Connected; ownership rules not represented in OpenAPI |
| `GET /api/v1/files/translation-request/{id}` | Learner Files and Admin request files | Learner/Admin | ✅ Connected, but endpoint is public |
| `GET /api/v1/translation-requests` | Admin Files | Admin | ⚠️ Connected, but endpoint is public and exposes learner names/emails |

### Translation widget

| API | Page / trigger | Role | Status |
|---|---|---|---|
| `GET /api/v1/translate/` | No page (returns HTML widget) | Public | ❌ Existing UI incorrectly expects a POST text API |
| `GET /api/v1/translate/widget` | No page | Public | ❌ Unused widget alternative |
| `GET /api/v1/translate/snippet` | No page | Public | ❌ Unused embed alternative |
| `GET /api/v1/translate/config` | No page | Public | ❌ Unused embed configuration |
| `GET /api/v1/translate/languages` | Learner Files/Translation | Learner | ✅ Connected |

### Learner profiles

| API | Page / trigger | Role | Status |
|---|---|---|---|
| `GET /api/v1/learner-profiles/me` | Learner Settings | Learner | ⚠️ Connected; backend currently returns 404 for accounts without profile rows |
| `PUT /api/v1/learner-profiles/me` | Learner Settings save | Learner | ✅ Connected contract |
| `POST /api/v1/learner-profiles/me/profile-picture` | Learner Settings upload | Learner | ✅ Connected contract |
| `DELETE /api/v1/learner-profiles/me/profile-picture` | Learner Settings remove | Learner | ✅ Connected contract |
| `GET /api/v1/learner-profiles/{user_id}` | Hook exists, no rendered page uses it | Public | ❌ Unused public-profile lookup |

### Tutor profiles

| API | Page / trigger | Role | Status |
|---|---|---|---|
| `GET /api/v1/tutor-profiles/` | Admin Tutors | Admin | 🔧 Fixed stale `teacher-profiles` path |
| `GET /api/v1/tutor-profiles/me` | No page | Tutor | ❌ Missing integration |
| `PUT /api/v1/tutor-profiles/me` | No page | Tutor | ❌ Tutor Settings does not edit professional profile |
| `GET /api/v1/tutor-profiles/{user_id}` | No tutor-detail page | Public/Learner | ❌ Missing integration |
| `POST /api/v1/tutor-profiles/me/profile-picture` | No page | Tutor | ❌ Missing integration |
| `DELETE /api/v1/tutor-profiles/me/profile-picture` | No page | Tutor | ❌ Missing integration |

### Lesson history and health

| API | Page / trigger | Role | Status |
|---|---|---|---|
| `GET /api/v1/lesson-history/` | No page | Authenticated | ❌ Missing integration |
| `POST /api/v1/lesson-history/` | No page | Authenticated | ❌ Missing workflow |
| `GET /api/v1/lesson-history/learner/{learner_id}` | No page | Authenticated | ❌ Learner history currently derives from bookings only |
| `GET /api/v1/lesson-history/tutor/{tutor_id}` | No page | Authenticated | ❌ Tutor history currently derives from bookings only |
| `GET /api/v1/lesson-history/{lesson_id}` | No page | Authenticated | ❌ Missing integration |
| `PATCH /api/v1/lesson-history/{lesson_id}` | No page | Authenticated | ❌ Missing integration |
| `DELETE /api/v1/lesson-history/{lesson_id}` | No page | Authenticated | ❌ Missing integration |
| `GET /` | Deployment health check | Infrastructure | ✅ Returned 200 with API-running message |

## 3. Problems found and fixes made

| Problem | Root cause | Affected UI/API | Fix |
|---|---|---|---|
| Learner fetched every booking and filtered locally | Old integration ignored scoped live route | Learner Overview/Bookings | Use `/bookings/learner/{id}` |
| Tutor fetched every booking and filtered locally | Old integration ignored scoped live route | Tutor Overview/Bookings | Use `/bookings/tutor/{id}` |
| Booking payload included obsolete role-ID aliases | Frontend types followed a historical contract | Booking modal | Send only the live learner and tutor identifiers |
| Tutor services fetched all tutors then filtered by ID/email | Old workaround | Tutor Services/Overview | Use `/services/tutor/{id}` |
| Admin tutor services used `/services/teacher/{id}/` | Renamed live route | Admin Services | Use `/services/tutor/{id}` |
| Admin booking drill-down used `student`/`teacher` routes | Renamed live routes | Admin Bookings | Use `learner`/`tutor` routes |
| Admin tutor listing used `/teacher-profiles/` | Renamed live route | Admin Tutors | Use `/tutor-profiles/` |
| Admin file detail used `/files/upload/{id}/` | Historical route no longer exists | Admin Files | Use `/files/{id}` |
| Mutations refreshed only the actor’s cache | Narrow query invalidation | Services, bookings, availability | Invalidate learner, tutor, and admin query families as applicable |

## 4. Cross-role flows verified

- ⚠️ Learner → booking → Tutor: API routes/payload/query refresh are code-verified; production DB mutation was not run.
- ⚠️ Tutor → booking status → Learner/Admin: status API and cross-role cache invalidation are code-verified; backend authorization is missing.
- ⚠️ Tutor → service → Learner/Admin: mutation and invalidation are code-verified; no authenticated production mutation was run.
- ⚠️ Tutor → availability → Learner/Admin: mutation and invalidation are code-verified; overlap/double-booking rules are unknown.
- ❌ Admin → Tutor approval: no approval/rejection/suspension/verification API exists.
- ❌ Completed booking → lesson history: the backend contract exposes lesson-history CRUD but no documented automatic linkage.
- ❌ Translation status → Learner: no translation-request create/update/status/result API exists.

## 5. Remaining backend problems

- Critical: all booking GET, POST, PUT, DELETE, and status PATCH operations have no JWT security in OpenAPI.
- Critical: file upload, list, detail, request-file lookup, and translation-request summaries are public. Live read-only checks returned platform records, learner emails, and storage URLs without a token.
- Critical: public registration accepts `admin` and `tutor`; the API must force public registration to `learner` and provide separate Admin-authorized role management.
- Critical: file upload trusts `uploaded_by_user_id` and an arbitrary `related_translation_request_id` from the client.
- Missing Admin user management, role change, tutor approve/reject/verify/suspend, and activation APIs.
- `POST /auth/become-tutor` immediately changes a learner to tutor, contradicting Admin-controlled onboarding.
- Missing translation-request create/update/assignment/status/result/quotation workflow.
- No text-translation POST exists; `/translate/` is GET-only HTML.
- Missing payments, refunds, transactions, tutor payouts, revenue, statistics/analytics, reviews/ratings, and notification APIs.
- Collection endpoints have no pagination/filter/sort parameters.
- Availability has no documented overlap, recurrence, timezone, holiday, booked-slot, or double-booking guarantees.
- Booking ownership, status transition rules, conflict prevention, cancellation reason, rescheduling, reminders, meeting links, and payment state are not documented/enforced in the contract.
- No dedicated `/health` or `/healthz` endpoint.

## 6. Remaining frontend problems

- Tutor Settings does not load or update `/tutor-profiles/me` or manage a tutor picture.
- There is no learner-facing tutor profile/details page using `/tutor-profiles/{user_id}`.
- Quick text translation calls an API operation absent from the live contract and will fail until replaced with the widget or supported by a backend POST.
- Learner uploads manufacture translation-request IDs locally because no create-request API exists.
- Tutor Files is intentionally informational because translator assignment APIs are missing.
- Lesson-history pages/hooks are missing; booking-history views are not a substitute for the lesson-history module.
- Admin tutor management can create tutors but cannot approve, reject, verify, suspend, activate, or change roles.
- True cross-account real-time updates are not available; React Query invalidation only updates caches in the active browser session. Polling, WebSockets, or server events are needed for immediate updates in another user’s session.

## 7. Unused APIs

- `POST /services/bulk`
- `PUT /bookings/{id}` and `DELETE /bookings/{id}`
- `POST /auth/become-tutor`
- `GET /files/` and `PUT /files/{id}`
- `GET /translate/`, `/translate/widget`, `/translate/snippet`, `/translate/config`
- `GET /learner-profiles/{user_id}` (wrapper exists but no page consumes it)
- Tutor profile `/me`, update, public detail, upload picture, delete picture
- Every lesson-history endpoint

## 8. Missing API integrations

- Tutor professional profile and picture → Tutor Settings
- Public tutor detail → Learner Services/Tutor detail
- Lesson history → Learner, Tutor, and Admin history pages
- Translation widget/snippet → replace the nonexistent text POST, if product requirements accept Google’s widget
- Bulk service creation → optional tutor onboarding

## 9. Security issues

- Frontend route guards correctly redirect users away from other-role dashboards after `/auth/me` resolves.
- Those guards are presentation controls only. The backend currently leaves booking and file data/actions unprotected.
- Learner booking creation still must send `learner_id` because the live schema requires it. The backend should derive this from the JWT.
- File uploads still must send `uploaded_by_user_id` because the live schema requires it. The backend should derive this from the JWT.
- Public elevated-role registration and instant self-promotion must be removed or restricted server-side.
- Logout has no documented token revocation; the frontend clears local/session storage regardless.

## 10. Final status

| System | Status |
|---|---|
| Authentication | ⚠️ Partially working — connected; backend role escalation/revocation issues |
| Learner Profiles | ⚠️ Partially working — connected; missing-profile backend 404 issue |
| Tutor Profiles | ❌ Missing core frontend integration |
| Services | ⚠️ Partially working — routes fixed; writes not end-to-end tested |
| Availability | ⚠️ Partially working — connected; business constraints unverified |
| Bookings | ⚠️ Partially working — routes/payload fixed; backend authorization critical |
| Translation | ❌ Missing backend text/request workflow |
| Files | ⚠️ Partially working — connected; ownership/privacy critical |
| Lesson History | ❌ Missing frontend integration and automatic lifecycle contract |
| Admin Management | ❌ Missing backend user/tutor approval operations |
| Cross-role Data Flow | ⚠️ Code-level synchronization improved; production cross-account flow not verified |

## Verification results

- `npm test -- --run`: 22 tests passed, including four new live-route contract tests.
- `npm run build`: passed.
- `npm run lint`: 8 pre-existing React hook-rule errors remain in marketing/home components and `LearnerServicesPage`; none are in the changed API integration files.
- Live public GET checks: root, services, availability, bookings, tutor profiles, translation requests, languages, and files returned 200.
- Build warning only: the main production JavaScript chunk exceeds 500 kB; code splitting is recommended but unrelated to API correctness.
