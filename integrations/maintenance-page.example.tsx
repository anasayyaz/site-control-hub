// Example /maintenance page for Next.js app router — read query from middleware redirect.

export default function MaintenancePage({
  searchParams,
}: {
  searchParams: { title?: string; message?: string };
}) {
  const title = searchParams.title ?? "Service temporarily unavailable";
  const message =
    searchParams.message ??
    "This site is paused. Please check back later.";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui,sans-serif",
        padding: "2rem",
      }}
    >
      <section style={{ maxWidth: 520, textAlign: "center" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>{title}</h1>
        <p style={{ lineHeight: 1.65, color: "#444" }}>{message}</p>
      </section>
    </main>
  );
}
