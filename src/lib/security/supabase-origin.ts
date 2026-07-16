export type SupabaseOrigin = {
  protocol: "http" | "https";
  hostname: string;
  port: string;
};

export function parseSupabaseOrigin(value: string): SupabaseOrigin {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Supabase URL must use http or https.");
  }

  return {
    protocol: url.protocol.slice(0, -1) as SupabaseOrigin["protocol"],
    hostname: url.hostname,
    port: url.port,
  };
}

export function formatSupabaseOrigin(origin: SupabaseOrigin): string {
  return `${origin.protocol}://${origin.hostname}${origin.port ? `:${origin.port}` : ""}`;
}
