import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ReadingPage({ params }: Props) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();

  const { data: item, error } = await supabase
    .from("content_items")
    .select("id,title,body,type,category,status,visibility,attachment_path,created_at")
    .eq("id", id)
    .eq("status", "Published")
    .eq("visibility", "Public")
    .neq("type", "Folder")
    .maybeSingle();

  if (error) {
    console.error("Reading page database error:", error);
    throw new Error("Unable to load this work.");
  }

  if (!item) notFound();

  let fileUrl = "";

  if (item.attachment_path) {
    const { data, error: storageError } = await supabase.storage
      .from("sovereignabhii-files")
      .createSignedUrl(item.attachment_path, 3600);

    if (storageError) {
      console.error("Attachment URL error:", storageError);
    } else {
      fileUrl = data.signedUrl;
    }
  }

  const fileName = item.attachment_path
    ? item.attachment_path.split("/").pop() || ""
    : "";

  const isImage = /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(fileName);

  return (
    <main className="reading-page">
      <header className="reading-topbar">
        <a className="logo" href="/">
          <span>S.</span> SOVEREIGNABHII
        </a>
        <a href="/">← BACK TO LIBRARY</a>
      </header>

      <article className="reading-content">
        <div className="reading-meta">
          {item.type.toUpperCase()} · {(item.category || "GENERAL").toUpperCase()}
        </div>

        <h1>{item.title}</h1>

        <div className="reading-date">
          {item.created_at
            ? new Date(item.created_at).toLocaleDateString("en-IN")
            : ""}
        </div>

        <div className="reading-divider" />

        {item.body && (
          <div className="reading-body">{item.body}</div>
        )}

        {fileName && (
          <section className="reading-attachment">
            {fileUrl && isImage ? (
              <img src={fileUrl} alt={item.title} />
            ) : fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noreferrer">
                OPEN PDF / ATTACHMENT ↗
              </a>
            ) : (
              <p>Attachment temporarily unavailable.</p>
            )}
          </section>
        )}

        <div className="reading-divider" />
        <a className="reading-back" href="/">
          ← EXPLORE MORE WORKS
        </a>
      </article>

      <footer className="reading-footer">
        © 2026 SOVEREIGNABHII
      </footer>
    </main>
  );
}
