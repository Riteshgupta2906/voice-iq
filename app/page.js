import Link from "next/link";
import {
  AudioLines,
  UserRoundPlus,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Phone,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-8">
      {/* Nav */}
      <nav className="mb-20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <AudioLines className="h-5 w-5 text-primary" />
          Voice IQ
        </div>
        <Button asChild size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
      </nav>

      {/* Hero */}
      <section className="mb-16 space-y-6 text-center">
        <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          An LMS that verifies if the student actually learned.
        </h1>
        <p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          Voice IQ does more than stream lectures. When a learner marks
          complete, an AI voice agent calls them, asks topic-aware questions,
          and reports proof of understanding back to the admin.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button asChild variant="outline" size="lg">
            <Link href="/admin">Enter as Admin</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/student">
              Enter as Student
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <hr className="mb-16 border-white/10" />

      {/* Features */}
      <section className="mb-16 grid gap-10 sm:grid-cols-3">
        {[
          {
            icon: UserRoundPlus,
            title: "Register candidates",
            description:
              "Admins add learners and assign them a course path in seconds.",
          },
          {
            icon: BookOpen,
            title: "Watch lectures",
            description:
              "Students work through YouTube lectures at their own pace.",
          },
          {
            icon: Phone,
            title: "Voice verification",
            description:
              "An AI caller confirms comprehension before marking complete.",
          },
        ].map((item) => (
          <div key={item.title} className="space-y-3">
            <item.icon className="h-6 w-6 text-primary" />
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </section>

      {/* Flow */}
      <section className="mb-20">
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              title: "Create course",
              description: "Admin adds lectures and transcripts.",
            },
            {
              title: "Register candidate",
              description: "Learner is assigned the course path.",
            },
            {
              title: "Mark complete",
              description: "Student finishes and triggers verification.",
            },
            {
              title: "Voice agent calls",
              description: "AI asks questions and reports results.",
            },
          ].map((step, index) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center text-center"
            >
              {/* Connector line */}
              {index < 3 && (
                <div className="absolute left-1/2 top-4 h-px w-full border-t border-dashed border-white/20" />
              )}
              <div className="relative z-10 mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {index + 1}
              </div>
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto pb-8 text-center text-xs text-muted-foreground/50">
        Voice IQ
      </footer>
    </main>
  );
}
