"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="system-state">
      <span className="system-mark">S.</span>
      <h1>Something went wrong.</h1>
      <p>Please try loading this page again.</p>
      <button onClick={() => reset()}>TRY AGAIN</button>
      <a href="/">RETURN HOME</a>
    </main>
  );
}
