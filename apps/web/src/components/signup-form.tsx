import { Button } from "@suwa/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@suwa/ui/components/field";
import { Input } from "@suwa/ui/components/input";
import { cn } from "@suwa/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { env } from "@suwa/env/web";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

type SignupFormProps = ComponentProps<"div"> & {
  onSwitchToSignIn: () => void;
};

export default function SignUpForm({
  className,
  onSwitchToSignIn,
  ...props
}: SignupFormProps) {
  const navigate = useNavigate({
    from: "/",
  });
  const [googleLoading, setGoogleLoading] = useState(false);
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: async () => {
            await authClient.getSession();
            navigate({
              to: "/onboarding",
            });
            toast.success("Sign up successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z
        .object({
          name: z.string().min(2, "Name must be at least 2 characters"),
          email: z.email("Invalid email address"),
          password: z.string().min(8, "Password must be at least 8 characters"),
          confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
        })
        .refine((value) => value.password === value.confirmPassword, {
          message: "Passwords must match",
          path: ["confirmPassword"],
        }),
    },
  });

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: env.VITE_WEB_URL,
    });

    if (error) {
      toast.error(error.message || error.statusText);
      setGoogleLoading(false);
    }
  };

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className={cn("flex flex-col gap-6 p-6", className)} {...props}>
      <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Enter your email below to create your account
                </p>
              </div>
              <Field>
                <form.Field name="name">
                  {(field) => (
                    <>
                      <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                      {field.state.meta.errors.map((error) => (
                        <FieldDescription key={error?.message} className="text-destructive">
                          {error?.message}
                        </FieldDescription>
                      ))}
                    </>
                  )}
                </form.Field>
              </Field>
              <Field>
                <form.Field name="email">
                  {(field) => (
                    <>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        placeholder="m@example.com"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                      {field.state.meta.errors.map((error) => (
                        <FieldDescription key={error?.message} className="text-destructive">
                          {error?.message}
                        </FieldDescription>
                      ))}
                    </>
                  )}
                </form.Field>
                <FieldDescription>
                  We&apos;ll use this to contact you. We will not share your email with anyone else.
                </FieldDescription>
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <form.Field name="password">
                      {(field) => (
                        <>
                          <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="password"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                          />
                          {field.state.meta.errors.map((error) => (
                            <FieldDescription key={error?.message} className="text-destructive">
                              {error?.message}
                            </FieldDescription>
                          ))}
                        </>
                      )}
                    </form.Field>
                  </Field>
                  <Field>
                    <form.Field name="confirmPassword">
                      {(field) => (
                        <>
                          <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="password"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                          />
                          {field.state.meta.errors.map((error) => (
                            <FieldDescription key={error?.message} className="text-destructive">
                              {error?.message}
                            </FieldDescription>
                          ))}
                        </>
                      )}
                    </form.Field>
                  </Field>
                </Field>
                <FieldDescription>Must be at least 8 characters long.</FieldDescription>
              </Field>
              <Field>
                <form.Subscribe
                  selector={(state) => ({
                    canSubmit: state.canSubmit,
                    isSubmitting: state.isSubmitting,
                  })}
                >
                  {({ canSubmit, isSubmitting }) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? "Creating account..." : "Create Account"}
                    </Button>
                  )}
                </form.Subscribe>
              </Field>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <Field>
                <Button className="w-full" disabled={googleLoading} onClick={handleGoogleSignIn} variant="outline">
                  <GoogleIcon />
                  {googleLoading ? "Redirecting..." : "Continue with Google"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Already have an account?{" "}
                <button className="underline underline-offset-4" type="button" onClick={onSwitchToSignIn}>
                  Sign in
                </button>
              </FieldDescription>
            </FieldGroup>
          </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
