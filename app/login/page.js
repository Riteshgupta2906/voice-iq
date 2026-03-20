import Link from "next/link";
import { ArrowRight, Shield, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Choose your portal
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Sign in as an admin to manage candidates and courses, or as a candidate
          to access your learning path.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <CardTitle className="pt-4 text-3xl">Admin</CardTitle>
            <CardDescription>
              Register candidates, assign courses, and review voice verification
              results across your roster.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin">
                Open admin portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-primary">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <CardTitle className="pt-4 text-3xl">Candidate</CardTitle>
            <CardDescription>
              Access your assigned course, watch lectures, and complete voice
              verification when you finish each one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/student">
                Open candidate portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
