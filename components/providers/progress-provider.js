"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "voice-iq-progress";

const defaultState = {
  completedLectureIds: [],
  verificationStatus: {}
};

const ProgressContext = createContext(null);

function loadState() {
  if (typeof window === "undefined") {
    return defaultState;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return defaultState;
  }

  try {
    return {
      ...defaultState,
      ...JSON.parse(storedValue)
    };
  } catch {
    return defaultState;
  }
}

export function ProgressProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const timersRef = useRef({});

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return undefined;
  }, [state]);

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      Object.values(timers).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  const value = useMemo(
    () => ({
      completedLectureIds: state.completedLectureIds,
      verificationStatus: state.verificationStatus,
      markLectureCompleted(lectureId) {
        if (timersRef.current[lectureId]) {
          window.clearTimeout(timersRef.current[lectureId]);
        }

        if (timersRef.current[`${lectureId}-progress`]) {
          window.clearTimeout(timersRef.current[`${lectureId}-progress`]);
        }

        setState((currentState) => {
          const completedLectureIds = currentState.completedLectureIds.includes(lectureId)
            ? currentState.completedLectureIds
            : [...currentState.completedLectureIds, lectureId];

          return {
            ...currentState,
            completedLectureIds,
            verificationStatus: {
              ...currentState.verificationStatus,
              [lectureId]: "agent-dispatched"
            }
          };
        });

        timersRef.current[`${lectureId}-progress`] = window.setTimeout(() => {
          setState((currentState) => ({
            ...currentState,
            verificationStatus: {
              ...currentState.verificationStatus,
              [lectureId]: "in-call"
            }
          }));
        }, 1200);

        timersRef.current[lectureId] = window.setTimeout(() => {
          setState((currentState) => ({
            ...currentState,
            verificationStatus: {
              ...currentState.verificationStatus,
              [lectureId]: "verified"
            }
          }));
        }, 3200);
      },
      getLectureStatus(lectureId) {
        if (state.verificationStatus[lectureId]) {
          return state.verificationStatus[lectureId];
        }

        if (state.completedLectureIds.includes(lectureId)) {
          return "completed";
        }

        return "not-started";
      }
    }),
    [state]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error("useProgress must be used inside ProgressProvider.");
  }

  return context;
}
