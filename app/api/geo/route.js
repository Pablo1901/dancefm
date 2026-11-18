import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Resolve the visitor's country. Hosting-platform geo headers take priority
// (zero latency, no third party); otherwise fall back to an IP lookup.
async function resolveCountry(request) {
  const headers = request.headers;

  // Vercel / Cloudflare / generic proxy headers
  const headerCountry =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-geo-country") ||
    headers.get("x-country-code");
  if (headerCountry && headerCountry.length === 2) {
    return headerCountry.toUpperCase();
  }

  const forwardedFor = headers.get("x-forwarded-for") || "";
  const ip =
    forwardedFor.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "";

  // Local/private addresses (development) — nothing to look up.
  if (!ip || !/^[\d.a-fA-F:]+$/.test(ip) || /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fe80:|fd)/.test(ip)) {
    return null;
  }

  try {
    const res = await fetch(
      `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
      { signal: AbortSignal.timeout(3000), cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.country_code === "string" ? data.country_code.toUpperCase() : null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const country = await resolveCountry(request);
  return NextResponse.json(
    { country, language: country === "DE" ? "de" : "en" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
