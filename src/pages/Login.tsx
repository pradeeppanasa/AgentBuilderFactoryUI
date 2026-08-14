import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { getCurrentUser, login } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/common";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const tokens = await login(values);
      setTokens(tokens);
      const user = await getCurrentUser();
      setCurrentUser(user);
      return user;
    },
    onSuccess: () => {
      const redirectTo =
        (location.state as { from?: string } | null)?.from ?? "/";
      navigate(redirectTo, { replace: true });
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-teal" />
          <span className="text-sm font-semibold text-navy">
            Panasa Agent Factory
          </span>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        >
          <div>
            <label className="text-sm font-medium text-navy">Email</label>
            <input
              type="email"
              autoComplete="email"
              className={cn(inputClass, "mt-1")}
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-navy">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className={cn(inputClass, "mt-1")}
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {loginMutation.isError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Incorrect email or password.
            </div>
          ) : null}

          <Button
            type="submit"
            variant="accent"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
