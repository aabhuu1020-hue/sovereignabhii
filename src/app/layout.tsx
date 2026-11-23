import type { Metadata } from "next";
import "./globals.css";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const siteUrl = rawSiteUrl ? new URL(rawSiteUrl) : undefined;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "SOVEREIGNABHII — Beyond Limits",
    template: "%s | SOVEREIGNABHII",
  },
  description:
    "Explore books, poetry, articles, quotes, thoughts and creative works by SOVEREIGNABHII.",
  applicationName: "SOVEREIGNABHII",
  category: "books and literature",
  keywords: [
    "SOVEREIGNABHII",
    "Abhishek Pandey",
    "Author",
    "Digital Library",
    "Books",
    "Poetry",
    "Articles",
    "Quotes",
    "Literature",
    "Creative Writing",
  ],
  authors: [{ name: "Abhishek Pandey" }],
  creator: "SOVEREIGNABHII",
  publisher: "SOVEREIGNABHII",
  alternates: siteUrl ? { canonical: "/" } : undefined,
  openGraph: {
    type: "website",
    url: siteUrl?.toString(),
    locale: "en_IN",
    title: "SOVEREIGNABHII — Beyond Limits",
    description: "A personal world of words, literature and ideas.",
    siteName: "SOVEREIGNABHII",
  },
  twitter: {
    card: "summary",
    title: "SOVEREIGNABHII — Beyond Limits",
    description: "A home for literature, thoughts and ideas.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
