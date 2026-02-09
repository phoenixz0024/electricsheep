import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://electricsheep.ai";

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${baseUrl}/dreams`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Add daily dream pages
  const { data } = await supabase
    .from("dreams")
    .select("day_index")
    .order("day_index", { ascending: false });

  if (data) {
    const uniqueDays = [...new Set(data.map((d) => d.day_index))];
    for (const day of uniqueDays) {
      entries.push({
        url: `${baseUrl}/dreams/${day}`,
        lastModified: new Date(day + "T23:59:59Z"),
        changeFrequency: "hourly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
