"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_EMAILS = [
  "mustafa@next-wave.tech",
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
      setMessage("Diese E-Mail-Adresse ist nicht freigeschaltet.");
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          shouldCreateUser: false,
        },
      });

      if (error) {
        throw error;
      }

      setMessage("Login-Link wurde per E-Mail versendet.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Fehler beim Versand des Login-Links."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md items-center px-6">
      <div className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">E-Mail-Login</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gib deine Firmen-E-Mail ein. Du erhältst einen Magic Link.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mustafa@deinedomain.de"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-brand-orange"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-orange px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Wird gesendet..." : "Login-Link senden"}
          </button>
        </form>

        {message ? (
          <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-200">
            {message}
          </div>
        ) : null}
      </div>
    </main>
  );
}
