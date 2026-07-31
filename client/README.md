# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Backend issues: learner profile and authentication

### Learner profile requests return `404 Not Found`

Affected requests:

```http
GET /api/v1/learner-profiles/me
PUT /api/v1/learner-profiles/me
POST /api/v1/learner-profiles/me/profile-picture
DELETE /api/v1/learner-profiles/me/profile-picture
```

The frontend paths match the API documentation. Because the authenticated
`/me` route exists but returns `404`, the likely issue is that the user exists
in the `users` table without a corresponding row in `learner_profiles`.

The backend developer should inspect the response body and server logs, then
verify the affected user:

```sql
SELECT *
FROM learner_profiles
WHERE user_id = <authenticated_user_id>;
```

Backend behavior to verify:

- Creating a learner through regular registration also creates a blank
  `learner_profiles` row.
- Creating a learner through Google authentication also creates that row.
- Existing learner accounts created before profile support are backfilled.
- Profile updates search using the authenticated user's ID.
- Picture upload confirms that the learner profile exists before saving
  `profile_picture_url`.
- Missing or expired authentication returns `401`, while `404` is reserved for
  a genuinely missing profile.

Expected successful profile response:

```json
{
  "id": 12,
  "user_id": 45,
  "bio": "Software engineering student.",
  "learning_goals": "Learn Spring Boot and microservices.",
  "preferred_language": "en",
  "profile_picture_url": null,
  "created_at": "2026-07-29T22:05:04.693Z"
}
```

### Login returns `401 Unauthorized`

Affected request:

```http
POST /api/v1/auth/login
```

This is separate from the learner-profile `404`. The backend should inspect
the response body and logs for:

- Incorrect email or password.
- An inactive user account.
- Password-hash verification failure.
- Authentication-provider restrictions, such as attempting password login for
  a Google-only account.

### Duplicate console messages in development

React development mode can mount components more than once, and the query
client may refetch after mounting or invalidation. This can display the same
failed request multiple times. It does not create the backend error; it only
makes an existing `404` more visible.

The React DevTools download message is informational and is not an application
error.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
