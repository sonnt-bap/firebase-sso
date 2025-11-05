"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

type UiState = {
  loading: boolean;
  user: User | null;
};

export default function HomePage() {
  const router = useRouter();
  const [{ loading, user }, setUiState] = useState<UiState>({
    loading: true,
    user: null,
  });
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth(), (firebaseUser) => {
      setUiState({ loading: false, user: firebaseUser });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  const partnerUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_PARTNER_APP_URL;
    if (!base) {
      return null;
    }
    return base.endsWith("/") ? `${base.slice(0, -1)}` : base;
  }, []);

  const handleLaunchPartner = async () => {
    if (!user) {
      return;
    }

    if (!partnerUrl) {
      setSsoError("Partner application URL is not configured.");
      return;
    }

    setLaunching(true);
    setSsoError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/auth/custom-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          targetApp: "kyc-system",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to request custom token");
      }

      const data = (await response.json()) as { customToken: string };
      const ssoPath = `${partnerUrl}/sso?token=${encodeURIComponent(
        data.customToken,
      )}`;
      window.open(ssoPath, "_blank", "noopener");
    } catch (error) {
      console.error("Failed to launch partner app", error);
      setSsoError("Unable to generate SSO token. Please try again.");
    } finally {
      setLaunching(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth());
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950/5">
        <p className="text-sm text-slate-600">Loading user information…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-slate-950/5 px-4 py-12">
      <header className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              User System Dashboard
            </h1>
            <p className="text-sm text-slate-600">
              Signed in as {user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">
            Account details
          </h2>
          <dl className="mt-4 space-y-2 text-sm text-slate-700">
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600">UID</dt>
              <dd className="truncate pl-2 text-slate-900">{user.uid}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600">Email</dt>
              <dd className="pl-2 text-slate-900">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600">Email verified</dt>
              <dd className="pl-2 text-slate-900">
                {user.emailVerified ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">
            SSO sign-in to KYC System
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Click the button below to launch the kyc-system app. Your current
            session will authenticate automatically using a Firebase Custom
            Token.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleLaunchPartner}
              disabled={launching}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {launching
                ? "Generating sign-in token..."
                : "Open kyc-system app"}
            </button>
            {ssoError ? (
              <p className="text-sm text-red-600" role="alert">
                {ssoError}
              </p>
            ) : null}
          </div>
          {!partnerUrl ? (
            <p className="mt-2 text-sm text-amber-600">
              NEXT_PUBLIC_PARTNER_APP_URL environment variable is missing.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
