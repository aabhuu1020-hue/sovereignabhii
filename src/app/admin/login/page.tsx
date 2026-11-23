"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        throw new Error("Supabase configuration is missing.");
      }

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError || !data.user) {
        throw new Error("Invalid email or password.");
      }

      if (data.user.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("This account does not have administrator access.");
      }

      const next = searchParams.get("next");
      const destination = next === "/admin" ? next : "/admin";

      router.replace(destination);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-box">
        <Link href="/" className="admin-back">
          ← SOVEREIGNABHII
        </Link>

        <p className="admin-label">PRIVATE AUTHOR ACCESS</p>

        <h1>
          Welcome<br />
          <i>Back.</i>
        </h1>

        <p className="admin-description">
          This is the private administration area of SOVEREIGNABHII.
          Access is reserved for the website owner.
        </p>

        <form onSubmit={handleLogin} className="secure-login-form">
          <label htmlFor="admin-email">Email Address</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your admin email"
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            required
          />

          {error && (
            <p className="secure-login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "VERIFYING..." : "SECURE LOGIN"}
          </button>
        </form>

        <Link href="/" className="admin-home">
          RETURN TO PUBLIC WEBSITE
        </Link>
      </div>
    </main>
  );
}
