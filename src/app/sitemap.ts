import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];

  const normalizedBase = base.replace(/\/$/, "");
  const pages: MetadataRoute.Sitemap = [
    {
      url: normalizedBase,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${normalizedBase}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${normalizedBase}/contact`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return pages;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await supabase
      .from("content_items")
      .select("id,updated_at,created_at")
      .eq("status", "Published")
      .eq("visibility", "Public")
      .neq("type", "Folder");

    for (const item of data ?? []) {
      pages.push({
        url: `${normalizedBase}/read/${encodeURIComponent(item.id)}`,
        lastModified: item.updated_at || item.created_at || new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error("Sitemap content lookup failed:", error);
  }

  return pages;
}
