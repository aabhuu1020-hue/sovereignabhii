"use client";

import { useEffect, useState } from "react";
import { getAttachmentUrl } from "@/lib/local-content";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Entry = {
  id: string;
  title: string;
  type: string;
  content: string;
  category: string;
  visibility: string;
  date: string;
  fileName?: string;
  attachmentId?: string;
  tags?: string[];
  featured?: boolean;
};

const sections = [
  "All", "Book", "Quote", "Article", "Poetry", "Photo", "Thought"
];

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadLocalContent() {
      try {
        const adminSaved = localStorage.getItem("sovereign-admin-content");

        if (adminSaved) {
          const adminItems = JSON.parse(adminSaved);

          const publicItems: Entry[] = adminItems
            .filter((x: any) =>
              x.status === "Published" &&
              x.visibility === "Public" &&
              x.type !== "Folder"
            )
            .map((x: any) => ({
              id: x.id,
              title: x.title || "",
              type: x.type || "Article",
              content: x.body || "",
              category: x.category || "",
              visibility: x.visibility,
              date: x.createdAt
                ? new Date(x.createdAt).toLocaleDateString("en-IN")
                : "",
              fileName: x.attachment || "",
              attachmentId: x.attachmentId || "",
              tags: Array.isArray(x.tags) ? x.tags : [],
              featured: Boolean(x.featured),
            }));

          if (!cancelled) setEntries(publicItems);

          const results = await Promise.all(
            publicItems.map(async item => {
              if (!item.attachmentId) return null;

              const url = await getAttachmentUrl(item.attachmentId);
              return url ? [item.id, url] as const : null;
            })
          );

          if (!cancelled) {
            const urls: Record<string, string> = {};
            results.forEach(result => {
              if (result) urls[result[0]] = result[1];
            });
            setAttachmentUrls(urls);
          }

          return;
        }

        const legacy = localStorage.getItem("sovereign-author-entries");

        if (!cancelled) {
          setEntries(
            legacy
              ? JSON.parse(legacy).filter(
                  (x: Entry) => x.visibility === "Public"
                )
              : []
          );
        }
      } catch {
        if (!cancelled) setEntries([]);
      }
    }

    async function loadPublicContent() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        await loadLocalContent();
        return;
      }

      const { data, error } = await supabase
        .from("content_items")
        .select("id, title, body, type, category, status, visibility, attachment_path, created_at, tags, featured")
        .eq("status", "Published")
        .eq("visibility", "Public")
        .neq("type", "Folder")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Supabase content loading failed:", error.message);
        await loadLocalContent();
        return;
      }

      const cloudEntries: Entry[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title || "",
        type: item.type || "Article",
        content: item.body || "",
        category: item.category || "",
        visibility: item.visibility || "Public",
        date: item.created_at
          ? new Date(item.created_at).toLocaleDateString("en-IN")
          : "",
        fileName: item.attachment_path
          ? item.attachment_path.split("/").pop()
          : "",
        tags: Array.isArray(item.tags) ? item.tags : [],
        featured: Boolean(item.featured),
      }));

      setEntries(cloudEntries);

      // Generate secure temporary URLs for private cloud attachments.
      const attachmentResults = await Promise.all(
        (data || []).map(async (item: any) => {
          if (!item.attachment_path) return null;

          const { data: fileData, error: fileError } = await supabase.storage
            .from("sovereignabhii-files")
            .createSignedUrl(item.attachment_path, 3600);

          if (fileError) {
            console.error("Attachment URL failed:", fileError.message);
            return null;
          }

          return fileData?.signedUrl
            ? [item.id, fileData.signedUrl] as const
            : null;
        })
      );

      if (cancelled) return;

      const urls: Record<string, string> = {};

      attachmentResults.forEach(result => {
        if (result) {
          urls[result[0]] = result[1];
        }
      });

      setAttachmentUrls(urls);
    }

    loadPublicContent();

    window.addEventListener("focus", loadPublicContent);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadPublicContent);
    };
  }, []);

  const featuredEntries = entries.filter(item => item.featured).slice(0, 3);
  const categories = Array.from(new Set(entries.map(item => item.category.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const allTags = Array.from(new Set(entries.flatMap(item => item.tags || []).map(tag => tag.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const filtered = entries.filter(item => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term ||
      item.title.toLowerCase().includes(term) ||
      item.content.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      (item.tags || []).some(tag => tag.toLowerCase().includes(term));
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesTag = !selectedTag || (item.tags || []).includes(selectedTag);
    return (active === "All" || item.type === active) && matchesSearch && matchesCategory && matchesTag;
  }).sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

  return (
    <main>
      <header className="topbar">
        <a className="logo" href="#">
          <span>S.</span> SOVEREIGNABHII
        </a>
        <nav>
          <a href="#library">Library</a>
          <a href="/about">About Author</a>
          <a href="/contact">Contact</a>
          <a
            href="https://www.instagram.com/izabhishekk/"
            target="_blank"
            rel="noreferrer"
          >
            Instagram ↗
          </a>
        </nav>
      </header>

      <section className="hero">
        <small>THE PERSONAL WORLD OF WORDS & IDEAS</small>
        <h1>A WORLD<br/>OF <i>WORDS.</i></h1>
        <p>A home for literature, thoughts, poetry, stories and ideas.</p>
        <a className="light-btn" href="#library">
          EXPLORE THE LIBRARY ↗
        </a>
        <div className="hero-bottom">
          <span>AUTHOR & CREATOR</span>
          <span>EST. 2026</span>
        </div>
      </section>

      <section className="author-strip" id="author">
        <div className="avatar">A</div>
        <div>
          <small>THE AUTHOR</small>
          <h2>Abhishek Pandey</h2>
          <p>Writer · Thinker · Independent Creator</p>
        </div>
        <a
          className="insta"
          href="https://www.instagram.com/izabhishekk/"
          target="_blank"
          rel="noreferrer"
        >
          FOLLOW ON INSTAGRAM ↗
        </a>
      </section>

      <section className="library" id="library">
        <div className="section-heading">
          <small>THE COLLECTION</small>
          <h2>Explore the Library.</h2>
          <p>Read, discover and explore published works.</p>
        </div>

        {featuredEntries.length > 0 && (
          <section className="featured-works" aria-label="Featured works">
            <div className="featured-works-heading">
              <small>SELECTED BY THE AUTHOR</small>
              <h3>Featured <i>Works.</i></h3>
            </div>
            <div className="featured-works-grid">
              {featuredEntries.map(item => (
                <a className="featured-work-card" href={`/read/${item.id}`} key={item.id}>
                  <small>{item.type.toUpperCase()}</small>
                  <strong>{item.title}</strong>
                  <span>READ WORK ↗</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="filters">
          {sections.map(s => (
            <button
              key={s}
              className={active === s ? "selected" : ""}
              onClick={() => setActive(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="library-tools">
          <input
            className="search"
            placeholder="Search title, writing, category or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select aria-label="Filter by category" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="All">All categories</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
          <select aria-label="Filter by tag" value={selectedTag} onChange={e => setSelectedTag(e.target.value)}>
            <option value="">All tags</option>
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          {(search || selectedCategory !== "All" || selectedTag) && (
            <button className="clear-library-filters" onClick={() => { setSearch(""); setSelectedCategory("All"); setSelectedTag(""); }}>CLEAR FILTERS</button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <span>✳</span>
            <h3>The collection is growing.</h3>
            <p>
              New books, thoughts and writings will appear here
              as they are published.
            </p>
          </div>
        ) : (
          <div className="entries">
            {filtered.map(item => (
              <article className="entry" key={item.id}>
                <small>
                  {item.type.toUpperCase()} ·
                  {" "}{(item.category || "GENERAL").toUpperCase()}
                </small>
                {item.featured && <span className="public-featured-label">EDITOR'S PICK</span>}
                <h3>{item.title}</h3>
                <p>{item.content}</p>
                {(item.tags || []).length > 0 && <div className="public-tags">{(item.tags || []).map(tag => <button type="button" key={tag} onClick={() => { setSelectedTag(tag); setActive("All"); }}>{`#${tag}`}</button>)}</div>}

                {item.fileName && (
                  <div className="public-attachment">
                    {attachmentUrls[item.id] &&
                    /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(item.fileName) ? (
                      <img
                        src={attachmentUrls[item.id]}
                        alt={item.title}
                        className="public-image-preview"
                      />
                    ) : attachmentUrls[item.id] ? (
                      <a
                        href={attachmentUrls[item.id]}
                        target="_blank"
                        rel="noreferrer"
                        className="public-file-link"
                      >
                        OPEN PDF / ATTACHMENT ↗
                      </a>
                    ) : (
                      <p>Attachment: {item.fileName}</p>
                    )}
                  </div>
                )}

                <span>{item.date}</span>
                <a className="entry-read-link" href={`/read/${item.id}`}>
                  OPEN WORK ↗
                </a>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="manifesto">
        <small>THE PHILOSOPHY</small>
        <h2>Words remain.<br/><i>Everything else changes.</i></h2>
        <p>A home for ideas worth keeping.</p>
      </section>

      <footer>
        <a className="logo" href="#">
          <span>S.</span> SOVEREIGNABHII
        </a>
        <a
          href="https://www.instagram.com/izabhishekk/"
          target="_blank"
          rel="noreferrer"
        >
          INSTAGRAM ↗
        </a>
        <small>© 2026 SOVEREIGNABHII</small>
      </footer>
    </main>
  );
}
