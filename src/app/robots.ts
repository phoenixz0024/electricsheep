import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/cron/", "/api/health"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || "https://electricsheep.ai"}/sitemap.xml`,
  };
}
