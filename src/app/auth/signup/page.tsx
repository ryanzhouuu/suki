import { redirect } from "next/navigation";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams;
  const params = new URLSearchParams({ mode: "signup" });
  if (error) params.set("error", error);
  redirect(`/auth/login?${params.toString()}`);
}
