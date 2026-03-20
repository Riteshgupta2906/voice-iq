"use client";

import { useEffect, useState } from "react";
import { KeyRound, User } from "lucide-react";

import { StudentDashboard } from "@/components/student/student-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const SESSION_KEY = "voiceiq_student";

export default function StudentPage() {
  const [studentData, setStudentData] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) setStudentData(JSON.parse(stored));
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  function handleLoginSuccess(data) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    setStudentData(data);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setStudentData(null);
  }

  if (!ready) return null;

  if (!studentData) {
    return <CandidateSelectPage onSuccess={handleLoginSuccess} />;
  }

  return <StudentDashboard studentData={studentData} onLogout={handleLogout} />;
}

// ── Candidate list + key prompt ───────────────────────────────────────────────

function CandidateSelectPage({ onSuccess }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selected, setSelected] = useState(null); // { id, name }
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((data) => {
        setCandidates(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setFetchError("Failed to load candidates.");
        setLoading(false);
      });
  }, []);

  async function handleKeySubmit(e) {
    e.preventDefault();
    setKeyError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selected.id, key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setKeyError(data.error ?? "Invalid key.");
        return;
      }
      onSuccess(data);
    } catch {
      setKeyError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Key entry screen ──────────────────────────────────────────────────────
  if (selected) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6">
        <Card className="w-full">
          <CardHeader className="pb-4">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#e84c2b" }}
            >
              Student portal
            </p>
            <CardTitle className="text-2xl">
              Sign in as {selected.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleKeySubmit}>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Access key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="pl-9"
                  required
                  autoFocus
                />
              </div>
              {keyError && (
                <p className="text-xs" style={{ color: "#e84c2b" }}>
                  {keyError}
                </p>
              )}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setSelected(null);
                  setKey("");
                  setKeyError(null);
                }}
              >
                Back
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ── Candidate list ────────────────────────────────────────────────────────
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-6 text-center">
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#e84c2b" }}
        >
          Student portal
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Select your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick your name to continue.
        </p>
      </div>

      <div className="space-y-3">
        {loading && (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        )}
        {fetchError && (
          <p className="text-center text-sm" style={{ color: "#e84c2b" }}>
            {fetchError}
          </p>
        )}
        {!loading && !fetchError && candidates.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No candidates registered yet.
          </p>
        )}
        {candidates.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.phone?.slice(0, 7)}XXX
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.courseName ?? "No course assigned"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelected({ id: c.id, name: c.name })}
              >
                Sign in as
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
