"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

import { CandidateForm } from "@/components/admin/candidate-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ADMIN_SESSION_KEY = "voiceiq_admin";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") setAuthed(true);
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!authed) {
    return (
      <AdminAuthGate
        onSuccess={() => {
          sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
          setAuthed(true);
        }}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
      <header className="mb-8 flex flex-col gap-6 rounded-[34px] border border-white/10 bg-white/5 px-6 py-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#e84c2b" }}>
              Voice IQ Admin
            </p>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Candidate registration and verification ops
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                Register a candidate, assign the lecture path immediately, and prepare
                the system to validate learning over a voice call instead of a passive
                checkbox.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem(ADMIN_SESSION_KEY);
                setAuthed(false);
              }}
            >
              Sign out
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <CandidateForm />
    </main>
  );
}

function AdminAuthGate({ onSuccess }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Invalid key.");
        return;
      }
      onSuccess();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6">
      <Card className="w-full">
        <CardHeader className="pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#e84c2b" }}>
            Admin portal
          </p>
          <CardTitle className="text-2xl">Enter access key</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Admin key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="pl-9"
                required
                autoFocus
              />
            </div>
            {error && <p className="text-xs" style={{ color: "#e84c2b" }}>{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Verifying…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
