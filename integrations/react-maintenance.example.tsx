/**
 * Optional client-side gate. Prefer Next.js middleware or server render when possible.
 *
 * Wrap your root:
 *   <SiteControlGate hubUrl={import.meta.env.VITE_SITE_CONTROL_URL}>
 *     <App />
 *   </SiteControlGate>
 */

import { useEffect, useState, type ReactNode } from "react";

type Status = { enabled: boolean; title: string; message: string };

export function SiteControlGate({
  hubUrl,
  children,
}: {
  hubUrl: string;
  children: ReactNode;
}) {
  const [blocked, setBlocked] = useState<Status | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${hubUrl.replace(/\/$/, "")}/api/v1/status`);
        if (!res.ok) return;
        const data = (await res.json()) as Status;
        if (!cancelled && !data.enabled) setBlocked(data);
      } catch {
        /* fail open — app stays up if hub is unreachable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hubUrl]);

  if (blocked) {
    return (
      <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 560 }}>
        <h1>{blocked.title}</h1>
        <p style={{ lineHeight: 1.6 }}>{blocked.message}</p>
      </main>
    );
  }

  return <>{children}</>;
}
