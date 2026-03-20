"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Plus } from "lucide-react";

import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const initialCandidateForm = {
  name: "",
  email: "",
  phone: "",
  cohort: "",
  courseId: "",
};

const initialCourseForm = { name: "", description: "" };
const initialLectureForm = {
  courseId: "",
  title: "",
  youtubeUrl: "",
  transcription: "",
};

const selectStyle = {
  width: "100%",
  background: "hsl(var(--input))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "calc(var(--radius) - 4px)",
  color: "hsl(var(--foreground))",
  padding: "0.5rem 0.75rem",
  fontSize: "0.875rem",
  outline: "none",
  height: "2.5rem",
};

export function CandidateForm() {
  const { courses, candidates, loading, addCourse, addLectureToCourse, addCandidate } =
    useAppData();

  const [candidateForm, setCandidateForm] = useState(initialCandidateForm);
  const [lastCreatedCandidate, setLastCreatedCandidate] = useState(null);
  const [candidateError, setCandidateError] = useState(null);
  const [candidateSubmitting, setCandidateSubmitting] = useState(false);

  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [lastCreatedCourse, setLastCreatedCourse] = useState(null);
  const [courseError, setCourseError] = useState(null);
  const [courseSubmitting, setCourseSubmitting] = useState(false);

  const [lectureForm, setLectureForm] = useState(initialLectureForm);
  const [lastAddedLecture, setLastAddedLecture] = useState(null);
  const [lectureError, setLectureError] = useState(null);
  const [lectureSubmitting, setLectureSubmitting] = useState(false);

  const [expandedCourses, setExpandedCourses] = useState(new Set());

  function toggleCourse(id) {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleCandidateSubmit(e) {
    e.preventDefault();
    setCandidateError(null);
    setCandidateSubmitting(true);
    try {
      const candidate = await addCandidate(candidateForm);
      setLastCreatedCandidate(candidate);
      setCandidateForm(initialCandidateForm);
    } catch (err) {
      setCandidateError(err.message);
    } finally {
      setCandidateSubmitting(false);
    }
  }

  async function handleCourseSubmit(e) {
    e.preventDefault();
    setCourseError(null);
    setCourseSubmitting(true);
    try {
      const course = await addCourse(courseForm);
      setLastCreatedCourse(course);
      setCourseForm(initialCourseForm);
    } catch (err) {
      setCourseError(err.message);
    } finally {
      setCourseSubmitting(false);
    }
  }

  async function handleLectureSubmit(e) {
    e.preventDefault();
    setLectureError(null);
    setLectureSubmitting(true);
    try {
      const lecture = await addLectureToCourse(lectureForm.courseId, {
        title: lectureForm.title,
        youtubeUrl: lectureForm.youtubeUrl,
        transcription: lectureForm.transcription,
      });
      setLastAddedLecture(lecture);
      setLectureForm(initialLectureForm);
    } catch (err) {
      setLectureError(err.message);
    } finally {
      setLectureSubmitting(false);
    }
  }

  return (
    <Tabs defaultValue="management" className="space-y-6">
      <TabsList>
        <TabsTrigger value="management">Management</TabsTrigger>
        <TabsTrigger value="courses">Courses</TabsTrigger>
        <TabsTrigger value="candidates">Candidates</TabsTrigger>
      </TabsList>

      {/* ── Management tab ── */}
      <TabsContent value="management" className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Column 1: Candidate Registration */}
        <Card>
          <CardHeader>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#e84c2b" }}
            >
              New learner
            </p>
            <CardTitle className="text-2xl">Register a candidate</CardTitle>
            <p className="text-sm" style={{ color: "#9999aa" }}>
              The candidate will be auto-assigned to every lecture in the
              selected course.
            </p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleCandidateSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-muted-foreground">
                  Full name
                  <Input
                    required
                    name="name"
                    placeholder="Rohan Mehta"
                    value={candidateForm.name}
                    onChange={(e) =>
                      setCandidateForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm text-muted-foreground">
                  Email
                  <Input
                    required
                    name="email"
                    type="email"
                    placeholder="rohan@voiceiq.ai"
                    value={candidateForm.email}
                    onChange={(e) =>
                      setCandidateForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-muted-foreground">
                  Phone number
                  <Input
                    required
                    name="phone"
                    placeholder="+1 (415) 555-0149"
                    value={candidateForm.phone}
                    onChange={(e) =>
                      setCandidateForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm text-muted-foreground">
                  Cohort
                  <Input
                    required
                    name="cohort"
                    placeholder="Customer Operations POC"
                    value={candidateForm.cohort}
                    onChange={(e) =>
                      setCandidateForm((f) => ({
                        ...f,
                        cohort: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm text-muted-foreground">
                Assign to course
                <select
                  required
                  value={candidateForm.courseId}
                  onChange={(e) =>
                    setCandidateForm((f) => ({
                      ...f,
                      courseId: e.target.value,
                    }))
                  }
                  style={selectStyle}
                >
                  <option value="" disabled>
                    Select a course…
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.lectures?.length ?? 0} lectures)
                    </option>
                  ))}
                </select>
                {!loading && courses.length === 0 && (
                  <p className="mt-1 text-xs" style={{ color: "#e84c2b" }}>
                    Create a course first before registering a candidate.
                  </p>
                )}
              </label>

              {candidateError && (
                <p className="text-xs" style={{ color: "#e84c2b" }}>
                  {candidateError}
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={courses.length === 0 || candidateSubmitting}
                >
                  <Plus className="h-4 w-4" />
                  {candidateSubmitting ? "Registering…" : "Register candidate"}
                </Button>
              </div>
            </form>

            {lastCreatedCandidate && (
              <div
                className="mt-6 rounded-[20px] p-4 text-sm"
                style={{
                  background: "rgba(232,76,43,0.1)",
                  border: "1px solid rgba(232,76,43,0.25)",
                  color: "#f5c6bb",
                }}
              >
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <CheckCircle2
                    className="h-4 w-4"
                    style={{ color: "#e84c2b" }}
                  />
                  Candidate registered
                </div>
                {lastCreatedCandidate.name} has been assigned to their course
                and will be verified by AI voice calls on lecture completion.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column 2: Course + Lecture forms stacked */}
        <div className="grid gap-6 content-start">
          {/* Create Course */}
          <Card>
            <CardHeader>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#c9a84c" }}
              >
                Content management
              </p>
              <CardTitle className="text-2xl">Create a course</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleCourseSubmit}>
                <label className="space-y-2 text-sm text-muted-foreground">
                  Course name
                  <Input
                    required
                    placeholder="AI Foundations"
                    value={courseForm.name}
                    onChange={(e) =>
                      setCourseForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm text-muted-foreground">
                  Description
                  <Textarea
                    placeholder="Short description of this course's goals."
                    value={courseForm.description}
                    onChange={(e) =>
                      setCourseForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                </label>

                {courseError && (
                  <p className="text-xs" style={{ color: "#e84c2b" }}>
                    {courseError}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={courseSubmitting}
                  >
                    <Plus className="h-4 w-4" />
                    {courseSubmitting ? "Creating…" : "Create course"}
                  </Button>
                </div>
              </form>

              {lastCreatedCourse && (
                <div
                  className="mt-4 rounded-[20px] p-3 text-sm"
                  style={{
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    color: "#e8d5a3",
                  }}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2
                      className="h-4 w-4"
                      style={{ color: "#c9a84c" }}
                    />
                    &ldquo;{lastCreatedCourse.name}&rdquo; created — now add
                    lectures to it.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Lecture */}
          <Card>
            <CardHeader>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#c9a84c" }}
              >
                Lecture library
              </p>
              <CardTitle className="text-2xl">Add a lecture</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleLectureSubmit}>
                <label className="space-y-2 text-sm text-muted-foreground">
                  Course
                  <select
                    required
                    value={lectureForm.courseId}
                    onChange={(e) =>
                      setLectureForm((f) => ({
                        ...f,
                        courseId: e.target.value,
                      }))
                    }
                    style={selectStyle}
                  >
                    <option value="" disabled>
                      Select a course…
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-muted-foreground">
                  Topic / lecture title
                  <Input
                    required
                    placeholder="Prompt Design Fundamentals"
                    value={lectureForm.title}
                    onChange={(e) =>
                      setLectureForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm text-muted-foreground">
                  YouTube URL
                  <Input
                    required
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={lectureForm.youtubeUrl}
                    onChange={(e) =>
                      setLectureForm((f) => ({
                        ...f,
                        youtubeUrl: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm text-muted-foreground">
                  Audio transcription
                  <Textarea
                    placeholder="Paste the full transcript of this lecture's audio here…"
                    rows={5}
                    value={lectureForm.transcription}
                    onChange={(e) =>
                      setLectureForm((f) => ({
                        ...f,
                        transcription: e.target.value,
                      }))
                    }
                  />
                </label>

                {lectureError && (
                  <p className="text-xs" style={{ color: "#e84c2b" }}>
                    {lectureError}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={courses.length === 0 || lectureSubmitting}
                  >
                    <Plus className="h-4 w-4" />
                    {lectureSubmitting ? "Adding…" : "Add lecture"}
                  </Button>
                </div>
              </form>

              {lastAddedLecture && (
                <div
                  className="mt-4 rounded-[20px] p-3 text-sm"
                  style={{
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    color: "#e8d5a3",
                  }}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2
                      className="h-4 w-4"
                      style={{ color: "#c9a84c" }}
                    />
                    &ldquo;{lastAddedLecture.title}&rdquo; added successfully.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      </TabsContent>

      {/* ── Courses tab ── */}
      <TabsContent value="courses">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#c9a84c" }}
            >
              Content library
            </p>
            <h2 className="text-2xl font-bold">Courses & Lectures</h2>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c" }}
          >
            {courses.length} {courses.length === 1 ? "course" : "courses"}
          </span>
        </div>

        {loading ? (
          <div
            className="rounded-2xl border p-10 text-center text-sm"
            style={{ borderColor: "hsl(var(--border))", color: "#9999aa" }}
          >
            Loading courses…
          </div>
        ) : courses.length === 0 ? (
          <div
            className="rounded-2xl border p-10 text-center text-sm"
            style={{ borderColor: "hsl(var(--border))", color: "#9999aa" }}
          >
            No courses yet. Create your first course above.
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            {courses.map((course, idx) => {
              const isExpanded = expandedCourses.has(course.id);
              const lectureCount = course.lectures?.length ?? 0;
              return (
                <div key={course.id}>
                  {/* Course row */}
                  <button
                    type="button"
                    onClick={() => toggleCourse(course.id)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/5"
                    style={{
                      background:
                        idx % 2 === 0
                          ? "hsl(var(--card))"
                          : "hsl(240 8% 6%)",
                      borderTop:
                        idx === 0 ? "none" : "1px solid hsl(var(--border))",
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: "#c9a84c" }}
                      />
                    ) : (
                      <ChevronRight
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: "#9999aa" }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-foreground">
                        {course.name}
                      </span>
                      {course.description && (
                        <span
                          className="ml-3 text-sm"
                          style={{ color: "#9999aa" }}
                        >
                          {course.description}
                        </span>
                      )}
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0"
                      style={{
                        background: "rgba(201,168,76,0.12)",
                        color: "#c9a84c",
                      }}
                    >
                      {lectureCount}{" "}
                      {lectureCount === 1 ? "lecture" : "lectures"}
                    </span>
                  </button>

                  {/* Lectures sub-rows */}
                  {isExpanded && (
                    <div
                      style={{
                        background: "hsl(240 8% 8%)",
                        borderTop: "1px solid hsl(var(--border))",
                        borderBottom: "1px solid hsl(var(--border))",
                      }}
                    >
                      {lectureCount === 0 ? (
                        <p
                          className="px-10 py-3 text-sm"
                          style={{ color: "#9999aa" }}
                        >
                          No lectures yet — add one above.
                        </p>
                      ) : (
                        (course.lectures || []).map((lecture, lIdx) => (
                          <div
                            key={lecture.id}
                            className="flex items-center gap-4 px-10 py-3 text-sm"
                            style={{
                              borderTop:
                                lIdx === 0
                                  ? "none"
                                  : "1px solid hsl(var(--border))",
                            }}
                          >
                            <span
                              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                              style={{
                                background: "rgba(201,168,76,0.15)",
                                color: "#c9a84c",
                              }}
                            >
                              {lIdx + 1}
                            </span>
                            <span className="flex-1 font-medium text-foreground">
                              {lecture.title}
                            </span>
                            {lecture.youtubeUrl && (
                              <a
                                href={lecture.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline"
                                style={{ color: "#9999aa" }}
                              >
                                YouTube ↗
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      </TabsContent>

      {/* ── Candidates tab ── */}
      <TabsContent value="candidates">
        <CandidatesTable candidates={candidates} loading={loading} />
      </TabsContent>

    </Tabs>
  );
}

// ── Call status badge ────────────────────────────────────────────────────────

const CALL_STATUS_STYLES = {
  QUEUED:           { bg: "rgba(153,153,170,0.15)", color: "#9999aa", label: "Queued" },
  RESCHEDULED:      { bg: "rgba(201,168,76,0.15)",  color: "#c9a84c", label: "Rescheduled" },
  INITIATED:        { bg: "rgba(201,168,76,0.15)",  color: "#c9a84c", label: "Initiated" },
  RINGING:          { bg: "rgba(201,168,76,0.15)",  color: "#c9a84c", label: "Ringing" },
  IN_PROGRESS:      { bg: "rgba(201,168,76,0.15)",  color: "#c9a84c", label: "In progress" },
  CALL_DISCONNECTED:{ bg: "rgba(232,76,43,0.15)",   color: "#e84c2b", label: "Disconnected" },
  COMPLETED:        { bg: "rgba(34,197,94,0.15)",   color: "#22c55e", label: "Completed" },
};


function CallStatusBadge({ status }) {
  if (!status) return <span style={{ color: "#9999aa" }}>No call</span>;
  const s = CALL_STATUS_STYLES[status] ?? { bg: "rgba(153,153,170,0.15)", color: "#9999aa", label: status };
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ── Candidates table with hierarchical lecture rows ─────────────────────────

function CandidatesTable({ candidates, loading }) {
  const [synced, setSynced] = useState({});
  // Set of voiceCall IDs whose transcript panel is open
  const [expandedTranscripts, setExpandedTranscripts] = useState(new Set());
  // Set of candidate IDs whose lecture rows are visible (start all expanded)
  const [expandedCandidates, setExpandedCandidates] = useState(new Set());

  // Auto-expand all candidates (including newly registered ones)
  useEffect(() => {
    if (candidates.length > 0) {
      setExpandedCandidates((prev) => {
        const next = new Set(prev);
        candidates.forEach((c) => next.add(c.id));
        return next;
      });
    }
  }, [candidates]);

  function toggleCandidate(id) {
    setExpandedCandidates((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTranscript(vcId) {
    setExpandedTranscripts((prev) => {
      const next = new Set(prev);
      next.has(vcId) ? next.delete(vcId) : next.add(vcId);
      return next;
    });
  }

  useEffect(() => {
    candidates.forEach((c) => {
      c.lectures.forEach((l) => {
        const vc = synced[l.progress?.voiceCall?.id] ?? l.progress?.voiceCall;
        if (!vc?.callSessionId) return;
        const fullysynced = vc.status === "COMPLETED" && vc.transcript && vc.recording;
        if (fullysynced) return;
        fetch(`/api/voice-calls/${vc.id}/sync`, { method: "POST" })
          .then((r) => r.ok ? r.json() : null)
          .then((updated) => {
            if (updated) setSynced((prev) => ({ ...prev, [vc.id]: updated }));
          })
          .catch(() => {});
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#e84c2b" }}
          >
            Live roster
          </p>
          <h2 className="text-2xl font-bold">Candidates</h2>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: "rgba(232,76,43,0.15)", color: "#e84c2b" }}
        >
          {candidates.length} registered
        </span>
      </div>

      {loading ? (
        <div
          className="rounded-2xl border p-10 text-center text-sm"
          style={{ borderColor: "hsl(var(--border))", color: "#9999aa" }}
        >
          Loading candidates…
        </div>
      ) : candidates.length === 0 ? (
        <div
          className="rounded-2xl border p-10 text-center text-sm"
          style={{ borderColor: "hsl(var(--border))", color: "#9999aa" }}
        >
          No candidates yet. Register your first candidate above.
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-2xl border"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "hsl(240 8% 10%)" }}>
                {/* indent col */ }
                <th className="w-10" />
                {["Lecture", "Progress", "Score", "Call Status", "Recording"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#9999aa" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate, cidx) => {
                const isExpanded = expandedCandidates.has(candidate.id);
                const lectureCount = (candidate.lectures ?? []).length;
                return (
                <React.Fragment key={candidate.id}>
                  {/* ── Candidate header row ── */}
                  <tr
                    style={{
                      background: cidx % 2 === 0 ? "hsl(240 8% 9%)" : "hsl(240 8% 7%)",
                      borderTop: cidx === 0 ? "none" : "2px solid hsl(var(--border))",
                      cursor: lectureCount > 0 ? "pointer" : "default",
                    }}
                    onClick={() => lectureCount > 0 && toggleCandidate(candidate.id)}
                  >
                    <td className="w-10 pl-3">
                      {lectureCount > 0 && (
                        isExpanded
                          ? <ChevronDown className="h-4 w-4" style={{ color: "#9999aa" }} />
                          : <ChevronRight className="h-4 w-4" style={{ color: "#9999aa" }} />
                      )}
                    </td>
                    <td colSpan={5} className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="font-bold text-foreground">{candidate.name}</span>
                        <span style={{ color: "#9999aa" }}>{candidate.email}</span>
                        {candidate.cohort && (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ background: "rgba(232,76,43,0.12)", color: "#e84c2b" }}
                          >
                            {candidate.cohort}
                          </span>
                        )}
                        {candidate.courseName && (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c" }}
                          >
                            {candidate.courseName}
                          </span>
                        )}
                        {lectureCount === 0 && (
                          <span className="text-xs" style={{ color: "#9999aa" }}>No lectures assigned</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* ── Lecture child rows (collapsible) ── */}
                  {isExpanded && (candidate.lectures ?? []).map((lecture, lidx) => {
                    const vc = synced[lecture.progress?.voiceCall?.id] ?? lecture.progress?.voiceCall ?? null;
                    const lp = lecture.progress;
                    return (
                      <React.Fragment key={lecture.id}>
                      <tr
                        style={{
                          background: cidx % 2 === 0 ? "hsl(var(--card))" : "hsl(240 8% 6%)",
                          borderTop: "1px solid hsl(var(--border))",
                        }}
                      >
                        {/* Visual indent connector */}
                        <td className="w-10 py-3 pl-5 pr-0">
                          <div className="flex h-full items-center justify-center">
                            <span style={{ color: "rgba(255,255,255,0.12)", fontSize: "18px", lineHeight: 1 }}>
                              {lidx === (candidate.lectures ?? []).length - 1 ? "└" : "├"}
                            </span>
                          </div>
                        </td>

                        {/* Lecture title */}
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2">
                            <span
                              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                              style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c" }}
                            >
                              {lecture.order + 1}
                            </span>
                            <span className="text-foreground">{lecture.title}</span>
                          </span>
                        </td>

                        {/* Progress status */}
                        <td className="px-4 py-3">
                          {lp ? (
                            <span
                              className="rounded-full px-3 py-1 text-xs font-semibold"
                              style={
                                lp.status === "COMPLETED"
                                  ? { background: "rgba(34,197,94,0.15)", color: "#22c55e" }
                                  : { background: "rgba(96,165,250,0.15)", color: "#60a5fa" }
                              }
                            >
                              {lp.status === "COMPLETED" ? "Completed" : "Started"}
                            </span>
                          ) : (
                            <span style={{ color: "#9999aa" }}>—</span>
                          )}
                        </td>

                        {/* Comprehension score + weak topics */}
                        <td className="px-4 py-3">
                          {vc?.comprehensionScore != null ? (
                            <div className="space-y-1.5">
                              <span
                                className="rounded-full px-3 py-1 text-xs font-bold"
                                style={
                                  vc.comprehensionScore >= 70
                                    ? { background: "rgba(34,197,94,0.15)", color: "#22c55e" }
                                    : vc.comprehensionScore >= 40
                                      ? { background: "rgba(201,168,76,0.15)", color: "#c9a84c" }
                                      : { background: "rgba(232,76,43,0.15)", color: "#e84c2b" }
                                }
                              >
                                {vc.comprehensionScore}%
                              </span>
                              {vc.weakTopics?.length > 0 && (
                                <div className="space-y-0.5">
                                  {vc.weakTopics.map((t, i) => (
                                    <p key={i} className="text-xs" style={{ color: "#9999aa" }}>
                                      · {t}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#9999aa" }}>—</span>
                          )}
                        </td>

                        {/* Call status */}
                        <td className="px-4 py-3">
                          <CallStatusBadge status={vc?.status ?? null} />
                        </td>

                        {/* Recording + transcript button */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            {vc?.recording ? (
                              <a
                                href={vc.recording}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline"
                                style={{ color: "#c9a84c" }}
                              >
                                Listen ↗
                              </a>
                            ) : (
                              <span style={{ color: "#9999aa" }}>—</span>
                            )}
                            {vc?.transcript && (
                              <button
                                type="button"
                                onClick={() => toggleTranscript(vc.id)}
                                className="text-xs underline text-left"
                                style={{ color: "#60a5fa" }}
                              >
                                {expandedTranscripts.has(vc.id) ? "Hide transcript ↑" : "View transcript ↓"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable transcript row */}
                      {vc?.transcript && expandedTranscripts.has(vc.id) && (
                        <tr
                          key={`transcript-${lecture.id}`}
                          style={{
                            background: cidx % 2 === 0 ? "hsl(240 8% 5%)" : "hsl(240 8% 4%)",
                            borderTop: "1px solid hsl(var(--border))",
                          }}
                        >
                          <td />
                          <td colSpan={5} className="px-4 pb-4 pt-3">
                            <div className="space-y-3">
                              {vc.summary && (
                                <div>
                                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "#9999aa" }}>Summary</p>
                                  <p className="text-xs leading-6 text-muted-foreground">{vc.summary}</p>
                                </div>
                              )}
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "#9999aa" }}>Transcript</p>
                                <pre
                                  className="whitespace-pre-wrap text-xs leading-6 text-muted-foreground"
                                  style={{ fontFamily: "inherit", maxHeight: "280px", overflowY: "auto" }}
                                >
                                  {vc.transcript}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
