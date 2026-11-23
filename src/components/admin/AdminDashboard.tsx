"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, BookOpen, Quote, FileText, Image as ImageIcon,
  Folder, Settings, Plus, Search, LogOut, PenSquare, Trash2,
  Menu, X, Pencil, Eye, EyeOff, Save, UploadCloud
} from "lucide-react";

type ContentType =
  | "Book"
  | "Quote"
  | "Article"
  | "Poetry"
  | "Photo"
  | "Folder";

type Status = "Draft" | "Published";
type Visibility = "Public" | "Private";

type ContentItem = {
  id: string;
  title: string;
  body: string;
  type: ContentType;
  category: string;
  status: Status;
  visibility: Visibility;
  attachment: string;
  attachmentId?: string;
  attachmentPath?: string;
  createdAt: string;
  tags: string[];
  featured: boolean;
};

const sections = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Books & PDFs", icon: BookOpen },
  { name: "Quotes", icon: Quote },
  { name: "Articles", icon: FileText },
  { name: "Poetry", icon: PenSquare },
  { name: "Photos & Albums", icon: ImageIcon },
  { name: "Public Folders", icon: Folder },
];

const types: ContentType[] = [
  "Book", "Quote", "Article", "Poetry", "Photo", "Folder"
];

function typeForSection(section: string): ContentType | null {
  const map: Record<string, ContentType> = {
    "Books & PDFs": "Book",
    Quotes: "Quote",
    Articles: "Article",
    Poetry: "Poetry",
    "Photos & Albums": "Photo",
    "Public Folders": "Folder",
  };
  return map[section] || null;
}

const emptyForm = {
  title: "",
  body: "",
  type: "Article" as ContentType,
  category: "",
  status: "Draft" as Status,
  visibility: "Private" as Visibility,
  attachment: "",
  tags: "",
  featured: false,
};

export default function AdminDashboard() {
  const [active, setActive] = useState("Overview");
  const [menu, setMenu] = useState(false);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCloudContent() {
      try {
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          throw new Error("Supabase configuration missing.");
        }

        const { data, error } = await supabase
          .from("content_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!cancelled) {
          setItems((data || []).map((row: any) => ({
            id: row.id,
            title: row.title,
            body: row.body || "",
            type: row.type,
            category: row.category || "",
            status: row.status,
            visibility: row.visibility,
            attachment: row.attachment_path
              ? row.attachment_path.split("/").pop() || ""
              : "",
            attachmentPath: row.attachment_path || undefined,
            createdAt: row.created_at,
            tags: Array.isArray(row.tags) ? row.tags : [],
            featured: Boolean(row.featured),
          })));
        }
      } catch (error) {
        console.error("Cloud content loading failed:", error);
        if (!cancelled) {
          alert("Cloud content could not be loaded. Check your connection.");
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    loadCloudContent();

    return () => {
      cancelled = true;
    };
  }, []);


  // Keep the public website connected to the same content collection.
  useEffect(() => {
    if (!loaded) return;

    const publicItems = items
      .filter(item => item.status === "Published" && item.visibility === "Public")
      .map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        content: item.body,
        category: item.category,
        visibility: item.visibility,
        date: new Date(item.createdAt).toLocaleDateString("en-IN"),
        fileName: item.attachment,
        attachmentId: item.attachmentId,
        tags: item.tags,
        featured: item.featured,
      }));

    localStorage.setItem(
      "sovereign-author-entries",
      JSON.stringify(publicItems)
    );
  }, [items, loaded]);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = "/admin/login";
  }

  const counts = useMemo(() => ({
    total: items.length,
    published: items.filter(x => x.status === "Published").length,
    drafts: items.filter(x => x.status === "Draft").length,
    folders: items.filter(x => x.type === "Folder").length,
  }), [items]);

  const currentType = typeForSection(active);

  const visibleItems = useMemo(() => {
    return items.filter(item => {
      const matchesType = !currentType || item.type === currentType;
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      const matchesFilter = filter === "All" || item.status === filter;
      return matchesType && matchesSearch && matchesFilter;
    });
  }, [items, currentType, search, filter]);

  function openNew(type?: ContentType) {
    setEditingId(null);
    setSelectedFile(null);
    setForm({
      ...emptyForm,
      type: type || currentType || "Article",
    });
    setFormOpen(true);
  }

  function openEdit(item: ContentItem) {
    setEditingId(item.id);
    setSelectedFile(null);
    setForm({
      title: item.title,
      body: item.body,
      type: item.type,
      category: item.category,
      status: item.status,
      visibility: item.visibility,
      attachment: item.attachment,
      tags: item.tags.join(", "),
      featured: item.featured,
    });
    setFormOpen(true);
  }

  async function saveContent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter a title.");
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      alert("Supabase configuration is missing.");
      return;
    }

    const id = editingId || crypto.randomUUID();
    const previous = items.find(x => x.id === id);
    let attachmentPath = previous?.attachmentPath || null;

    try {
      if (selectedFile) {
        const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const newPath = `${id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("sovereignabhii-files")
          .upload(newPath, selectedFile, {
            upsert: false,
            contentType: selectedFile.type || "application/octet-stream",
          });

        if (uploadError) throw uploadError;

        attachmentPath = newPath;
      }

      const payload = {
        title: form.title.trim(),
        body: form.body,
        type: form.type,
        category: form.category,
        status: form.status,
        visibility: form.visibility,
        attachment_path: attachmentPath,
        tags: form.tags.split(",").map(tag => tag.trim()).filter(Boolean).slice(0, 20),
        featured: form.featured,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("content_items")
        .upsert(
          { id, ...payload },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (error) throw error;

      if (previous?.attachmentPath && selectedFile) {
        await supabase.storage
          .from("sovereignabhii-files")
          .remove([previous.attachmentPath]);
      }

      const savedItem: ContentItem = {
        id: data.id,
        title: data.title,
        body: data.body || "",
        type: data.type,
        category: data.category || "",
        status: data.status,
        visibility: data.visibility,
        attachment: data.attachment_path
          ? data.attachment_path.split("/").pop() || ""
          : "",
        attachmentPath: data.attachment_path || undefined,
        createdAt: data.created_at,
        tags: Array.isArray(data.tags) ? data.tags : [],
        featured: Boolean(data.featured),
      };

      setItems(old =>
        editingId
          ? old.map(x => x.id === id ? savedItem : x)
          : [savedItem, ...old]
      );

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setSelectedFile(null);
      alert("Content saved to cloud successfully.");
    } catch (error) {
      console.error("Cloud save failed:", error);
      alert(
        error instanceof Error
          ? `Save failed: ${error.message}`
          : "Cloud save failed. Please try again."
      );
    }
  }

  async function deleteContent(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const item = items.find(x => x.id === id);

    try {
      const { error } = await supabase
        .from("content_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (item?.attachmentPath) {
        const { error: storageError } = await supabase.storage
          .from("sovereignabhii-files")
          .remove([item.attachmentPath]);

        if (storageError) {
          console.error("File cleanup failed:", storageError);
        }
      }

      setItems(old => old.filter(x => x.id !== id));
    } catch (error) {
      console.error("Cloud delete failed:", error);
      alert("Delete failed. Please try again.");
    }
  }

  async function previewAttachment(id: string) {
    const item = items.find(x => x.id === id);
    if (!item?.attachmentPath) {
      alert("Cloud attachment not found.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase.storage
        .from("sovereignabhii-files")
        .createSignedUrl(item.attachmentPath, 3600);

      if (error) throw error;

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Preview failed:", error);
      alert("Could not create a secure preview link.");
    }
  }

  async function togglePublish(item: ContentItem) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const nextStatus =
      item.status === "Published" ? "Draft" : "Published";

    const { error } = await supabase
      .from("content_items")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      alert("Could not update publishing status.");
      return;
    }

    setItems(old => old.map(x =>
      x.id === item.id ? { ...x, status: nextStatus } : x
    ));
  }

  function handleAttachment(file?: File) {
    if (file) {
      setSelectedFile(file);
      setForm(old => ({ ...old, attachment: file.name }));
    }
  }

  return (
    <div className="studio">
      <aside className={`studio-sidebar ${menu ? "studio-open" : ""}`}>
        <div className="studio-brand">
          <span>S.</span> SOVEREIGNABHII
          <button className="studio-close" onClick={() => setMenu(false)}>
            <X size={19}/>
          </button>
        </div>

        <p className="studio-caption">AUTHOR WORKSPACE</p>

        <nav>
          {sections.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                className={active === item.name ? "studio-active" : ""}
                onClick={() => {
                  setActive(item.name);
                  setSearch("");
                  setFilter("All");
                  setFormOpen(false);
                  setMenu(false);
                }}
              >
                <Icon size={17}/>
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="studio-sidebar-bottom">
          <button onClick={() => setActive("Settings")}>
            <Settings size={17}/> Settings
          </button>
          <button onClick={handleLogout}>
            <LogOut size={17}/> Secure Logout
          </button>
          <a href="/">Public Website</a>
        </div>
      </aside>

      <main className="studio-main">
        <header className="studio-header">
          <button className="studio-menu" onClick={() => setMenu(true)}>
            <Menu/>
          </button>
          <div>
            <small>PRIVATE AUTHOR AREA</small>
            <h2>{formOpen ? (editingId ? "Edit Content" : "Create Content") : active}</h2>
          </div>
          <span className="studio-badge">ADMIN STUDIO</span>
        </header>

        <section className="studio-content">

          {formOpen ? (
            <div className="publish-panel">
              <div className="publish-heading">
                <div>
                  <small>CONTENT EDITOR</small>
                  <h1>{editingId ? "Edit your work" : "Create something new"}</h1>
                </div>
                <button className="publish-cancel" onClick={() => setFormOpen(false)}>
                  <X size={17}/> Close
                </button>
              </div>

              <form onSubmit={saveContent} className="publish-form">
                <label>
                  Content Type
                  <select
                    value={form.type}
                    onChange={e => setForm(old => ({
                      ...old, type: e.target.value as ContentType
                    }))}
                  >
                    {types.map(type => <option key={type}>{type}</option>)}
                  </select>
                </label>

                <label>
                  Title
                  <input
                    value={form.title}
                    onChange={e => setForm(old => ({ ...old, title: e.target.value }))}
                    placeholder="Enter title..."
                    required
                  />
                </label>

                <label>
                  Category
                  <input
                    value={form.category}
                    onChange={e => setForm(old => ({ ...old, category: e.target.value }))}
                    placeholder="Enter category..."
                  />
                </label>

                <label>
                  Tags (comma separated)
                  <input
                    value={form.tags}
                    onChange={e => setForm(old => ({ ...old, tags: e.target.value }))}
                    placeholder="literature, reflections, fiction"
                  />
                </label>

                <label className="studio-featured-toggle">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => setForm(old => ({ ...old, featured: e.target.checked }))}
                  />
                  Feature this work on the homepage
                </label>

                <label>
                  Description / Content
                  <textarea
                    rows={9}
                    value={form.body}
                    onChange={e => setForm(old => ({ ...old, body: e.target.value }))}
                    placeholder="Write your content here..."
                  />
                </label>

                <label className="publish-upload">
                  <UploadCloud size={22}/>
                  <span>Choose PDF or Image</span>
                  <small>{selectedFile?.name || form.attachment || "No file selected"}</small>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={e => handleAttachment(e.target.files?.[0])}
                  />
                </label>

                <div className="publish-row">
                  <label>
                    Status
                    <select
                      value={form.status}
                      onChange={e => setForm(old => ({
                        ...old, status: e.target.value as Status
                      }))}
                    >
                      <option>Draft</option>
                      <option>Published</option>
                    </select>
                  </label>

                  <label>
                    Visibility
                    <select
                      value={form.visibility}
                      onChange={e => setForm(old => ({
                        ...old, visibility: e.target.value as Visibility
                      }))}
                    >
                      <option>Private</option>
                      <option>Public</option>
                    </select>
                  </label>
                </div>

                <div className="publish-actions">
                  <button type="button" className="publish-cancel" onClick={() => setFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="publish-save">
                    <Save size={17}/> {editingId ? "Update Content" : "Save Content"}
                  </button>
                </div>
              </form>
            </div>
          ) : active === "Overview" ? (
            <>
              <div className="studio-welcome">
                <div>
                  <small>WELCOME TO YOUR WORKSPACE</small>
                  <h1>Your words.<br/><i>Your world.</i></h1>
                  <p>Manage your complete digital library from one place.</p>
                </div>
                <BookOpen size={75} strokeWidth={0.7}/>
              </div>

              <div className="studio-stats">
                {[
                  ["Total Content", counts.total],
                  ["Published", counts.published],
                  ["Drafts", counts.drafts],
                  ["Folders", counts.folders],
                ].map(([label, value]) => (
                  <div key={label}>
                    <small>{label}</small>
                    <strong>{value}</strong>
                    <span>Saved entries</span>
                  </div>
                ))}
              </div>

              <div className="studio-panel">
                <h3>Content Management</h3>
                <p>Choose a collection or create new content.</p>
                <div className="studio-quick">
                  {sections.slice(1).map(s => (
                    <button key={s.name} onClick={() => setActive(s.name)}>
                      <s.icon size={19}/>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
                <button className="publish-primary" onClick={() => openNew()}>
                  <Plus size={18}/> Create New Content
                </button>
              </div>
            </>
          ) : active === "Settings" ? (
            <div className="studio-panel studio-section">
              <small>WORKSPACE SETTINGS</small>
              <h1>Settings</h1>
              <p>Your Supabase authentication and server-side admin protection are active.</p>
              <div className="studio-empty">
                <Settings size={35}/>
                <h3>Security status</h3>
                <p>Admin routes are protected by server-side session verification. Content access is controlled by Supabase Row Level Security.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="collection-heading">
                <div>
                  <small>YOUR DIGITAL LIBRARY</small>
                  <h1>{active}</h1>
                  <p>Manage your content collection.</p>
                </div>
                <button className="publish-primary" onClick={() => openNew()}>
                  <Plus size={18}/> Add New
                </button>
              </div>

              <div className="collection-toolbar">
                <div className="collection-search">
                  <Search size={17}/>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search content..."
                  />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)}>
                  <option>All</option>
                  <option>Published</option>
                  <option>Draft</option>
                </select>
              </div>

              <div className="content-list">
                {visibleItems.length === 0 ? (
                  <div className="studio-empty">
                    <BookOpen size={35}/>
                    <h3>No content found</h3>
                    <p>Create your first item in this collection.</p>
                    <button className="publish-primary" onClick={() => openNew()}>
                      <Plus size={17}/> Create Content
                    </button>
                  </div>
                ) : visibleItems.map(item => (
                  <article className="content-card" key={item.id}>
                    <div className="content-card-main">
                      <div className="content-card-type">{item.type}</div>
                      <h3>{item.title}</h3>
                      <p>{item.category || "Uncategorized"}</p>
                      {item.featured && <span className="studio-featured-label">FEATURED ON HOMEPAGE</span>}
                      {item.tags.length > 0 && <div className="studio-tag-list">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
                      {item.body && <p className="content-preview">{item.body}</p>}
                      {item.attachment && (
                        <div className="admin-attachment">
                          <small>Attachment: {item.attachment}</small>
                          {item.attachmentPath && (
                            <button
                              type="button"
                              onClick={() => previewAttachment(item.id)}
                            >
                              <Eye size={14}/> Preview
                            </button>
                          )}
                        </div>
                      )}
                      <div className="content-tags">
                        <span className={item.status === "Published" ? "tag-published" : "tag-draft"}>
                          {item.status}
                        </span>
                        <span>{item.visibility === "Public" ? <Eye size={13}/> : <EyeOff size={13}/>} {item.visibility}</span>
                      </div>
                    </div>
                    <div className="content-card-actions">
                      <button title="Edit" onClick={() => openEdit(item)}><Pencil size={16}/></button>
                      <button
                        title={item.status === "Published" ? "Move to Draft" : "Publish"}
                        onClick={() => togglePublish(item)}
                      >
                        <Eye size={16}/>
                      </button>
                      <button title="Delete" onClick={() => deleteContent(item.id)}>
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <footer className="studio-footer">
            SOVEREIGNABHII · PRIVATE AUTHOR WORKSPACE
          </footer>
        </section>
      </main>
    </div>
  );
}
