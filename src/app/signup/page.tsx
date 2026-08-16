"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { authClient } from "@/server/auth/auth-client";
import { signupStep1Schema } from "@/lib/validation/signup.schema";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // A ref (not state) guards re-entrancy synchronously — two rapid clicks
  // can both fire before a setState-driven `disabled` prop has re-rendered,
  // which was letting a double-click submit the same signup twice (the
  // second attempt then fails with "email already exists").
  const submittingRef = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setFormError(null);

    const parsed = signupStep1Schema.safeParse({ email, password, confirmPassword });
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      setErrors({
        email: flat.fieldErrors.email?.[0] ?? "",
        password: flat.fieldErrors.password?.[0] ?? "",
        confirmPassword: flat.fieldErrors.confirmPassword?.[0] ?? "",
      });
      return;
    }
    setErrors({});
    submittingRef.current = true;
    setSubmitting(true);

    const { error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
    });

    if (error) {
      submittingRef.current = false;
      setSubmitting(false);
      setFormError(error.message ?? "Could not create your account. Please try again.");
      return;
    }
    router.push("/signup/profile");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Step 1 of 2 — let&apos;s get you signed up.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <FieldError>{errors.email}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <FieldError>{errors.password}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <FieldError>{errors.confirmPassword}</FieldError>
            </div>
            <FieldError>{formError}</FieldError>
            <Button type="submit" size="lg" disabled={submitting} className="mt-2">
              {submitting ? "Creating account..." : "Continue →"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-primary-600 underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
