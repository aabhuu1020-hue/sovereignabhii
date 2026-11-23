import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About the Author",
  description: "Learn about the author behind SOVEREIGNABHII.",
};

export default function AboutPage() {
  return (
    <main className="information-page">
      <header className="information-header">
        <a href="/" className="information-logo">S. SOVEREIGNABHII</a>
        <a href="/">BACK TO HOME ↗</a>
      </header>

      <section className="information-content">
        <small>THE PERSON BEHIND THE WORDS</small>
        <h1>About the <i>Author.</i></h1>
        <h2>Abhishek Pandey</h2>
        <p>Writer · Thinker · Independent Creator</p>

        <div className="information-divider" />

        <p>
          SOVEREIGNABHII is a personal digital space dedicated
          to literature, ideas, creativity and independent expression.
        </p>
        <p>
          It brings together books, poetry, articles, quotes
          and thoughts in one place.
        </p>

        <a
          href="https://www.instagram.com/izabhishekk/"
          target="_blank"
          rel="noreferrer"
          className="information-button"
        >
          CONNECT ON INSTAGRAM ↗
        </a>
      </section>

      <footer className="information-footer">
        © 2026 SOVEREIGNABHII
      </footer>
    </main>
  );
}
