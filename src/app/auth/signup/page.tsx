import { redirect } from "next/navigation";

type SignupPageProps = {
  searchParams: Promise<{ error?: string; error_description?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, error_description: errorDescription } = await searchParams;
  const params = new URLSearchParams({ mode: "signup" });
  if (error) params.set("error", error);
  if (errorDescription) params.set("error_description", errorDescription);
  redirect(`/auth/login?${params.toString()}`);
}
