"use client";

import { CheckCircle2, Mic, PhoneCall, Radio, Sparkles } from "lucide-react";

import { useProgress } from "@/components/providers/progress-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    key: "completed",
    label: "Completion saved",
    icon: CheckCircle2
  },
  {
    key: "agent-dispatched",
    label: "Agent dispatched",
    icon: PhoneCall
  },
  {
    key: "in-call",
    label: "Voice call live",
    icon: Radio
  },
  {
    key: "verified",
    label: "Understanding verified",
    icon: Sparkles
  }
];

const order = {
  "not-started": 0,
  completed: 1,
  "agent-dispatched": 2,
  "in-call": 3,
  verified: 4
};

export function CompleteLecturePanel({ lecture }) {
  const { getLectureStatus, markLectureCompleted } = useProgress();
  const status = getLectureStatus(lecture.id);
  const statusOrder = order[status] || 0;
  const isDispatching = status === "agent-dispatched" || status === "in-call";
  const isVerified = status === "verified";

  return (
    <Card className="sticky top-6">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant={isVerified ? "success" : "default"}>
              {isVerified ? "Voice verified" : "Voice verification"}
            </Badge>
            <h3 className="text-2xl font-semibold">
              Mark complete, then dispatch the AI call
            </h3>
            <p className="text-sm leading-7 text-muted-foreground">
              The candidate will receive a phone call that asks the topic-specific
              questions shown below.
            </p>
          </div>
          <Mic className="h-8 w-8 text-primary" />
        </div>

        <Button
          className="w-full"
          disabled={isDispatching}
          onClick={() => markLectureCompleted(lecture.id)}
        >
          {isVerified
            ? "Verification complete"
            : isDispatching
              ? "Voice agent is calling..."
              : "Mark as completed"}
        </Button>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const active = statusOrder >= index + 1;

            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 rounded-3xl border p-4 transition ${
                  active
                    ? "border-primary/30 bg-primary/10"
                    : "border-white/10 bg-slate-950/45"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    active ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {index === 0 && "The lecture is stored as completed for this learner."}
                    {index === 1 &&
                      "A voice agent receives the phone number and lecture rubric."}
                    {index === 2 &&
                      "The learner answers the questions verbally in their own words."}
                    {index === 3 &&
                      "The admin portal will show this lecture as verified."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[26px] border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-100">
          The current flow is mocked for the POC UI. The next backend step is to
          wire this button to a server action or API route that triggers your actual
          voice agent.
        </div>
      </CardContent>
    </Card>
  );
}
