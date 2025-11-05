# Firebase SSO Prototype with Next.js

This repository contains two standalone Next.js applications that demonstrate a Single Sign-On (SSO) workflow powered by Firebase Authentication:

- **kyc-system** – represents the KYC-facing portal.
- **user-system** – represents the end-user portal.

## Directory layout

```
.
|-- README.md                # Shared documentation describing the SSO flow
|-- kyc-system/              # Next.js app acting as the KYC system
|   |-- .env.example         # Sample environment variables for the KYC app
|   |-- src/app/             # App Router pages, UI, and API routes
|   |-- src/lib/firebase/    # Firebase client/admin initialisation helpers
|   |-- README.md            # Short note that points back to this document
`-- user-system/             # Next.js app acting as the user portal
    |-- .env.example         # Sample environment variables for the user app
    |-- src/app/             # App Router pages, UI, and API routes
    |-- src/lib/firebase/    # Firebase helpers mirroring the KYC app
    |-- README.md            # Short note dedicated to the user app
```

Both applications:

- Allow registration and sign-in with email/password via Firebase Auth.
- Use the Firebase Admin SDK in Next.js API routes to verify `idToken`s and mint `customToken`s.
- Use the Firebase client SDK in the browser to call `getIdToken()` and sign the user into the partner app with `signInWithCustomToken()`.
- Provide a button that opens the other application and automatically authenticates the user with the generated custom token.

## Environment preparation

1. Create a Firebase project and enable the Email/Password authentication provider.
2. Generate a Firebase Admin SDK service account and download the JSON credentials.
3. Populate the `.env.local` file for each application following the template:

   ```bash
   # kyc-system/.env.local
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_PARTNER_APP_URL=http://localhost:3001

   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...@....gserviceaccount.com
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...(replace real newlines with \\n when storing in .env files)...\n-----END PRIVATE KEY-----
   ```

   ```bash
   # user-system/.env.local
   # Use the same Firebase project values
   NEXT_PUBLIC_PARTNER_APP_URL=http://localhost:3000
   ```

4. Ensure the `FIREBASE_PRIVATE_KEY` value retains newline characters. When copying into a `.env` file, replace each newline with the literal sequence `\n`.

## Install and run locally

```bash
# Install dependencies
cd kyc-system && npm install
cd ../user-system && npm install

# Start both apps in separate terminals
cd kyc-system && npm run dev   # http://localhost:3000
cd user-system && npm run dev  # http://localhost:3001
```

After signing in on one application, click the “Open other application” button to launch the partner app in a new tab. The second app reads the `customToken` from `/sso?token=...` and signs in using `signInWithCustomToken()`.

## Key functional modules

- `kyc-system/src/lib/firebase/client.ts` (and `user-system/src/lib/firebase/client.ts`): initialise the Firebase client with `browserLocalPersistence`.
- `kyc-system/src/lib/firebase/admin.ts` (and the mirrored file in `user-system`): create a singleton Firebase Admin SDK instance.
- `kyc-system/src/app/api/auth/custom-token/route.ts` (mirrored in `user-system`): API route that validates an `idToken` via `verifyIdToken()` and returns a brand-new custom token.
- `kyc-system/src/app/(auth)/login` & `/register` (and equivalents in `user-system`): email/password forms powered by the Firebase client SDK.
- `kyc-system/src/app/sso/page.tsx` (and `user-system/src/app/sso/page.tsx`): intermediate pages that consume the custom token with `signInWithCustomToken()`.
- `kyc-system/src/app/page.tsx` (and `user-system/src/app/page.tsx`): dashboards showing user details and a button that prepares a custom token for the partner app.

## Quick manual test

1. Start both applications locally.
2. Register and sign in at `http://localhost:3000/login`.
3. Click “Open user-system app” to generate a custom token and navigate to `http://localhost:3001/sso?token=...`.
4. Confirm that the user-system app signs you in without requiring credentials again.
5. Repeat the flow in the opposite direction starting from `http://localhost:3001`.

## Helper scripts

- `npm run lint` – run ESLint for each application.
- `npm run dev` – start the development server (Next.js with Tailwind CSS).
