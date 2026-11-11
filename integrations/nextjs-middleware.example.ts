// Rename to middleware.ts at your Next.js app root and set SITE_CONTROL_URL in env.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const HUB_URL = process.env.SITE_CONTROL_URL?.replace(/\/$/, "");

type SiteStatus = {
  enabled: boolean;
  title: string;
  message: string;
};

async function fetchStatus(): Promise<SiteStatus | null> {
  if (!HUB_URL) return null;
  try {
    const res = await fetch(`${HUB_URL}/api/v1/status`, {
      next: { revalidate: 15 },
    });
    if (!res.ok) return null;
    return (await res.json()) as SiteStatus;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  const status = await fetchStatus();
  if (status && !status.enabled) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    url.searchParams.set("title", status.title);
    url.searchParams.set("message", status.message);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
