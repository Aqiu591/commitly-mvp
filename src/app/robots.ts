import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://commitly.app";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/review/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
