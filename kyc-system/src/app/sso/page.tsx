"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function SSOPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Authorising sign-in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSignIn = async () => {
      if (!token) {
        setError("Missing SSO token.");
        setStatus("Unable to validate SSO.");
        return;
      }

      try {
        const authInstance = auth();
        const currentUser = authInstance.currentUser;

        if (currentUser) {
          const existingToken = await currentUser.getIdToken();
          if (existingToken) {
            router.replace("/");
            return;
          }
        }

        await signInWithCustomToken(authInstance, token);
        router.replace("/");
      } catch (err) {
        console.error("SSO sign-in failed", err);
        setStatus("Unable to sign in via SSO.");
        setError("Please sign in again or request a new token.");
      }
    };

    void performSignIn();
  }, [router, token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950/5 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-xl font-semibold text-slate-900">
          Connecting SSO with KYC System
        </h1>
        <p className="mt-4 text-sm text-slate-600">{status}</p>
        {error ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
