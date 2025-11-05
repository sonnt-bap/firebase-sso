import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

type RequestBody = {
  idToken?: string;
  targetApp?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { idToken, targetApp } = body;

    console.info("Inbound custom token request", {
      hasIdToken: Boolean(idToken),
      targetApp: targetApp ?? "unknown",
      env: {
        projectId: Boolean(process.env.FIREBASE_PROJECT_ID),
        clientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
        privateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      },
    });

    if (!idToken) {
      return NextResponse.json(
        { error: "idToken is required." },
        { status: 400 },
      );
    }

    const auth = adminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    const customToken = await auth.createCustomToken(decoded.uid, {
      targetApp: targetApp ?? "unknown",
    });

    return NextResponse.json({ customToken });
  } catch (error) {
    console.error("Failed to generate custom token", {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      env: {
        projectId: Boolean(process.env.FIREBASE_PROJECT_ID),
        clientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
        privateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      },
    });
    return NextResponse.json(
      { error: "Unable to generate custom token." },
      { status: 500 },
    );
  }
}

