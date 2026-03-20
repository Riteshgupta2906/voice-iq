"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [courses, setCourses] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data from DB
  useEffect(() => {
    async function fetchAll() {
      try {
        const [coursesRes, candidatesRes] = await Promise.all([
          fetch("/api/courses"),
          fetch("/api/candidates"),
        ]);
        if (coursesRes.ok) setCourses(await coursesRes.json());
        if (candidatesRes.ok) setCandidates(await candidatesRes.json());
      } catch (err) {
        console.error("[AppDataProvider] fetch error", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const addCourse = useCallback(async ({ name, description }) => {
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to create course.");
    }
    const course = await res.json();
    // API returns course without lectures array; add empty array for local state
    const courseWithLectures = { ...course, lectures: [] };
    setCourses((prev) => [...prev, courseWithLectures]);
    return courseWithLectures;
  }, []);

  const addLectureToCourse = useCallback(async (courseId, { title, youtubeUrl, transcription }) => {
    const res = await fetch(`/api/courses/${courseId}/lectures`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, youtubeUrl, transcription }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to add lecture.");
    }
    const lecture = await res.json();
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, lectures: [...(c.lectures || []), lecture] }
          : c,
      ),
    );
    return lecture;
  }, []);

  const addCandidate = useCallback(async ({ name, email, phone, cohort, courseId }) => {
    const res = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, cohort, courseId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to register candidate.");
    }
    const candidate = await res.json();
    setCandidates((prev) => [candidate, ...prev]);
    return candidate;
  }, []);

  const value = useMemo(
    () => ({
      courses,
      candidates,
      loading,
      addCourse,
      addLectureToCourse,
      addCandidate,

      getLecturesForCandidate(candidateId) {
        const candidate = candidates.find((c) => c.id === candidateId);
        if (!candidate) return [];
        const course = courses.find((c) => c.id === candidate.courseId);
        return course?.lectures || [];
      },

      getCourseForCandidate(candidateId) {
        const candidate = candidates.find((c) => c.id === candidateId);
        if (!candidate) return null;
        return courses.find((c) => c.id === candidate.courseId) || null;
      },

      getLectureBySlug(slug) {
        for (const course of courses) {
          const lecture = (course.lectures || []).find((l) => l.slug === slug);
          if (lecture) return { ...lecture, courseName: course.name };
        }
        return null;
      },
    }),
    [courses, candidates, loading, addCourse, addLectureToCourse, addCandidate],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
