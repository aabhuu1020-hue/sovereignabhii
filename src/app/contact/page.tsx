import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Connect with SOVEREIGNABHII.",
};

export default function ContactPage() {
  return (
    <main className="information-page">
      <header className="information-header">
        <a href="/" className="information-logo">S. SOVEREIGNABHII</a>
        <a href="/">BACK TO HOME ↗</a>
      </header>

      <section className="information-content">
        <small>GET IN TOUCH</small>
        <h1>Let's <i>Connect.</i></h1>
        <p>
          For questions, feedback, collaborations or general
          communication, connect through the official Instagram profile.
        </p>

        <a
          href="https://www.instagram.com/izabhishekk/"
          target="_blank"
          rel="noreferrer"
          className="information-button"
        >
          CONTACT ON INSTAGRAM ↗
        </a>

        <p className="information-note">
          An online contact form can be connected after backend setup.
        </p>
      </section>

      <footer className="information-footer">
        © 2026 SOVEREIGNABHII
      </footer>
    </main>
  );
}
