import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
      <h1>Page not found</h1>
      <p>Sorry, the page you requested could not be found.</p>
      <Link href="/">Return to the homepage</Link>
    </main>
  );
}
