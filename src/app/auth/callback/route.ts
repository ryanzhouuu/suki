import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublishableKey } from "@/lib/supabase/env-keys";
import type { Database } from "@/types/database";

function loginRedirect(origin: string, error: string, description?: string | null) {
  const params = new URLSearchParams({ error });
  if (description) {
    params.set("error_description", description);
  }
  return NextResponse.redirect(`${origin}/auth/login?${params.toString()}`);
}

function redirectWithCookies(
  origin: string,
  path: string,
  source: NextResponse,
) {
  const response = NextResponse.redirect(`${origin}${path}`);
  source.cookies.getAll().forEach(({ name, value }) => {
    response.cookies.set(name, value);
  });
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  if (oauthError) {
    const description = oauthErrorDescription?.toLowerCase() ?? "";
    if (description.includes("invalid_client")) {
      return loginRedirect(origin, "google_secret", oauthErrorDescription);
    }
    return loginRedirect(origin, "auth", oauthErrorDescription);
  }

  if (code) {
    let sessionResponse = NextResponse.redirect(`${origin}/home`);

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      getSupabasePublishableKey(),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            sessionResponse = NextResponse.redirect(`${origin}/home`);
            cookiesToSet.forEach(({ name, value, options }) => {
              sessionResponse.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const destination = profile ? "/home" : "/onboarding";
        return redirectWithCookies(origin, destination, sessionResponse);
      }
    }

    const description = error?.message.toLowerCase() ?? "";
    if (description.includes("code verifier")) {
      return loginRedirect(origin, "pkce", error?.message);
    }
    return loginRedirect(origin, "auth", error?.message);
  }

  return loginRedirect(origin, "auth");
}
