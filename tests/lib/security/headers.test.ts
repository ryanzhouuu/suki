import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { buildSecurityHeaders } from "@/lib/security/headers";
import type { SupabaseOrigin } from "@/lib/security/supabase-origin";

const hostedSupabaseOrigin: SupabaseOrigin = {
  protocol: "https",
  hostname: "abcdefgh.supabase.co",
  port: "",
};

const localSupabaseOrigin: SupabaseOrigin = {
  protocol: "http",
  hostname: "127.0.0.1",
  port: "54321",
};

function getHeader(
  headers: Array<{ key: string; value: string }>,
  key: string,
): string | undefined {
  return headers.find((h) => h.key === key)?.value;
}

describe("buildSecurityHeaders", () => {
  it("includes frame-ancestors 'none' and object-src 'none' in the CSP", () => {
    const headers = buildSecurityHeaders({
      isDev: false,
      supabaseOrigin: hostedSupabaseOrigin,
    });
    const csp = getHeader(headers, "Content-Security-Policy");
    assert.ok(csp, "Content-Security-Policy header should be present");
    assert.match(csp!, /frame-ancestors 'none'/);
    assert.match(csp!, /object-src 'none'/);
  });

  it("includes 'unsafe-eval' in script-src only when isDev is true", () => {
    const devHeaders = buildSecurityHeaders({
      isDev: true,
      supabaseOrigin: hostedSupabaseOrigin,
    });
    const devCsp = getHeader(devHeaders, "Content-Security-Policy")!;
    const devScriptSrc = devCsp
      .split(";")
      .find((d) => d.trim().startsWith("script-src"));
    assert.match(devScriptSrc!, /'unsafe-eval'/);

    const prodHeaders = buildSecurityHeaders({
      isDev: false,
      supabaseOrigin: hostedSupabaseOrigin,
    });
    const prodCsp = getHeader(prodHeaders, "Content-Security-Policy")!;
    const prodScriptSrc = prodCsp
      .split(";")
      .find((d) => d.trim().startsWith("script-src"));
    assert.doesNotMatch(prodScriptSrc!, /'unsafe-eval'/);
  });

  it("includes the hosted Supabase origin in connect-src", () => {
    const headers = buildSecurityHeaders({
      isDev: false,
      supabaseOrigin: hostedSupabaseOrigin,
    });
    const csp = getHeader(headers, "Content-Security-Policy")!;
    const connectSrc = csp
      .split(";")
      .find((d) => d.trim().startsWith("connect-src"));
    assert.match(connectSrc!, /https:\/\/abcdefgh\.supabase\.co/);
  });

  it("includes the hosted Supabase origin in img-src", () => {
    const headers = buildSecurityHeaders({
      isDev: false,
      supabaseOrigin: hostedSupabaseOrigin,
    });
    const csp = getHeader(headers, "Content-Security-Policy")!;
    const imgSrc = csp.split(";").find((d) => d.trim().startsWith("img-src"));
    assert.match(imgSrc!, /https:\/\/abcdefgh\.supabase\.co/);
  });

  it("includes the local Supabase protocol and port in connect-src and img-src", () => {
    const headers = buildSecurityHeaders({
      isDev: false,
      supabaseOrigin: localSupabaseOrigin,
    });
    const csp = getHeader(headers, "Content-Security-Policy")!;
    const connectSrc = csp
      .split(";")
      .find((d) => d.trim().startsWith("connect-src"));
    const imgSrc = csp.split(";").find((d) => d.trim().startsWith("img-src"));
    assert.match(connectSrc!, /http:\/\/127\.0\.0\.1:54321/);
    assert.match(imgSrc!, /http:\/\/127\.0\.0\.1:54321/);
  });

  it("includes known image hosts in img-src", () => {
    const headers = buildSecurityHeaders({
      isDev: false,
      supabaseOrigin: hostedSupabaseOrigin,
    });
    const csp = getHeader(headers, "Content-Security-Policy")!;
    const imgSrc = csp.split(";").find((d) => d.trim().startsWith("img-src"));
    assert.match(imgSrc!, /https:\/\/s4\.anilist\.co/);
    assert.match(imgSrc!, /https:\/\/img1\.ak\.crunchyroll\.com/);
    assert.match(imgSrc!, /https:\/\/img\.youtube\.com/);
    assert.match(imgSrc!, /https:\/\/i\.ytimg\.com/);
  });

  it("does not include a frame-src directive", () => {
    const headers = buildSecurityHeaders({
      isDev: false,
      supabaseOrigin: hostedSupabaseOrigin,
    });
    const csp = getHeader(headers, "Content-Security-Policy")!;
    assert.doesNotMatch(csp, /frame-src/);
  });

  it("allows Vercel Analytics and Speed Insights origins", () => {
    const headers = buildSecurityHeaders({
      isDev: false,
      supabaseOrigin: hostedSupabaseOrigin,
    });
    const csp = getHeader(headers, "Content-Security-Policy")!;
    const scriptSrc = csp
      .split(";")
      .find((d) => d.trim().startsWith("script-src"))!;
    const connectSrc = csp
      .split(";")
      .find((d) => d.trim().startsWith("connect-src"))!;
    assert.match(scriptSrc, /https:\/\/va\.vercel-scripts\.com/);
    assert.match(connectSrc, /https:\/\/va\.vercel-scripts\.com/);
    assert.match(connectSrc, /https:\/\/vitals\.vercel-insights\.com/);
  });

  it("sets the fixed security headers with correct keys and values", () => {
    const headers = buildSecurityHeaders({
      isDev: false,
      supabaseOrigin: hostedSupabaseOrigin,
    });
    assert.equal(getHeader(headers, "X-Content-Type-Options"), "nosniff");
    assert.equal(getHeader(headers, "X-Frame-Options"), "DENY");
    assert.equal(
      getHeader(headers, "Referrer-Policy"),
      "strict-origin-when-cross-origin",
    );
    assert.equal(
      getHeader(headers, "Permissions-Policy"),
      "camera=(), microphone=(), geolocation=()",
    );
    assert.equal(
      getHeader(headers, "Strict-Transport-Security"),
      "max-age=31536000; includeSubDomains",
    );
  });
});
