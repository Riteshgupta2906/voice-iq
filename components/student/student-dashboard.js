"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LogOut, Mic, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CALL_STATUS_META = {
  QUEUED:            { color: "#9999aa", label: "Call queued" },
  RESCHEDULED:       { color: "#c9a84c", label: "Call rescheduled" },
  INITIATED:         { color: "#c9a84c", label: "Call initiated" },
  RINGING:           { color: "#c9a84c", label: "Ringing…" },
  IN_PROGRESS:       { color: "#c9a84c", label: "Call in progress" },
  CALL_DISCONNECTED: { color: "#e84c2b", label: "Call disconnected" },
  COMPLETED:         { color: "#34d399", label: "Call completed" },
};

function CallStatusBanner({ voiceCall, phone }) {
  const meta = CALL_STATUS_META[voiceCall.status] ?? { color: "#9999aa", label: voiceCall.status };
  const isActive = ["INITIATED", "RINGING", "IN_PROGRESS"].includes(voiceCall.status);
  const isDone = voiceCall.status === "COMPLETED";
  const isFailed = voiceCall.status === "CALL_DISCONNECTED";

  return (
    <div
      className="rounded-xl border p-3 text-sm space-y-1"
      style={{
        background: isDone
          ? "rgba(52,211,153,0.08)"
          : isFailed
            ? "rgba(232,76,43,0.08)"
            : "rgba(201,168,76,0.08)",
        borderColor: isDone
          ? "rgba(52,211,153,0.2)"
          : isFailed
            ? "rgba(232,76,43,0.2)"
            : "rgba(201,168,76,0.2)",
      }}
    >
      <p className="font-medium" style={{ color: meta.color }}>
        {meta.label}
      </p>
      {isActive && (
        <p className="text-xs text-muted-foreground">
          Ongoing call to {phone} — answers will be evaluated.
        </p>
      )}
      {isDone && voiceCall.recording && (
        <a
          href={voiceCall.recording}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline"
          style={{ color: "#c9a84c" }}
        >
          Listen to recording ↗
        </a>
      )}
      {isFailed && (
        <p className="text-xs text-muted-foreground">
          The call could not be completed. Contact your admin.
        </p>
      )}
    </div>
  );
}

function getVideoId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1);
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

export function StudentDashboard({ studentData, onLogout }) {
  const student = studentData ?? null;
  const lectures = studentData?.lectures ?? [];
  const course = studentData ? { name: studentData.courseName } : null;

  const [selectedLecture, setSelectedLecture] = useState(() => lectures[0] ?? null);
  const [completedIds, setCompletedIds] = useState(new Set());
  // lectureMap: { [lectureId]: { progressStatus: "STARTED"|"COMPLETED", voiceCall: {...}|null } }
  const [lectureMap, setLectureMap] = useState({});
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null); // null | "queued" | "error"
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  // YouTube player ref — container React does NOT manage children of
  const playerContainerRef = useRef(null);

  // ── Load YouTube IFrame API script once ─────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("yt-iframe-api")) return;
    const script = document.createElement("script");
    script.id = "yt-iframe-api";
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  }, []);

  // ── Rehydrate progress + call status from DB on mount ───────────
  useEffect(() => {
    if (!student?.id) return;
    fetch(`/api/lecture-progress?userId=${student.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((progresses) => {
        const map = {};
        const completed = new Set();
        progresses.forEach((p) => {
          map[p.lectureId] = {
            progressStatus: p.status,
            voiceCall: p.voiceCalls?.[0] ?? null,
          };
          if (p.status === "COMPLETED") completed.add(p.lectureId);
        });
        setLectureMap(map);
        setCompletedIds(completed);
        setProgressLoaded(true);
      })
      .catch(() => setProgressLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  // ── Create / replace player when lecture changes ─────────────────
  const selectedLectureId = selectedLecture?.id;
  const selectedLectureUrl = selectedLecture?.youtubeUrl ?? null;

  useEffect(() => {
    if (!selectedLectureId) return;

    setHasReachedEnd(false);
    setSubmitFeedback(null);
    setTranscriptExpanded(false);

    const videoId = getVideoId(selectedLectureUrl);
    if (!videoId) return;

    let player;

    function createPlayer() {
      if (!playerContainerRef.current) return;

      // Clear any previous iframe and create a fresh target div
      playerContainerRef.current.innerHTML = "";
      const target = document.createElement("div");
      playerContainerRef.current.appendChild(target);

      player = new window.YT.Player(target, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange(event) {
            // YT.PlayerState.ENDED === 0
            if (event.data === 0) setHasReachedEnd(true);
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }

    return () => {
      try {
        player?.destroy();
      } catch {
        // player may already be gone
      }
    };
  }, [selectedLectureId, selectedLectureUrl]);

  // ── Mark lecture complete ────────────────────────────────────────
  async function handleMarkComplete() {
    if (!selectedLecture || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/voice-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: student.id,
          lectureId: selectedLecture.id,
        }),
      });

      if (res.ok) {
        const vc = await res.json();
        setCompletedIds((prev) => new Set([...prev, selectedLecture.id]));
        setLectureMap((prev) => ({
          ...prev,
          [selectedLecture.id]: { progressStatus: "COMPLETED", voiceCall: vc },
        }));
        setSubmitFeedback("queued");
      } else {
        setSubmitFeedback("error");
      }
    } catch {
      setSubmitFeedback("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!student) return null;

  const isCurrentCompleted = selectedLecture && completedIds.has(selectedLecture.id);
  const videoId = selectedLecture ? getVideoId(selectedLecture.youtubeUrl) : null;
  const completedCount = completedIds.size;
  const currentVoiceCall = selectedLecture
    ? (lectureMap[selectedLecture.id]?.voiceCall ?? null)
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#e84c2b" }}
          >
            Student portal
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {student.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {course?.name ?? "—"} · {student.cohort}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="font-semibold">
              <span style={{ color: "#c9a84c" }}>{completedCount}</span>
              <span className="text-muted-foreground">
                /{lectures.length} lectures
              </span>
            </p>
          </div>
          {onLogout && (
            <Button variant="secondary" size="sm" onClick={onLogout}>
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          )}
        </div>
      </header>

      {/* Two-panel layout */}
      <div className="grid flex-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* ── Left: Lecture list ─────────────────────────────── */}
        <aside>
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#9999aa" }}
          >
            Lectures
          </p>
          {lectures.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No lectures added to this course yet.
            </p>
          ) : (
            <div className="space-y-2">
              {lectures.map((lecture, index) => {
                const isActive = selectedLecture?.id === lecture.id;
                const isDone = completedIds.has(lecture.id);
                const lData = lectureMap[lecture.id] ?? null;
                const isStarted = lData?.progressStatus === "STARTED";
                const vc = lData?.voiceCall ?? null;
                return (
                  <button
                    key={lecture.id}
                    onClick={() => {
                      setSelectedLecture(lecture);
                      fetch("/api/lecture-progress", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: student.id, lectureId: lecture.id, status: "STARTED" }),
                      }).catch(() => {});
                    }}
                    className="w-full rounded-2xl border p-4 text-left transition"
                    style={{
                      background: isActive ? "rgba(232,76,43,0.1)" : "rgba(10,10,15,0.5)",
                      borderColor: isActive ? "rgba(232,76,43,0.4)" : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          background: isDone
                            ? "rgba(52,211,153,0.15)"
                            : isActive
                              ? "rgba(232,76,43,0.2)"
                              : "rgba(255,255,255,0.06)",
                          color: isDone ? "#34d399" : isActive ? "#e84c2b" : "#9999aa",
                        }}
                      >
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium leading-snug ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                          {lecture.title}
                        </p>
                        {isDone && vc ? (
                          <p className="mt-0.5 text-xs" style={{ color: CALL_STATUS_META[vc.status]?.color ?? "#34d399" }}>
                            {CALL_STATUS_META[vc.status]?.label ?? vc.status}
                          </p>
                        ) : isDone ? (
                          <p className="mt-0.5 text-xs" style={{ color: "#34d399" }}>Completed</p>
                        ) : isStarted ? (
                          <p className="mt-0.5 text-xs" style={{ color: "#60a5fa" }}>In progress</p>
                        ) : null}
                      </div>
                      {isActive && !isDone && (
                        <PlayCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#e84c2b" }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* ── Right: Player + completion ─────────────────────── */}
        <section className="space-y-4">
          {!selectedLecture ? (
            <div
              className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-dashed"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="text-center space-y-2">
                <PlayCircle
                  className="mx-auto h-10 w-10"
                  style={{ color: "#9999aa" }}
                />
                <p className="text-sm text-muted-foreground">
                  Select a lecture to start watching
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Video card */}
              <Card>
                <CardHeader className="pb-3">
                  <p
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "#c9a84c" }}
                  >
                    {course?.name}
                  </p>
                  <CardTitle className="text-xl">
                    {selectedLecture.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {videoId ? (
                    // Container div — React does NOT manage its children,
                    // the YouTube IFrame API injects an iframe here directly.
                    <div className="aspect-video overflow-hidden rounded-xl bg-black">
                      <div ref={playerContainerRef} className="h-full w-full" />
                    </div>
                  ) : (
                    <div
                      className="flex aspect-video items-center justify-center rounded-xl border border-dashed text-sm"
                      style={{
                        borderColor: "rgba(232,76,43,0.25)",
                        color: "#9999aa",
                      }}
                    >
                      No video URL provided for this lecture.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Voice AI block + mark complete */}
              <Card>
                <CardContent className="space-y-4 p-5">
                  {/* Voice AI suggestion */}
                  <div
                    className="rounded-xl border p-4"
                    style={{
                      background: "rgba(232,76,43,0.07)",
                      borderColor: "rgba(232,76,43,0.2)",
                    }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Mic className="h-4 w-4" style={{ color: "#e84c2b" }} />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "#e84c2b" }}
                      >
                        Voice AI Verification
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Marking complete will dispatch an AI phone call to{" "}
                      <span className="font-medium text-foreground">
                        {student.phone}
                      </span>{" "}
                      to verify your understanding of this lecture.
                    </p>
                    {hasReachedEnd && (
                      <p
                        className="mt-2 flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: "#34d399" }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Video watched to completion — ready to verify.
                      </p>
                    )}
                    {videoId && !hasReachedEnd && !isCurrentCompleted && (
                      <p className="mt-2 text-xs" style={{ color: "#9999aa" }}>
                        Watch the full video before marking complete.
                      </p>
                    )}
                  </div>

                  {/* Real call status from DB */}
                  {currentVoiceCall && submitFeedback !== "queued" && (
                    <CallStatusBanner voiceCall={currentVoiceCall} phone={student.phone} />
                  )}

                  {/* Just-submitted feedback */}
                  {submitFeedback === "queued" && (
                    <div
                      className="rounded-xl border p-3 text-sm"
                      style={{
                        background: "rgba(52,211,153,0.08)",
                        borderColor: "rgba(52,211,153,0.2)",
                        color: "#34d399",
                      }}
                    >
                      <CheckCircle2 className="mb-1 inline h-4 w-4" /> Voice
                      call queued — you will receive a call on {student.phone} shortly.
                    </div>
                  )}
                  {submitFeedback === "error" && (
                    <div
                      className="rounded-xl border p-3 text-sm"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        borderColor: "rgba(239,68,68,0.2)",
                        color: "#f87171",
                      }}
                    >
                      Failed to queue the call. Please try again.
                    </div>
                  )}

                  <Button
                    className="w-full"
                    disabled={isCurrentCompleted || isSubmitting}
                    onClick={handleMarkComplete}
                  >
                    {isCurrentCompleted
                      ? "✓ Completed"
                      : isSubmitting
                        ? "Queuing call…"
                        : "Mark as completed"}
                  </Button>
                </CardContent>
              </Card>

              {/* Call results (comprehension score + weak topics + summary) */}
              {currentVoiceCall?.status === "COMPLETED" && currentVoiceCall.comprehensionScore != null && (
                <Card>
                  <CardHeader className="pb-3">
                    <p
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "#9999aa" }}
                    >
                      Verification results
                    </p>
                    <CardTitle className="text-lg">Your performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Score */}
                    <div className="flex items-center gap-4">
                      <span
                        className="text-4xl font-bold tabular-nums"
                        style={{
                          color:
                            currentVoiceCall.comprehensionScore >= 70
                              ? "#34d399"
                              : currentVoiceCall.comprehensionScore >= 40
                                ? "#c9a84c"
                                : "#e84c2b",
                        }}
                      >
                        {currentVoiceCall.comprehensionScore}%
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">Comprehension score</p>
                        <p className="text-xs text-muted-foreground">
                          {currentVoiceCall.comprehensionScore >= 70
                            ? "Strong understanding"
                            : currentVoiceCall.comprehensionScore >= 40
                              ? "Partial understanding — review suggested"
                              : "Needs revision"}
                        </p>
                      </div>
                    </div>

                    {/* Weak topics */}
                    {currentVoiceCall.weakTopics?.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#9999aa" }}>
                          Topics to revise
                        </p>
                        <ul className="space-y-1.5">
                          {currentVoiceCall.weakTopics.map((topic, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span style={{ color: "#e84c2b", flexShrink: 0 }}>·</span>
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Summary */}
                    {currentVoiceCall.summary && (
                      <div
                        className="rounded-xl p-3 text-xs leading-6 text-muted-foreground"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        {currentVoiceCall.summary}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Transcript (if available) */}
              {selectedLecture.transcription && (
                <Card>
                  <CardHeader className="pb-2">
                    <p
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "#9999aa" }}
                    >
                      Transcript
                    </p>
                    <CardTitle className="text-lg">Audio transcription</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                      {transcriptExpanded
                        ? selectedLecture.transcription
                        : selectedLecture.transcription.slice(0, 300) +
                          (selectedLecture.transcription.length > 300 ? "…" : "")}
                    </p>
                    {selectedLecture.transcription.length > 300 && (
                      <button
                        onClick={() => setTranscriptExpanded((v) => !v)}
                        className="mt-3 text-xs font-semibold transition"
                        style={{ color: "#c9a84c" }}
                      >
                        {transcriptExpanded ? "Show less ↑" : "Read full transcript ↓"}
                      </button>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
