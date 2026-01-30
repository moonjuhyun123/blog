import type { MetadataRoute } from "next";

function getSiteUrl() {
  return process.env.SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
