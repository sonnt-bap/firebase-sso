import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let adminApp: App | null = null;

function getPrivateKey(): string {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) {
    throw new Error("FIREBASE_PRIVATE_KEY is not set.");
  }

  return key.replace(/\\n/g, "\n");
}

function initAdmin(): App {
  const existing = getApps();
  if (existing.length) {
    return existing[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !clientEmail) {
    throw new Error(
      "FIREBASE_PROJECT_ID and FIREBASE_CLIENT_EMAIL environment variables must be configured.",
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: getPrivateKey(),
    }),
  });
}

export function adminAuth() {
  if (!adminApp) {
    adminApp = initAdmin();
  }
  return getAuth(adminApp);
}

