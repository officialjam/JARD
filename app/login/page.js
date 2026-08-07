"use client";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#10161D",
        color: "#E7EDF3",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: "12px",
            letterSpacing: "0.12em",
            color: "#F2A93B",
            border: "1px solid #B8802A",
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "3px",
            marginBottom: "16px",
          }}
        >
          CC
        </div>
        <h1 style={{ fontSize: "22px", marginBottom: "8px", fontWeight: 600 }}>Career Copilot</h1>
        <p style={{ color: "#8A96A3", marginBottom: "28px", fontSize: "13.5px" }}>
          Sign in to access your career profile.
        </p>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          style={{
            background: "#F2A93B",
            color: "#1A1206",
            border: "none",
            borderRadius: "6px",
            padding: "11px 22px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
